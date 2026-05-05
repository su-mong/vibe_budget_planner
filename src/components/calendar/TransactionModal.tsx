import { useState, useMemo } from 'react';
import { useBudget } from '../../hooks/useBudget';
import { Category } from '../../types/budget';
import { CATEGORIES } from '../../constants/categories';
import { formatNumber } from '../../utils/format';
import { supabase } from '../../lib/supabase';
import { Modal } from '../shared/Modal';
import { CategoryDot } from '../shared/CategoryDot';

export function TransactionModal() {
  const { state, dispatch } = useBudget();
  const { modalState, expenseSubItems } = state;

  const isOpen = modalState.type === 'transaction';
  const modalDate = isOpen ? modalState.date : '';

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [mealCount, setMealCount] = useState<number>(1);
  const [memo, setMemo] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Sub-items filtered by selected category
  const filteredSubItems = useMemo(
    () => {
      if (!selectedCategory) return [];
      return expenseSubItems
        .filter((item) => item.category === selectedCategory)
        .sort((a, b) => {
          if (a.name === '기타') return 1;
          if (b.name === '기타') return -1;
          return a.order - b.order;
        });
    },
    [expenseSubItems, selectedCategory],
  );

  const isValid = selectedCategory !== null && selectedSubCategory !== '' && amount > 0;

  const isMealExpense = selectedCategory === Category.LIVING && selectedSubCategory === '식비';

  const handleCategoryChange = (category: Category) => {
    setSelectedCategory(category);
    setSelectedSubCategory('');
    setAmount(0);
    setMealCount(1);
    setMemo('');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '').replace(/[^0-9]/g, '');
    setAmount(raw === '' ? 0 : Number(raw));
  };

  const handleMealCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const value = raw === '' ? 1 : Math.max(1, Number(raw));
    setMealCount(value);
  };

  const handleClose = () => {
    setSelectedCategory(null);
    setSelectedSubCategory('');
    setAmount(0);
    setMealCount(1);
    setMemo('');
    dispatch({ type: 'SET_MODAL', modal: { type: 'closed' } });
  };

  const handleSubmit = async () => {
    if (!isValid || !selectedCategory || submitting) return;
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
      handleClose();
    } catch (err) {
      console.error('Failed to add transaction:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={handleClose} title="지출 입력">
      <div className="space-y-5">
        {/* Step 1 - Main category selection */}
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

        {/* Step 2 - Sub-category selection */}
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

        {/* Step 3 - Amount input */}
        {selectedCategory && selectedSubCategory && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-[var(--text-secondary)]">가격 입력</h3>
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
                onChange={handleMealCountChange}
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
        {selectedCategory && selectedSubCategory && (
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
