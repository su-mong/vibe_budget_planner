import { useState } from 'react';
import type { DebtItem } from '../../types/budget';
import { Plus, Trash2 } from 'lucide-react';
import { useBudget } from '../../hooks/useBudget';
import { supabase } from '../../lib/supabase';
import { Card } from '../shared/Card';

export function DebtItemsCard() {
  const { state, dispatch } = useBudget();

  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState('');

  const handleToggleFinished = async (item: DebtItem) => {
    if (savingId) return;
    setSavingId(item.id);
    setSaveError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');
      const { data, error } = await supabase.from('debt_items')
        .update({ is_finished: !item.is_finished })
        .eq('id', item.id).eq('user_id', user.id).select().single();
      if (error) throw error;
      dispatch({ type: 'UPDATE_DEBT_ITEM', item: data });
    } catch (err) {
      console.error('Failed to update debt item:', err);
      setSaveError('상환 완료 상태를 저장하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setSavingId(null);
    }
  };

  const handleAdd = () => {
    dispatch({ type: 'SET_MODAL', modal: { type: 'addDebtItem' } });
  };

  const handleDelete = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('debt_items').delete().eq('id', id).eq('user_id', user.id);
      dispatch({ type: 'DELETE_DEBT_ITEM', id });
    } catch (err) {
      console.error('Failed to delete debt item:', err);
    }
  };

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">부채 항목</h3>
        <button
          onClick={handleAdd}
          className="rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)]"
        >
          <Plus size={20} />
        </button>
      </div>

      <ul className="space-y-2">
        {state.debtItems.map((item) => (
          <li key={item.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[var(--bg-muted)]">
            <span className={`flex-1 text-sm ${item.is_finished ? 'text-gray-400 line-through' : 'text-[var(--text-primary)]'}`}>{item.name}</span>
            <label className="mr-3 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={!!item.is_finished}
                disabled={savingId !== null}
                onChange={() => handleToggleFinished(item)}
                aria-label={`${item.name} 상환 완료`}
              />
              상환 완료
            </label>
            <button
              onClick={() => handleDelete(item.id)}
              className="rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:text-red-500"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
      {saveError && <p role="alert" className="mt-3 text-sm text-[var(--status-negative)]">{saveError}</p>}
    </Card>
  );
}
