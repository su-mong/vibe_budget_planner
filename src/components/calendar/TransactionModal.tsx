import { useState, useMemo } from 'react';
import { useBudget } from '../../hooks/useBudget';
import { Category } from '../../types/budget';
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
  const { modalState, expenseSubItems, savingsItems, debtItems, currentMonth } = state;

  const isOpen = modalState.type === 'transaction';
  const modalDate = isOpen ? modalState.date : '';

  const [entryType, setEntryType] = useState<EntryType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [mealCount, setMealCount] = useState<number>(1);
  const [memo, setMemo] = useState<string>('');
  const [runningCompleted, setRunningCompleted] = useState(false);
  const [shouldRecordWeight, setShouldRecordWeight] = useState(false);
  const [bodyWeight, setBodyWeight] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filtered expense sub-items
  const filteredSubItems = useMemo(() => {
    if (!selectedCategory) return [];
    return expenseSubItems
      .filter((item) => item.category === selectedCategory)
      .sort((a, b) => {
        if (a.name === '기타') return 1;
        if (b.name === '기타') return -1;
        return a.order - b.order;
      });
  }, [expenseSubItems, selectedCategory]);

  const isMealExpense = entryType === 'expense' && selectedCategory === Category.LIVING && selectedSubCategory === '식비';
  const parsedBodyWeight = Number(bodyWeight);
  const hasValidBodyWeight =
    bodyWeight.trim() !== '' && Number.isFinite(parsedBodyWeight) && parsedBodyWeight > 0;

  const isValid = useMemo(() => {
    if (entryType === 'exercise') {
      return !shouldRecordWeight || hasValidBodyWeight;
    }

    if (amount <= 0) return false;
    if (entryType === 'expense') {
      return selectedCategory !== null && selectedSubCategory !== '';
    }
    return selectedItemId !== '';
  }, [
    entryType,
    shouldRecordWeight,
    hasValidBodyWeight,
    amount,
    selectedCategory,
    selectedSubCategory,
    selectedItemId,
  ]);

  const handleEntryTypeChange = (type: EntryType) => {
    setEntryType(type);
    setSelectedCategory(null);
    setSelectedSubCategory('');
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
    setSelectedSubCategory('');
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

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (entryType === 'expense') {
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            type: 'expense',
            date: modalDate,
            category: selectedCategory,
            sub_category: selectedSubCategory,
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
      console.error('Failed to add transaction:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={handleClose} title="거래/운동 기록">
      <div className="space-y-5">
        {/* Step 1 - Entry Type Selection */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-[var(--text-secondary)]">유형 선택</h3>
          <div className="grid grid-cols-4 gap-2">
            {ENTRY_TYPE_OPTIONS.map(({ type, label }) => (
              <button
                key={type}
                onClick={() => handleEntryTypeChange(type)}
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
                  {filteredSubItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedSubCategory(item.name)}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        selectedSubCategory === item.name
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
            <div className="flex flex-wrap gap-2">
              {(entryType === 'savings' ? savingsItems : debtItems).map((item) => (
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
        {((entryType === 'expense' && selectedCategory && selectedSubCategory) || 
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
        {((entryType === 'expense' && selectedCategory && selectedSubCategory) || 
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
            확인
          </button>
        </div>
      </div>
    </Modal>
  );
}
