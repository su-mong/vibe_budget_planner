import { useMemo, useState } from 'react';
import { useBudget } from '../../hooks/useBudget';
import { supabase } from '../../lib/supabase';
import type { Category, TransactionItem } from '../../types/budget';
import { CATEGORIES } from '../../constants/categories';
import { Modal } from '../shared/Modal';
import { CategoryDot } from '../shared/CategoryDot';

export function AddTransactionItemModal() {
  const { state, dispatch } = useBudget();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedBudgetItemId, setSelectedBudgetItemId] = useState('');
  const [name, setName] = useState('');

  const isOpen = state.modalState.type === 'addTransactionItem';

  const budgetItems = useMemo(() => {
    if (!selectedCategory) return [];
    return state.budgetItems
      .filter((item) => item.category === selectedCategory)
      .sort((a, b) => {
        if (a.name === '기타') return 1;
        if (b.name === '기타') return -1;
        return a.order - b.order;
      });
  }, [state.budgetItems, selectedCategory]);

  const handleClose = () => {
    setSelectedCategory(null);
    setSelectedBudgetItemId('');
    setName('');
    dispatch({ type: 'SET_MODAL', modal: { type: 'closed' } });
  };

  const handleCategoryChange = (cat: Category) => {
    setSelectedCategory(cat);
    setSelectedBudgetItemId('');
    setName('');
  };

  const handleConfirm = async () => {
    if (!selectedCategory || !selectedBudgetItemId || name.trim().length < 1) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const order = state.transactionItems.filter(
        (item) => item.category === selectedCategory,
      ).length;

      const { data, error } = await supabase
        .from('transaction_items')
        .insert({
          user_id: user.id,
          budget_item_id: selectedBudgetItemId,
          category: selectedCategory,
          name: name.trim(),
          order,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      const item: TransactionItem = {
        id: data.id,
        budget_item_id: data.budget_item_id,
        category: data.category,
        name: data.name,
        order: data.order,
        is_active: data.is_active,
      };

      dispatch({ type: 'ADD_TRANSACTION_ITEM', item });
      handleClose();
    } catch (err) {
      console.error('Failed to add transaction item:', err);
    }
  };

  const isValid =
    selectedCategory !== null && selectedBudgetItemId !== '' && name.trim().length >= 1;

  return (
    <Modal open={isOpen} onClose={handleClose} title="거래 입력 항목 추가">
      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            대분류 선택
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((catInfo) => (
              <label
                key={catInfo.key}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  selectedCategory === catInfo.key
                    ? 'border-[var(--accent-blue)] bg-[var(--accent-blue)]/5'
                    : 'border-[var(--border-default)] hover:bg-[var(--bg-muted)]'
                }`}
              >
                <input
                  type="radio"
                  name="transaction-category"
                  value={catInfo.key}
                  checked={selectedCategory === catInfo.key}
                  onChange={() => handleCategoryChange(catInfo.key)}
                  className="sr-only"
                />
                <CategoryDot category={catInfo.key} />
                <span className="text-[var(--text-primary)]">{catInfo.label}</span>
              </label>
            ))}
          </div>
        </div>

        {selectedCategory && (
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
              연결할 예산 항목
            </label>
            <div className="flex flex-wrap gap-2">
              {budgetItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedBudgetItemId(item.id)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    selectedBudgetItemId === item.id
                      ? 'border-[var(--accent-blue)] bg-amber-50 font-medium text-[var(--accent-blue)]'
                      : 'border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                  }`}
                >
                  {item.name}
                </button>
              ))}
              {budgetItems.length === 0 && (
                <span className="text-sm text-[var(--text-tertiary)]">예산 항목 없음</span>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
            거래 입력 항목명
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="거래 입력 항목명을 입력하세요"
            className="w-full rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="rounded-lg border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)]"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className="rounded-lg bg-[var(--accent-blue)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            확인
          </button>
        </div>
      </div>
    </Modal>
  );
}
