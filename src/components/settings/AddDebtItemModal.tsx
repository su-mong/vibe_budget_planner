import { useState } from 'react';
import { useBudget } from '../../hooks/useBudget';
import { supabase } from '../../lib/supabase';
import type { DebtItem } from '../../types/budget';
import { Modal } from '../shared/Modal';

export function AddDebtItemModal() {
  const { state, dispatch } = useBudget();
  const [name, setName] = useState('');

  const isOpen = state.modalState.type === 'addDebtItem';

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
        .from('debt_items')
        .insert({ user_id: user.id, name: name.trim(), order: state.debtItems.length })
        .select()
        .single();

      if (error) throw error;

      const item: DebtItem = {
        id: data.id,
        name: data.name,
        order: data.order,
      };

      dispatch({ type: 'ADD_DEBT_ITEM', item });
      handleClose();
    } catch (err) {
      console.error('Failed to add debt item:', err);
    }
  };

  return (
    <Modal open={isOpen} onClose={handleClose} title="부채 항목 추가">
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
