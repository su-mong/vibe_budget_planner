import { UtensilsCrossed } from 'lucide-react';
import { useBudget } from '../../hooks/useBudget';
import { Category } from '../../types/budget';
import {
  getCategoryActualByBudgetItems,
  getCategoryBudgetByBudgetItems,
  getCategoryBudget,
  getCategoryTotal,
  getMealCostTotal,
  getMealCount,
  getTotalBudgetByBudgetItems,
  getTotalBudget,
  getTotalExpense,
  getTotalIncome,
  getTotalSavingsBudget,
  getTotalSavingsActual,
  getTotalDebtBudget,
  getTotalDebtActual,
} from '../../utils/calculations';
import { formatNumber } from '../../utils/format';

export function BalanceSheet() {
  const { state } = useBudget();
  const month = state.currentMonth;

  // Income
  const incomeBudget = state.monthlyIncomes
    .filter((i) => i.month === month)
    .reduce((sum, i) => sum + i.amount, 0);
  const incomeActual = getTotalIncome(state.monthlyIncomes, state.additionalIncomes, month);

  // Expenses
  const hasBudgetItemData = state.budgetItems.length > 0 || state.monthlyBudgetItems.length > 0;
  const expenseBudget = hasBudgetItemData
    ? getTotalBudgetByBudgetItems(state.monthlyBudgetItems, month)
    : getTotalBudget(state.monthlySubBudgets, month);
  const expenseActual = getTotalExpense(state.transactions, month);

  // Fixed vs Variable
  const fixedBudget = hasBudgetItemData
    ? getCategoryBudgetByBudgetItems(
      state.monthlyBudgetItems,
      state.budgetItems,
      month,
      Category.FIXED,
    )
    : getCategoryBudget(state.monthlySubBudgets, state.expenseSubItems, month, Category.FIXED);
  const fixedActual = hasBudgetItemData
    ? getCategoryActualByBudgetItems(
      state.transactions,
      state.transactionItems,
      state.budgetItems,
      month,
      Category.FIXED,
    )
    : getCategoryTotal(state.transactions, month, Category.FIXED);
  const variableBudget = expenseBudget - fixedBudget;
  const variableActual = expenseActual - fixedActual;

  // Savings & Debt
  const savingsBudget = getTotalSavingsBudget(state.monthlySavings, month);
  const savingsActual = getTotalSavingsActual(state.monthlySavings, month);
  const debtBudget = getTotalDebtBudget(state.monthlyDebts, month);
  const debtActual = getTotalDebtActual(state.monthlyDebts, month);

  // Balance
  const balanceBudget = incomeBudget - expenseBudget - savingsBudget - debtBudget;
  const balanceActual = incomeActual - expenseActual - savingsActual - debtActual;

  // Meal cost
  const mealTotal = getMealCostTotal(state.transactions, month, state.transactionItems);
  const mealCount = getMealCount(state.transactions, month, state.transactionItems);
  const avgMealCost = mealCount > 0 ? Math.round(mealTotal / mealCount) : 0;

  function formatSigned(value: number): string {
    if (value > 0) return `+${formatNumber(value)}`;
    if (value < 0) return formatNumber(value);
    return '0';
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-white">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-[var(--border-default)] px-5 py-4">
        <h2 className="text-base font-bold text-[var(--text-primary)]">수지 계산표</h2>
      </div>

      {/* Column Headers */}
      <div className="flex items-center border-b border-[var(--border-default)] bg-[#F9FAFB] px-5 py-2.5">
        <div className="flex-1 text-[11px] font-bold text-[var(--text-secondary)]">항목</div>
        <div className="w-[150px] text-right text-[11px] font-bold text-[var(--text-secondary)]">
          예상 비용
        </div>
        <div className="w-[150px] text-right text-[11px] font-bold text-[var(--text-secondary)]">
          실제 비용
        </div>
      </div>

      {/* Row: 소득 */}
      <div className="flex items-center border-b border-[var(--border-light)] px-5 py-2.5">
        <div className="flex-1 text-xs text-[var(--text-primary)]">소득</div>
        <div className="w-[150px] text-right text-xs text-[var(--text-primary)]">
          {formatNumber(incomeBudget)}
        </div>
        <div className="w-[150px] text-right text-xs text-[var(--text-primary)]">
          {formatNumber(incomeActual)}
        </div>
      </div>

      {/* Row: 전체 지출 */}
      <div className="flex items-center border-b border-[var(--border-light)] px-5 py-2.5">
        <div className="flex-1 text-xs font-bold text-[var(--text-primary)]">전체 지출</div>
        <div className="w-[150px] text-right text-xs font-bold text-[#DC2626]">
          {formatNumber(expenseBudget)}
        </div>
        <div className="w-[150px] text-right text-xs font-bold text-[#DC2626]">
          {formatNumber(expenseActual)}
        </div>
      </div>

      {/* Sub-row: 고정비 */}
      <div className="flex items-center border-b border-[var(--border-light)] px-5 py-2.5">
        <div className="flex-1 pl-5 text-xs text-[var(--text-secondary)]">고정비</div>
        <div className="w-[150px] text-right text-xs text-[var(--text-secondary)]">
          {formatNumber(fixedBudget)}
        </div>
        <div className="w-[150px] text-right text-xs text-[var(--text-secondary)]">
          {formatNumber(fixedActual)}
        </div>
      </div>

      {/* Sub-row: 변동 지출 */}
      <div className="flex items-center border-b border-[var(--border-light)] px-5 py-2.5">
        <div className="flex-1 pl-5 text-xs text-[var(--text-secondary)]">변동 지출</div>
        <div className="w-[150px] text-right text-xs text-[var(--text-secondary)]">
          {formatNumber(variableBudget)}
        </div>
        <div className="w-[150px] text-right text-xs text-[var(--text-secondary)]">
          {formatNumber(variableActual)}
        </div>
      </div>

      {/* Row: 저축 */}
      <div className="flex items-center border-b border-[var(--border-light)] px-5 py-2.5">
        <div className="flex-1 text-xs text-[var(--text-primary)]">저축</div>
        <div className="w-[150px] text-right text-xs text-[var(--text-primary)]">
          {formatNumber(savingsBudget)}
        </div>
        <div className="w-[150px] text-right text-xs text-[var(--text-primary)]">
          {formatNumber(savingsActual)}
        </div>
      </div>

      {/* Row: 부채 납부 */}
      <div className="flex items-center border-b border-[var(--border-light)] px-5 py-2.5">
        <div className="flex-1 text-xs text-[var(--text-primary)]">부채 납부</div>
        <div className="w-[150px] text-right text-xs text-[var(--text-primary)]">
          {formatNumber(debtBudget)}
        </div>
        <div className="w-[150px] text-right text-xs text-[var(--text-primary)]">
          {formatNumber(debtActual)}
        </div>
      </div>

      {/* Total Row: 수지차 */}
      <div className="flex items-center border-t border-[var(--border-default)] bg-[#F9FAFB] px-5 py-3">
        <div className="flex-1 text-xs font-bold text-[var(--text-primary)]">수지차</div>
        <div className="w-[150px] text-right text-xs font-bold text-[#059669]">
          {formatSigned(balanceBudget)}
        </div>
        <div className="w-[150px] text-right text-xs font-bold text-[#059669]">
          {formatSigned(balanceActual)}
        </div>
      </div>

      {/* 1끼당 평균 식비 */}
      <div className="flex items-center justify-between border-t border-[var(--border-default)] bg-[var(--bg-card)] px-5 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            <span className="text-[11px] font-semibold text-[var(--text-tertiary)]">1끼당 평균 식비</span>
          </div>
          <span className="text-[10px] text-[var(--text-secondary)]">
            월 식비 {formatNumber(mealTotal)}원 기준 · {mealCount}끼
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xl font-bold text-[var(--text-primary)]">
            {formatNumber(avgMealCost)}
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">원</span>
        </div>
      </div>
    </div>
  );
}
