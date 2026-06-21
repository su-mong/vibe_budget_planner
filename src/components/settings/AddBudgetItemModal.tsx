import { useState } from 'react';
import { useBudget } from '../../hooks/useBudget';
import { supabase } from '../../lib/supabase';
import type { BudgetItem, Category } from '../../types/budget';
import { CATEGORIES } from '../../constants/categories';
import { Modal } from '../shared/Modal';
import { CategoryDot } from '../shared/CategoryDot';

export function AddBudgetItemModal() {
  const { state, dispatch } = useBudget();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');

  const isOpen = state.modalState.type === 'addBudgetItem';

  const handleClose = () => {
    setSelectedCategory(null);
    setName('');
    dispatch({ type: 'SET_MODAL', modal: { type: 'closed' } });
  };

  const handleCategoryChange = (cat: Category) => {
    setSelectedCategory(cat);
    setName('');
  };

  const handleConfirm = async () => {
    if (!selectedCategory || name.trim().length < 1) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const order = state.budgetItems.filter((item) => item.category === selectedCategory).length;

      const { data, error } = await supabase
        .from('budget_items')
        .insert({
          user_id: user.id,
          category: selectedCategory,
          name: name.trim(),
          order,
        })
        .select()
        .single();

      if (error) throw error;

      const item: BudgetItem = {
        id: data.id,
        category: data.category,
        name: data.name,
        order: data.order,
      };

      dispatch({ type: 'ADD_BUDGET_ITEM', item });
      handleClose();
    } catch (err) {
      console.error('Failed to add budget item:', err);
    }
  };

  const isValid = selectedCategory !== null && name.trim().length >= 1;

  return (
    <Modal open={isOpen} onClose={handleClose} title="예산 항목 추가">
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
                  name="budget-category"
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

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
            예산 항목명
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예산 항목명을 입력하세요"
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
