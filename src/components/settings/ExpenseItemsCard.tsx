import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useBudget } from '../../hooks/useBudget';
import { supabase } from '../../lib/supabase';
import type { Category } from '../../types/budget';
import { CATEGORIES } from '../../constants/categories';
import { Card } from '../shared/Card';
import { CategoryBadge } from '../shared/CategoryBadge';

export function ExpenseItemsCard() {
  const { state, dispatch } = useBudget();
  const [expanded, setExpanded] = useState<Set<Category>>(new Set());

  const toggleCategory = (cat: Category) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const handleAdd = () => {
    dispatch({ type: 'SET_MODAL', modal: { type: 'addExpenseSubItem' } });
  };

  const handleDelete = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('expense_sub_items').delete().eq('id', id).eq('user_id', user.id);
      dispatch({ type: 'DELETE_EXPENSE_SUB_ITEM', id });
    } catch (err) {
      console.error('Failed to delete expense sub item:', err);
    }
  };

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">지출 항목</h3>
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
          const subItems = state.expenseSubItems
            .filter((s) => s.category === catInfo.key)
            .sort((a, b) => {
              if (a.name === '기타') return 1;
              if (b.name === '기타') return -1;
              return a.order - b.order;
            });

          return (
            <div key={catInfo.key}>
              {/* Category header */}
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

              {/* Sub-items */}
              {isExpanded && (
                <ul className="ml-8 space-y-1">
                  {subItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between rounded-lg px-3 py-1.5 hover:bg-[var(--bg-muted)]"
                    >
                      <span className="text-sm text-[var(--text-primary)]">{item.name}</span>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded-lg p-1 text-[var(--text-secondary)] transition-colors hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                  {subItems.length === 0 && (
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
