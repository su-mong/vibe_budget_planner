import { Category, Transaction, MonthlyIncome, AdditionalIncome, MonthlySavings, MonthlyDebt, MonthlySubBudget, ExpenseSubItem } from '../types/budget';

export function getMonthlyTransactions(transactions: Transaction[], month: string): Transaction[] {
  return transactions.filter((t) => t.date.startsWith(month));
}

export function getTotalIncome(monthlyIncomes: MonthlyIncome[], additionalIncomes: AdditionalIncome[], month: string): number {
  const incomeTotal = monthlyIncomes
    .filter((i) => i.month === month)
    .reduce((sum, i) => sum + i.amount, 0);
  const additionalTotal = additionalIncomes
    .filter((a) => a.month === month)
    .reduce((sum, a) => sum + a.amount, 0);
  return incomeTotal + additionalTotal;
}

export function getTotalExpense(transactions: Transaction[], month: string): number {
  return getMonthlyTransactions(transactions, month).reduce((sum, t) => sum + t.amount, 0);
}

export function getCategoryTotal(transactions: Transaction[], month: string, category: Category): number {
  return getMonthlyTransactions(transactions, month)
    .filter((t) => t.category === category)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getCategoryBudget(
  monthlySubBudgets: MonthlySubBudget[],
  expenseSubItems: ExpenseSubItem[],
  month: string,
  category: Category,
): number {
  const subItemIds = new Set(
    expenseSubItems.filter((si) => si.category === category).map((si) => si.id),
  );
  return monthlySubBudgets
    .filter((sb) => sb.month === month && subItemIds.has(sb.sub_item_id))
    .reduce((sum, sb) => sum + sb.amount, 0);
}

export function getTotalBudget(
  monthlySubBudgets: MonthlySubBudget[],
  month: string,
): number {
  return monthlySubBudgets
    .filter((sb) => sb.month === month)
    .reduce((sum, sb) => sum + sb.amount, 0);
}

export function getTotalSavingsBudget(monthlySavings: MonthlySavings[], month: string): number {
  return monthlySavings.filter((s) => s.month === month).reduce((sum, s) => sum + s.budget, 0);
}

export function getTotalSavingsActual(monthlySavings: MonthlySavings[], month: string): number {
  return monthlySavings.filter((s) => s.month === month).reduce((sum, s) => sum + s.actual, 0);
}

export function getTotalDebtBudget(monthlyDebts: MonthlyDebt[], month: string): number {
  return monthlyDebts.filter((d) => d.month === month).reduce((sum, d) => sum + d.budget, 0);
}

export function getTotalDebtActual(monthlyDebts: MonthlyDebt[], month: string): number {
  return monthlyDebts.filter((d) => d.month === month).reduce((sum, d) => sum + d.actual, 0);
}

export function getSubCategoryTotals(
  transactions: Transaction[],
  month: string,
  category: Category
): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of getMonthlyTransactions(transactions, month)) {
    if (t.category === category) {
      map.set(t.sub_category, (map.get(t.sub_category) || 0) + t.amount);
    }
  }
  return map;
}

export function getMealCostTotal(transactions: Transaction[], month: string): number {
  return getMonthlyTransactions(transactions, month)
    .filter((t) => t.sub_category === '식비')
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getMealCount(transactions: Transaction[], month: string): number {
  return getMonthlyTransactions(transactions, month)
    .filter((t) => t.sub_category === '식비')
    .reduce((sum, t) => sum + (t.meal_count ?? 1), 0);
}

export function getPercentage(actual: number, budget: number): number {
  if (budget === 0) return 0;
  return Math.round((actual / budget) * 100);
}
