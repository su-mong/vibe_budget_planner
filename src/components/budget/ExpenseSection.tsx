import { useState, useEffect, useMemo } from 'react';
import { Receipt, Pencil, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { useBudget } from '../../hooks/useBudget';
import { supabase } from '../../lib/supabase';
import { formatNumber } from '../../utils/format';
import { CATEGORIES } from '../../constants/categories';
import { Category } from '../../types/budget';
import type { ExpenseSubItem } from '../../types/budget';

export function ExpenseSection() {
  const { state, dispatch } = useBudget();
  const isEditing = state.editingSection === 'expense';

  // Sub-items grouped by category
  const subItemsByCategory = useMemo(() => {
    const map: Partial<Record<Category, ExpenseSubItem[]>> = {};
    for (const si of state.expenseSubItems) {
      if (!map[si.category as Category]) map[si.category as Category] = [];
      map[si.category as Category]!.push(si);
    }
    // Sort items within each category, keeping '기타' last
    for (const cat in map) {
      const category = cat as Category;
      map[category] = map[category]!.sort((a, b) => {
        if (a.name === '기타') return 1;
        if (b.name === '기타') return -1;
        return a.order - b.order;
      });
    }
    return map;
  }, [state.expenseSubItems]);

  // Sub-budget amounts indexed by sub_item_id
  const subBudgetMap = useMemo(() => {
    const map: Record<string, number> = {};
    state.monthlySubBudgets
      .filter((sb) => sb.month === state.currentMonth)
      .forEach((sb) => { map[sb.sub_item_id] = sb.amount; });
    return map;
  }, [state.monthlySubBudgets, state.currentMonth]);

  // Accordion open state
  const [expandedCategories, setExpandedCategories] = useState<Set<Category>>(new Set());

  // Edit mode local state: sub_item_id -> amount
  const [editValues, setEditValues] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isEditing) {
      setEditValues({ ...subBudgetMap });
    }
  }, [isEditing]);

  const toggleCategory = (key: Category) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Calculate category total from sub-items
  const getCategoryTotal = (catKey: Category): number => {
    const items = subItemsByCategory[catKey] ?? [];
    const source = isEditing ? editValues : subBudgetMap;
    return items.reduce((sum, si) => sum + (source[si.id] || 0), 0);
  };

  const grandTotal = CATEGORIES.reduce(
    (sum, cat) => sum + getCategoryTotal(cat.key),
    0,
  );

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const subBudgetRows = state.expenseSubItems.map((si) => ({
      user_id: user.id,
      month: state.currentMonth,
      sub_item_id: si.id,
      amount: editValues[si.id] || 0,
    }));

    if (subBudgetRows.length > 0) {
      const { data: savedSubs } = await supabase
        .from('monthly_sub_budgets')
        .upsert(subBudgetRows, { onConflict: 'user_id,month,sub_item_id' })
        .select();

      if (savedSubs) {
        dispatch({
          type: 'SET_MONTHLY_SUB_BUDGETS',
          month: state.currentMonth,
          subBudgets: savedSubs,
        });
      }
    }

    dispatch({ type: 'SET_EDITING_SECTION', section: null });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-default)] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Receipt size={20} className="text-[var(--status-negative)]" />
          <h3 className="font-display text-base font-bold text-[var(--text-primary)]">
            목표 지출
          </h3>
        </div>
        {isEditing ? (
          <button
            onClick={handleSave}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-muted)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--border-default)]"
          >
            <Eye size={16} />
          </button>
        ) : (
          <button
            onClick={() => dispatch({ type: 'SET_EDITING_SECTION', section: 'expense' })}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-muted)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--border-default)]"
          >
            <Pencil size={16} />
          </button>
        )}
      </div>

      {/* Column Headers */}
      <div className="flex items-center border-b border-[var(--border-default)] bg-[#F9FAFB] px-5 py-2.5">
        <span className="flex-1 text-[11px] font-bold text-[var(--text-secondary)]">항목</span>
        <span className="w-[300px] text-right text-[11px] font-bold text-[var(--text-secondary)]">
          예상 지출 금액
        </span>
      </div>

      {/* Category Rows */}
      {CATEGORIES.map((cat, catIdx) => {
        const subItems = subItemsByCategory[cat.key] ?? [];
        const isExpanded = expandedCategories.has(cat.key);
        const hasSubItems = subItems.length > 0;
        const catTotal = getCategoryTotal(cat.key);
        const isLast = catIdx === CATEGORIES.length - 1;

        return (
          <div key={cat.key} className={!isLast ? 'border-b border-[var(--border-default)]' : ''}>
            {/* Category Main Row */}
            <button
              onClick={() => hasSubItems && toggleCategory(cat.key)}
              className={`flex h-11 w-full items-center ${
                isExpanded ? 'bg-[#F9FAFB]' : ''
              } ${!hasSubItems ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="flex flex-1 items-center gap-2 px-3.5">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-[13px] font-medium text-[var(--text-primary)]">
                  {cat.label}
                </span>
                {hasSubItems && (
                  isExpanded
                    ? <ChevronDown size={14} className="text-[var(--text-secondary)]" />
                    : <ChevronRight size={14} className="text-[var(--text-secondary)]" />
                )}
              </div>

              <div className="flex h-full w-[300px] items-center justify-end pr-5">
                {isEditing ? (
                  <div
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-white px-2.5"
                    style={{ width: '100%' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-xs text-[var(--text-tertiary)]">₩</span>
                    <span className="text-xs text-[var(--text-primary)]">
                      {formatNumber(catTotal)}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-[var(--text-primary)]">
                    {formatNumber(catTotal)}
                  </span>
                )}
              </div>
            </button>

            {/* Sub-Item Rows */}
            {isExpanded && subItems.map((si, siIdx) => {
              const isLastSub = siIdx === subItems.length - 1;
              const subAmount = isEditing
                ? (editValues[si.id] || 0)
                : (subBudgetMap[si.id] || 0);

              return (
                <div
                  key={si.id}
                  className="flex h-10 items-center"
                  style={{
                    borderBottom: isLastSub
                      ? '1px solid var(--border-default)'
                      : '1px solid var(--border-light)',
                  }}
                >
                  <div className="flex flex-1 items-center pl-[38px] pr-3.5">
                    <span className="text-xs text-[var(--text-secondary)]">{si.name}</span>
                  </div>

                  <div className="flex h-full w-[300px] items-center justify-end pr-5">
                    {isEditing ? (
                      <div
                        className="flex h-9 w-full items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-white px-2.5"
                      >
                        <span className="text-xs text-[var(--text-tertiary)]">₩</span>
                        <input
                          type="number"
                          value={subAmount || ''}
                          onChange={(e) =>
                            setEditValues((prev) => ({
                              ...prev,
                              [si.id]: Number(e.target.value) || 0,
                            }))
                          }
                          className="w-full bg-transparent text-right text-xs text-[var(--text-primary)] outline-none"
                          placeholder="0"
                        />
                      </div>
                    ) : (
                      <span className="text-[11px] text-[var(--text-secondary)]">
                        {formatNumber(subAmount)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Total Row */}
      <div className="flex items-center border-t border-[var(--border-default)] bg-[#F9FAFB] px-5 py-3">
        <span className="flex-1 text-xs font-bold text-[var(--text-primary)]">
          총 예상 지출
        </span>
        <span className="w-[300px] text-right text-xs font-bold text-[var(--status-negative)]">
          ₩ {formatNumber(grandTotal)}
        </span>
      </div>
    </div>
  );
}
