import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useBudget } from '../../hooks/useBudget';
import { supabase } from '../../lib/supabase';
import type { Category, TransactionItem } from '../../types/budget';
import { CATEGORIES } from '../../constants/categories';
import { Card } from '../shared/Card';
import { CategoryBadge } from '../shared/CategoryBadge';

export function TransactionItemsCard() {
  const { state, dispatch } = useBudget();
  const [expanded, setExpanded] = useState<Set<Category>>(new Set());

  const budgetItemNameMap = new Map(state.budgetItems.map((item) => [item.id, item.name]));

  const toggleCategory = (cat: Category) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleAdd = () => {
    dispatch({ type: 'SET_MODAL', modal: { type: 'addTransactionItem' } });
  };

  const handleDelete = async (item: TransactionItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingTransaction } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('transaction_item_id', item.id)
        .limit(1)
        .maybeSingle();

      if (existingTransaction) {
        const { data, error } = await supabase
          .from('transaction_items')
          .update({ is_active: false })
          .eq('id', item.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        dispatch({ type: 'UPDATE_TRANSACTION_ITEM', item: data });
        return;
      }

      const { error } = await supabase
        .from('transaction_items')
        .delete()
        .eq('id', item.id)
        .eq('user_id', user.id);

      if (error) throw error;
      dispatch({ type: 'DELETE_TRANSACTION_ITEM', id: item.id });
    } catch (err) {
      console.error('Failed to delete transaction item:', err);
    }
  };

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">거래 입력 항목</h3>
        <button
          onClick={handleAdd}
          className="rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)]"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-1">
        {CATEGORIES.map((catInfo) => {
          const isExpanded = expanded.has(catInfo.key);
          const transactionItems = state.transactionItems
            .filter((item) => item.category === catInfo.key)
            .sort((a, b) => {
              if (a.name === '기타') return 1;
              if (b.name === '기타') return -1;
              return a.order - b.order;
            });

          return (
            <div key={catInfo.key}>
              <button
                onClick={() => toggleCategory(catInfo.key)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--bg-muted)]"
              >
                {isExpanded ? (
                  <ChevronDown size={16} className="shrink-0 text-[var(--text-secondary)]" />
                ) : (
                  <ChevronRight size={16} className="shrink-0 text-[var(--text-secondary)]" />
                )}
                <CategoryBadge category={catInfo.key} />
                <span className="text-sm text-[var(--text-primary)]">{catInfo.label}</span>
              </button>

              {isExpanded && (
                <ul className="ml-8 space-y-1">
                  {transactionItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between rounded-lg px-3 py-1.5 hover:bg-[var(--bg-muted)]"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm ${
                              item.is_active
                                ? 'text-[var(--text-primary)]'
                                : 'text-[var(--text-tertiary)] line-through'
                            }`}
                          >
                            {item.name}
                          </span>
                          {!item.is_active && (
                            <span className="rounded bg-[var(--bg-muted)] px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)]">
                              비활성
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[var(--text-tertiary)]">
                          예산 항목: {budgetItemNameMap.get(item.budget_item_id) ?? '-'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(item)}
                        disabled={!item.is_active}
                        className="rounded-lg p-1 text-[var(--text-secondary)] transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                  {transactionItems.length === 0 && (
                    <li className="px-3 py-1.5 text-sm text-[var(--text-tertiary)]">항목 없음</li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
