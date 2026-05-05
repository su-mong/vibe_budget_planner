import { Plus, Trash2 } from 'lucide-react';
import { useBudget } from '../../hooks/useBudget';
import { supabase } from '../../lib/supabase';
import { Card } from '../shared/Card';

export function DebtItemsCard() {
  const { state, dispatch } = useBudget();

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
            <span className="text-sm text-[var(--text-primary)]">{item.name}</span>
            <button
              onClick={() => handleDelete(item.id)}
              className="rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:text-red-500"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
