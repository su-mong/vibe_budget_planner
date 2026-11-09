import { useState, useMemo } from 'react';
import { useBudget } from '../../hooks/useBudget';
import type { Category } from '../../types/budget';
import { CATEGORIES } from '../../constants/categories';
import { formatNumber } from '../../utils/format';
import { supabase } from '../../lib/supabase';
import { Modal } from '../shared/Modal';
import { CategoryDot } from '../shared/CategoryDot';

type EntryType = 'expense' | 'savings' | 'debt' | 'exercise';

const ENTRY_TYPE_OPTIONS: { type: EntryType; label: string }[] = [
  { type: 'expense', label: '지출' },
  { type: 'savings', label: '저축' },
  { type: 'debt', label: '부채' },
  { type: 'exercise', label: '운동' },
];

export function TransactionModal() {
  const { state, dispatch } = useBudget();
  const { modalState, transactionItems, savingsItems, debtItems, currentMonth } = state;

  const isOpen = modalState.type === 'transaction';
  const modalDate = isOpen ? modalState.date : '';

  const editing = isOpen ? modalState.editing : undefined;
  const originalExpense = editing?.type === 'expense' ? editing.record : undefined;
  const originalTransactionItem = originalExpense
    ? transactionItems.find(item => originalExpense.transaction_item_id
      ? item.id === originalExpense.transaction_item_id
      : item.category === originalExpense.category && item.name === originalExpense.sub_category)
    : undefined;

  const [entryType, setEntryType] = useState<EntryType>(editing?.type ?? 'expense');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(originalExpense?.category ?? null);
  const [selectedTransactionItemId, setSelectedTransactionItemId] = useState<string>(originalTransactionItem?.id ?? '');
  const [selectedItemId, setSelectedItemId] = useState<string>(editing && editing.type !== 'expense' ? editing.record.item_id : '');
  const [amount, setAmount] = useState<number>(editing ? editing.type === 'expense' ? editing.record.amount : editing.record.actual : 0);
  const [mealCount, setMealCount] = useState<number>(originalExpense?.meal_count ?? 1);
  const [memo, setMemo] = useState<string>(editing?.record.memo ?? '');
  const [submitError, setSubmitError] = useState('');
  const [runningCompleted, setRunningCompleted] = useState(false);
  const [shouldRecordWeight, setShouldRecordWeight] = useState(false);
  const [bodyWeight, setBodyWeight] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredTransactionItems = useMemo(() => {
    if (!selectedCategory) return [];
    return transactionItems
      .filter((item) => item.category === selectedCategory && (item.is_active || item.id === originalTransactionItem?.id))
      .sort((a, b) => {
        if (a.name === '기타') return 1;
        if (b.name === '기타') return -1;
        return a.order - b.order;
      });
  }, [transactionItems, selectedCategory, originalTransactionItem?.id]);

  const selectedTransactionItem = useMemo(
    () => transactionItems.find((item) => item.id === selectedTransactionItemId) ?? null,
    [transactionItems, selectedTransactionItemId],
  );

  // Older records may no longer have a selectable transaction item.
  const keepingOriginalExpense = !!originalExpense && !selectedTransactionItemId && selectedCategory === originalExpense.category;
  const hasExpenseItem = selectedTransactionItem !== null || keepingOriginalExpense;

  const isMealExpense = entryType === 'expense' && (selectedTransactionItem?.name ?? (keepingOriginalExpense ? originalExpense?.sub_category : undefined)) === '식비';
  const parsedBodyWeight = Number(bodyWeight);
  const hasValidBodyWeight =
    bodyWeight.trim() !== '' && Number.isFinite(parsedBodyWeight) && parsedBodyWeight > 0;

  const isValid = useMemo(() => {
    if (entryType === 'exercise') {
      return !shouldRecordWeight || hasValidBodyWeight;
    }

    if (amount <= 0) return false;
    if (entryType === 'expense') {
      return selectedCategory !== null && hasExpenseItem;
    }
    if (entryType === 'debt') {
      return debtItems.some(item => item.id === selectedItemId && !item.is_finished)
        || (editing?.type === 'debt' && selectedItemId === editing.record.item_id);
    }
    return selectedItemId !== '';
  }, [
    entryType,
    shouldRecordWeight,
    hasValidBodyWeight,
    amount,
    selectedCategory,
    hasExpenseItem,
    selectedItemId,
    debtItems,
    editing,
  ]);

  const handleEntryTypeChange = (type: EntryType) => {
    setEntryType(type);
    setSelectedCategory(null);
    setSelectedTransactionItemId('');
    setSelectedItemId('');
    setAmount(0);
    setMealCount(1);
    setMemo('');
    setRunningCompleted(false);
    setShouldRecordWeight(false);
    setBodyWeight('');
  };

  const handleCategoryChange = (category: Category) => {
    setSelectedCategory(category);
    setSelectedTransactionItemId('');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '').replace(/[^0-9]/g, '');
    setAmount(raw === '' ? 0 : Number(raw));
  };

  const handleBodyWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    const [integerPart, ...decimalParts] = raw.split('.');
    setBodyWeight(decimalParts.length > 0 ? `${integerPart}.${decimalParts.join('')}` : integerPart);
  };

  const handleWeightRecordChange = (checked: boolean) => {
    setShouldRecordWeight(checked);
    if (!checked) {
      setBodyWeight('');
    }
  };

  const handleClose = () => {
    handleEntryTypeChange('expense');
    dispatch({ type: 'SET_MODAL', modal: { type: 'closed' } });
  };

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      if (editing) {
        if (editing.type === 'expense') {
          const { data, error } = await supabase.from('transactions')
            .update({
              transaction_item_id: selectedTransactionItem?.id ?? originalExpense?.transaction_item_id ?? null,
              category: selectedTransactionItem?.category ?? originalExpense!.category,
              sub_category: selectedTransactionItem?.name ?? originalExpense!.sub_category,
              amount,
              meal_count: isMealExpense ? mealCount : null,
              memo: memo.trim() || null,
            }).eq('id', editing.record.id).select().single();
          if (error) throw error;
          dispatch({ type: 'UPDATE_TRANSACTION', transaction: data });
        } else {
          const { data, error } = await supabase
            .from(editing.type === 'savings' ? 'monthly_savings' : 'monthly_debts')
            .update({ item_id: selectedItemId, actual: amount, memo: memo.trim() || null })
            .eq('id', editing.record.id).select().single();
          if (error) throw error;
          if (editing.type === 'savings') dispatch({ type: 'UPSERT_MONTHLY_SAVINGS', savings: data });
          else dispatch({ type: 'UPSERT_MONTHLY_DEBT', debt: data });
        }
      } else if (entryType === 'expense') {
        if (!selectedTransactionItem) return;

        const { data, error } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            type: 'expense',
            date: modalDate,
            transaction_item_id: selectedTransactionItem.id,
            category: selectedTransactionItem.category,
            sub_category: selectedTransactionItem.name,
            amount,
            meal_count: isMealExpense ? mealCount : null,
            memo: memo.trim() || null,
          })
          .select()
          .single();

        if (error) throw error;
        dispatch({ type: 'ADD_TRANSACTION', transaction: data });
      } else if (entryType === 'savings') {
        const { data, error } = await supabase
          .from('monthly_savings')
          .insert({
            user_id: user.id,
            month: currentMonth,
            item_id: selectedItemId,
            budget: 0,
            actual: amount,
            date: modalDate,
            memo: memo.trim() || null,
          })
          .select()
          .single();

        if (error) throw error;
        dispatch({ type: 'UPSERT_MONTHLY_SAVINGS', savings: { ...data, date: data.date } });
      } else if (entryType === 'debt') {
        const { data, error } = await supabase
          .from('monthly_debts')
          .insert({
            user_id: user.id,
            month: currentMonth,
            item_id: selectedItemId,
            budget: 0,
            actual: amount,
            date: modalDate,
            memo: memo.trim() || null,
          })
          .select()
          .single();

        if (error) throw error;
        dispatch({ type: 'UPSERT_MONTHLY_DEBT', debt: { ...data, date: data.date } });
      } else if (entryType === 'exercise') {
        const { data, error: exerciseError } = await supabase
          .from('exercise_records')
          .upsert(
            {
              user_id: user.id,
              date: modalDate,
              running_completed: runningCompleted,
              memo: memo.trim() || null,
            },
            { onConflict: 'user_id,date' }
          )
          .select()
          .single();

        if (exerciseError) throw exerciseError;
        dispatch({ type: 'UPSERT_EXERCISE_RECORD', record: data });

        if (shouldRecordWeight) {
          const { error: bodyWeightError } = await supabase
            .from('body_weight_records')
            .upsert(
              {
                user_id: user.id,
                date: modalDate,
                weight_kg: parsedBodyWeight,
              },
              { onConflict: 'user_id,date' }
            );

          if (bodyWeightError) throw bodyWeightError;
        }
      }

      handleClose();
    } catch (err) {
      console.error('Failed to save transaction:', err);
      setSubmitError('저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={handleClose} title={editing ? '거래 수정' : '거래/운동 기록'}>
      <div className="space-y-5">
        {/* Step 1 - Entry Type Selection */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-[var(--text-secondary)]">유형 선택</h3>
          <div className="grid grid-cols-4 gap-2">
            {ENTRY_TYPE_OPTIONS.filter(option => !editing || option.type === editing.type).map(({ type, label }) => (
              <button
                key={type}
                onClick={() => { if (!editing) handleEntryTypeChange(type); }}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  entryType === type
                    ? 'border-[var(--accent-blue)] bg-amber-50 font-medium text-[var(--accent-blue)]'
                    : 'border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 - Item Selection based on type */}
        {entryType === 'expense' ? (
          <>
            <div>
              <h3 className="mb-2 text-sm font-medium text-[var(--text-secondary)]">항목 선택</h3>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => handleCategoryChange(cat.key)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      selectedCategory === cat.key
                        ? 'border-[var(--accent-blue)] bg-amber-50 font-medium text-[var(--accent-blue)]'
                        : 'border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                    }`}
                  >
                    <CategoryDot category={cat.key} />
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedCategory && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
                  세부 항목 선택
                </h3>
                <div className="flex flex-wrap gap-2">
                  {keepingOriginalExpense && <span className="px-3 py-1.5 text-sm text-[var(--text-secondary)]">{originalExpense.sub_category} (기존 항목)</span>}
                  {filteredTransactionItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedTransactionItemId(item.id)}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        selectedTransactionItemId === item.id
                          ? 'border-[var(--accent-blue)] bg-amber-50 font-medium text-[var(--accent-blue)]'
                          : 'border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : entryType === 'savings' || entryType === 'debt' ? (
          <div>
            <h3 className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
              {entryType === 'savings' ? '저축 항목 선택' : '부채 항목 선택'}
            </h3>
            {entryType === 'debt' && editing?.type === 'debt' && debtItems.some(item => item.id === selectedItemId && item.is_finished) && (
              <p className="mb-2 text-sm text-gray-400">
                {debtItems.find(item => item.id === selectedItemId)?.name} (상환 완료)
              </p>
            )}
            {entryType === 'debt' && !debtItems.some(item => !item.is_finished) && !editing && (
              <p className="text-sm text-[var(--text-secondary)]">상환 중인 부채 항목이 없습니다.</p>
            )}
            <div className="flex flex-wrap gap-2">
              {(entryType === 'savings' ? savingsItems : debtItems.filter(item => !item.is_finished)).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    selectedItemId === item.id
                      ? 'border-[var(--accent-blue)] bg-amber-50 font-medium text-[var(--accent-blue)]'
                      : 'border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        ) : entryType === 'exercise' ? (
          <div>
            <h3 className="mb-2 text-sm font-medium text-[var(--text-secondary)]">세부 항목</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={runningCompleted}
                  onChange={(e) => setRunningCompleted(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--border-default)] text-[var(--accent-blue)] focus:ring-[var(--accent-blue)]"
                />
                러닝 완료
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={shouldRecordWeight}
                  onChange={(e) => handleWeightRecordChange(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--border-default)] text-[var(--accent-blue)] focus:ring-[var(--accent-blue)]"
                />
                몸무게 기록
              </label>
              <div>
                <h3 className="mb-2 text-sm font-medium text-[var(--text-secondary)]">메모</h3>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="메모를 입력하세요 (선택 사항)"
                  className="w-full rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-blue)]"
                />
              </div>
            </div>
          </div>
        ) : null}

        {entryType === 'exercise' && shouldRecordWeight && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-[var(--text-secondary)]">몸무게 입력</h3>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={bodyWeight}
                onChange={handleBodyWeightChange}
                placeholder="몸무게를 입력하세요"
                className="w-full rounded-lg border border-[var(--border-default)] px-3 py-2 pr-8 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-blue)]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-tertiary)]">
                kg
              </span>
            </div>
          </div>
        )}

        {/* Step 3 - Amount input */}
        {((entryType === 'expense' && selectedCategory && hasExpenseItem) ||
          (entryType !== 'expense' && selectedItemId)) && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
              {entryType === 'expense' ? '가격 입력' : entryType === 'savings' ? '저축액 입력' : '납부액 입력'}
            </h3>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={amount > 0 ? formatNumber(amount) : ''}
                onChange={handleAmountChange}
                placeholder="금액을 입력하세요"
                className="w-full rounded-lg border border-[var(--border-default)] px-3 py-2 pr-8 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-blue)]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-tertiary)]">
                원
              </span>
            </div>
          </div>
        )}

        {/* Step 4 - Meal count (only for 식비) */}
        {isMealExpense && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-[var(--text-secondary)]">끼니 수</h3>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={mealCount}
                onChange={(e) => setMealCount(Number(e.target.value.replace(/[^0-9]/g, '')) || 1)}
                placeholder="1"
                className="w-full rounded-lg border border-[var(--border-default)] px-3 py-2 pr-8 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-blue)]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-tertiary)]">
                끼
              </span>
            </div>
          </div>
        )}

        {/* Step 5 - Memo input */}
        {((entryType === 'expense' && selectedCategory && hasExpenseItem) ||
          (entryType !== 'expense' && selectedItemId)) && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-[var(--text-secondary)]">메모 입력</h3>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="메모를 입력하세요 (선택 사항)"
              rows={2}
              className="w-full resize-none rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-blue)]"
            />
          </div>
        )}

        {submitError && <p role="alert" className="text-sm text-[var(--status-negative)]">{submitError}</p>}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={handleClose}
            className="rounded-lg border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)]"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="rounded-lg bg-[var(--accent-blue)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? '저장 중...' : editing ? '저장' : '확인'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
