import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useBudget } from '../../hooks/useBudget';
import { CATEGORIES, CATEGORY_MAP } from '../../constants/categories';
import {
  getCategoryActualByTransactionItems,
  getCategoryTotal,
  getCategoryBudget,
  getTransactionCategoryBudget,
  getTransactionItemExpenseSummaries,
  getTotalExpense,
  getTotalBudgetByBudgetItems,
  getTotalBudget,
  getSubCategoryTotals,
  getTotalDebtActual,
  getTotalDebtBudget,
} from '../../utils/calculations';
import { formatNumber } from '../../utils/format';
import { Category } from '../../types/budget';
import { CategoryDot } from '../shared/CategoryDot';

interface SubCategorySummary {
  id: string;
  name: string;
  total: number;
  budget: number;
  budgetItemId?: string;
}

export function CategoryExpenses() {
  const { state } = useBudget();
  const month = state.currentMonth;
  const [expandedCategories, setExpandedCategories] = useState<Set<Category>>(
    () => new Set()
  );

  const totalExpense = getTotalExpense(state.transactions, month);
  const hasBudgetItemData = state.budgetItems.length > 0 || state.monthlyBudgetItems.length > 0;
  const hasTransactionItemData = state.transactionItems.length > 0;
  const totalBudget = hasBudgetItemData
    ? getTotalBudgetByBudgetItems(state.monthlyBudgetItems, month)
    : getTotalBudget(state.monthlySubBudgets, month);
  const totalDebtActual = getTotalDebtActual(state.monthlyDebts, month);
  const totalDebtBudget = getTotalDebtBudget(state.monthlyDebts, month);

  const displayTotalExpense = totalExpense + totalDebtActual;
  const displayTotalBudget = totalBudget + totalDebtBudget;

  const subBudgetMap = useMemo(() => {
    const map: Record<string, number> = {};
    state.monthlySubBudgets
      .filter((sb) => sb.month === month)
      .forEach((sb) => { map[sb.sub_item_id] = sb.amount; });
    return map;
  }, [state.monthlySubBudgets, month]);

  function getOrderedSubCategories(category: Category): SubCategorySummary[] {
    if (hasTransactionItemData) {
      return getTransactionItemExpenseSummaries(
        state.transactions,
        state.transactionItems,
        state.monthlyBudgetItems,
        month,
        category,
      );
    }

    const totalsMap = getSubCategoryTotals(state.transactions, month, category);
    const subItems = state.expenseSubItems
      .filter((si) => si.category === category)
      .sort((a, b) => {
        if (a.name === '기타') return 1;
        if (b.name === '기타') return -1;
        return a.order - b.order;
      });
    const result: { id: string; name: string; total: number; budget: number }[] = [];
    const seen = new Set<string>();

    for (const si of subItems) {
      const total = totalsMap.get(si.name) || 0;
      const budget = subBudgetMap[si.id] || 0;
      if (total > 0 || budget > 0) {
        result.push({ id: si.id, name: si.name, total, budget });
        seen.add(si.name);
      }
    }
    for (const [name, total] of totalsMap.entries()) {
      if (!seen.has(name) && total > 0) {
        result.push({ id: `${category}:${name}`, name, total, budget: 0 });
      }
    }
    return result;
  }

  function getBudgetGroups(subCategories: SubCategorySummary[]) {
    const groups: {
      id: string;
      budget: number;
      items: SubCategorySummary[];
    }[] = [];
    const groupIndexMap = new Map<string, number>();

    for (const sub of subCategories) {
      const groupId = sub.budgetItemId ?? sub.id;
      const groupIndex = groupIndexMap.get(groupId);

      if (groupIndex === undefined) {
        groupIndexMap.set(groupId, groups.length);
        groups.push({
          id: groupId,
          budget: sub.budget,
          items: [sub],
        });
      } else {
        groups[groupIndex].items.push(sub);
      }
    }

    return groups;
  }

  function toggleCategory(category: Category) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-white">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-[var(--border-default)] px-5 py-4">
        <h2 className="text-base font-bold text-[var(--text-primary)]">
          항목별 지출 내역
        </h2>
      </div>

      {/* Column Headers */}
      <div
        className="flex h-10 items-center border-b border-[var(--border-default)] bg-[#F9FAFB]"
      >
        <div className="flex-1 px-3.5 text-xs font-semibold text-[var(--text-secondary)]">
          항목
        </div>
        <div className="w-[120px] border-l border-[var(--border-default)] text-center text-xs font-semibold text-[var(--text-secondary)]">
          예상 비용
        </div>
        <div className="w-[120px] border-l border-[var(--border-default)] text-center text-xs font-semibold text-[var(--text-secondary)]">
          실제 비용
        </div>
        <div className="w-[70px] border-l border-[var(--border-default)] text-center text-xs font-semibold text-[var(--text-secondary)]">
          비율
        </div>
      </div>

      {/* Category Accordion Groups */}
      {CATEGORIES.map((cat, _) => {
        const categoryActual = hasTransactionItemData
          ? getCategoryActualByTransactionItems(
            state.transactions,
            state.transactionItems,
            month,
            cat.key,
          )
          : getCategoryTotal(state.transactions, month, cat.key);
        const categoryBudget = hasTransactionItemData
          ? getTransactionCategoryBudget(
            state.transactionItems,
            state.monthlyBudgetItems,
            month,
            cat.key,
          )
          : getCategoryBudget(state.monthlySubBudgets, state.expenseSubItems, month, cat.key);
        const percentage = displayTotalExpense > 0 ? (categoryActual / displayTotalExpense) * 100 : 0;
        const isExpanded = expandedCategories.has(cat.key);
        const subCategories = getOrderedSubCategories(cat.key);
        const budgetGroups = getBudgetGroups(subCategories);
        const catInfo = CATEGORY_MAP[cat.key];

        return (
          <div key={cat.key}>
            {/* Category Header Row */}
            <div
              className={`flex h-11 cursor-pointer items-center hover:bg-gray-50 border-b border-[var(--border-default)] ${
                isExpanded && subCategories.length > 0
                  ? 'bg-[#F9FAFB]'
                  : ''
              }`}
              onClick={() => toggleCategory(cat.key)}
            >
              <div className="flex flex-1 items-center gap-2 px-3.5">
                <CategoryDot category={cat.key} />
                <span className="text-[13px] font-medium text-[var(--text-primary)]">
                  {cat.label}
                </span>
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                )}
              </div>
              <div className="w-[120px] border-l border-[var(--border-default)] text-center text-xs text-[var(--text-secondary)]">
                {formatNumber(categoryBudget)}
              </div>
              <div className="w-[120px] border-l border-[var(--border-default)] text-center text-xs text-[var(--text-primary)]">
                {formatNumber(categoryActual)}
              </div>
              <div
                className="w-[70px] border-l border-[var(--border-default)] text-center text-xs font-bold"
                style={{ color: catInfo.color }}
              >
                {percentage.toFixed(1)}%
              </div>
            </div>

            {/* Sub-category Rows */}
            {isExpanded && hasTransactionItemData
              ? budgetGroups.map((group, groupIdx) => {
                const isLastGroup = groupIdx === budgetGroups.length - 1;
                const isMergedGroup = group.items.length > 1;

                return (
                  <div
                    key={group.id}
                    className={`flex ${
                      isMergedGroup ? 'border-t border-[var(--border-default)]' : ''
                    } border-b ${
                      isLastGroup
                        ? 'border-[var(--border-default)]'
                        : isMergedGroup
                          ? 'border-[var(--border-default)]'
                          : 'border-[var(--border-light)]'
                    }`}
                  >
                    <div className="flex flex-1 flex-col">
                      {group.items.map((sub, subIdx) => {
                        const isLastItem = subIdx === group.items.length - 1;

                        return (
                          <div
                            key={sub.id}
                            className={`flex h-10 items-center ${
                              isLastItem ? '' : 'border-b border-[var(--border-light)]'
                            }`}
                          >
                            <div className="flex flex-1 items-center pl-[38px] pr-3.5">
                              <span className="text-xs text-[var(--text-secondary)]">
                                {sub.name}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className={`flex w-[120px] items-center justify-center border-l border-[var(--border-default)] text-[11px] text-[var(--text-secondary)] ${
                      isMergedGroup
                        ? 'border-y border-[var(--border-default)] bg-[#F9FAFB]'
                        : ''
                    }`}>
                      {group.budget > 0 ? formatNumber(group.budget) : '-'}
                    </div>

                    <div className="flex w-[120px] flex-col border-l border-[var(--border-default)]">
                      {group.items.map((sub, subIdx) => {
                        const isLastItem = subIdx === group.items.length - 1;

                        return (
                          <div
                            key={sub.id}
                            className={`flex h-10 items-center justify-center text-[11px] text-[var(--text-secondary)] ${
                              isLastItem ? '' : 'border-b border-[var(--border-light)]'
                            }`}
                          >
                            {formatNumber(sub.total)}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex w-[70px] flex-col border-l border-[var(--border-default)]">
                      {group.items.map((sub, subIdx) => {
                        const subPercentage =
                          displayTotalExpense > 0 ? (sub.total / displayTotalExpense) * 100 : 0;
                        const isLastItem = subIdx === group.items.length - 1;

                        return (
                          <div
                            key={sub.id}
                            className={`flex h-10 items-center justify-center text-[11px] text-[var(--text-secondary)] ${
                              isLastItem ? '' : 'border-b border-[var(--border-light)]'
                            }`}
                          >
                            {subPercentage.toFixed(1)}%
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
              : isExpanded &&
              subCategories.map((sub, subIdx) => {
                const subPercentage =
                  displayTotalExpense > 0 ? (sub.total / displayTotalExpense) * 100 : 0;
                const isLastSub = subIdx === subCategories.length - 1;

                return (
                  <div
                    key={sub.id}
                    className={`flex h-10 items-center border-b ${
                      isLastSub
                        ? 'border-[var(--border-default)]'
                        : 'border-[var(--border-light)]'
                    }`}
                  >
                    <div className="flex flex-1 items-center pl-[38px] pr-3.5">
                      <span className="text-xs text-[var(--text-secondary)]">
                        {sub.name}
                      </span>
                    </div>
                    <div className="w-[120px] border-l border-[var(--border-default)] text-center text-[11px] text-[var(--text-secondary)]">
                      {sub.budget > 0 ? formatNumber(sub.budget) : '-'}
                    </div>
                    <div className="w-[120px] border-l border-[var(--border-default)] text-center text-[11px] text-[var(--text-secondary)]">
                      {formatNumber(sub.total)}
                    </div>
                    <div className="w-[70px] border-l border-[var(--border-default)] text-center text-[11px] text-[var(--text-secondary)]">
                      {subPercentage.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
          </div>
        );
      })}

      {/* Debt Payments Row */}
      <div className="flex h-11 items-center border-b border-[var(--border-default)]">
        <div className="flex flex-1 items-center gap-2 px-3.5">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: '#4B5563' }} />
          <span className="text-[13px] font-medium text-[var(--text-primary)]">
            부채 납부
          </span>
        </div>
        <div className="w-[120px] border-l border-[var(--border-default)] text-center text-xs text-[var(--text-secondary)]">
          {formatNumber(totalDebtBudget)}
        </div>
        <div className="w-[120px] border-l border-[var(--border-default)] text-center text-xs text-[var(--text-primary)]">
          {formatNumber(totalDebtActual)}
        </div>
        <div
          className="w-[70px] border-l border-[var(--border-default)] text-center text-xs font-bold"
          style={{ color: '#4B5563' }}
        >
          {displayTotalExpense > 0 ? ((totalDebtActual / displayTotalExpense) * 100).toFixed(1) : '0.0'}%
        </div>
      </div>

      {/* Total Row */}
      <div className="flex items-center border-t border-[var(--border-default)] bg-[#F9FAFB] px-5 py-3">
        <div className="flex-1">
          <span className="text-xs font-bold text-[var(--text-primary)]">
            총 지출
          </span>
        </div>
        <div className="w-[120px] border-l border-[var(--border-default)] pr-3 text-right text-xs font-bold text-[var(--text-secondary)]">
          {formatNumber(displayTotalBudget)}
        </div>
        <div className="w-[120px] border-l border-[var(--border-default)] pr-3 text-right text-xs font-bold text-[#DC2626]">
          {formatNumber(displayTotalExpense)}
        </div>
        <div className="w-[70px] border-l border-[var(--border-default)] pr-3 text-right text-xs font-bold text-[var(--text-primary)]">
          100%
        </div>
      </div>
    </div>
  );
}
