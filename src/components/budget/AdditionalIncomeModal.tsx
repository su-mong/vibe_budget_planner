import { useState } from 'react';
import { Modal } from '../shared/Modal';
import { useBudget } from '../../hooks/useBudget';
import { supabase } from '../../lib/supabase';
import type { AdditionalIncome } from '../../types/budget';

export function AdditionalIncomeModal() {
  const { state, dispatch } = useBudget();
  const isOpen = state.modalState.type === 'additionalIncome';

  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState('');

  const handleClose = () => {
    setName('');
    setAmount(0);
    setDate('');
    dispatch({ type: 'SET_MODAL', modal: { type: 'closed' } });
  };

  const handleSubmit = async () => {
    if (!name.trim() || !amount) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('additional_incomes')
      .insert({
        user_id: user.id,
        month: state.currentMonth,
        name: name.trim(),
        amount,
        date: date || null,
      })
      .select()
      .single();

    if (error || !data) return;

    const newIncome: AdditionalIncome = {
      id: data.id,
      month: data.month,
      name: data.name,
      amount: data.amount,
      date: data.date,
    };

    dispatch({ type: 'ADD_ADDITIONAL_INCOME', income: newIncome });
    handleClose();
  };

  const isValid = name.trim().length > 0 && amount > 0;

  return (
    <Modal open={isOpen} onClose={handleClose} title="추가 수입 입력">
      <div className="space-y-4">
        {/* Name field */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
            항목명
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]"
            placeholder="항목명을 입력하세요"
          />
        </div>

        {/* Amount field */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
            금액
          </label>
          <input
            type="number"
            value={amount || ''}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="w-full rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]"
            placeholder="0"
          />
        </div>

        {/* Date field */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
            날짜
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleClose}
            className="flex-1 rounded-lg border border-[var(--border-default)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)]"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="flex-1 rounded-lg bg-[var(--accent-blue)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            확인
          </button>
        </div>
      </div>
    </Modal>
  );
}
