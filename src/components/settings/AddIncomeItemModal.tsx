import { useState } from 'react';
import { useBudget } from '../../hooks/useBudget';
import { supabase } from '../../lib/supabase';
import type { IncomeItem } from '../../types/budget';
import { Modal } from '../shared/Modal';

export function AddIncomeItemModal() {
  const { state, dispatch } = useBudget();
  const [name, setName] = useState('');

  const isOpen = state.modalState.type === 'addIncomeItem';

  const handleClose = () => {
    setName('');
    dispatch({ type: 'SET_MODAL', modal: { type: 'closed' } });
  };

  const handleConfirm = async () => {
    if (name.trim().length < 1) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('income_items')
        .insert({ user_id: user.id, name: name.trim(), order: state.incomeItems.length })
        .select()
        .single();

      if (error) throw error;

      const item: IncomeItem = {
        id: data.id,
        name: data.name,
        order: data.order,
      };

      dispatch({ type: 'ADD_INCOME_ITEM', item });
      handleClose();
    } catch (err) {
      console.error('Failed to add income item:', err);
    }
  };

  return (
    <Modal open={isOpen} onClose={handleClose} title="수입 항목 추가">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
            항목명
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="항목명을 입력하세요"
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
            disabled={name.trim().length < 1}
            className="rounded-lg bg-[var(--accent-blue)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            확인
          </button>
        </div>
      </div>
    </Modal>
  );
}
