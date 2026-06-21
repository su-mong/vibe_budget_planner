import {
  Category,
  Transaction,
  MonthlyIncome,
  AdditionalIncome,
  MonthlySavings,
  MonthlyDebt,
  MonthlySubBudget,
  ExpenseSubItem,
  MonthlyBudgetItem,
  BudgetItem,
  TransactionItem,
} from '../types/budget';

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

function getBudgetItemMap(budgetItems: BudgetItem[]): Map<string, BudgetItem> {
  return new Map(budgetItems.map((item) => [item.id, item]));
}

function getTransactionItemMap(transactionItems: TransactionItem[]): Map<string, TransactionItem> {
  return new Map(transactionItems.map((item) => [item.id, item]));
}

function hasNewBudgetModel(
  budgetItems: BudgetItem[],
  transactionItems: TransactionItem[],
  monthlyBudgetItems: MonthlyBudgetItem[] = [],
): boolean {
  return budgetItems.length > 0 || transactionItems.length > 0 || monthlyBudgetItems.length > 0;
}

function getTransactionBudgetItemId(
  transaction: Transaction,
  transactionItemMap: Map<string, TransactionItem>,
  legacyTransactionItemMap?: Map<string, TransactionItem>,
): string | null {
  if (transaction.transaction_item_id) {
    return transactionItemMap.get(transaction.transaction_item_id)?.budget_item_id ?? null;
  }
  return legacyTransactionItemMap
    ?.get(`${transaction.category}\u0000${transaction.sub_category}`)
    ?.budget_item_id ?? null;
}

export function getCategoryActualByBudgetItems(
  transactions: Transaction[],
  transactionItems: TransactionItem[],
  budgetItems: BudgetItem[],
  month: string,
  category: Category,
): number {
  if (!hasNewBudgetModel(budgetItems, transactionItems)) {
    return getCategoryTotal(transactions, month, category);
  }

  const transactionItemMap = getTransactionItemMap(transactionItems);
  const legacyTransactionItemMap = new Map(
    transactionItems.map((item) => [`${item.category}\u0000${item.name}`, item]),
  );
  const budgetItemMap = getBudgetItemMap(budgetItems);

  return getMonthlyTransactions(transactions, month)
    .filter((transaction) => {
      const budgetItemId = getTransactionBudgetItemId(
        transaction,
        transactionItemMap,
        legacyTransactionItemMap,
      );
      if (!budgetItemId) return transaction.category === category;
      return budgetItemMap.get(budgetItemId)?.category === category;
    })
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

export function getTotalBudgetByBudgetItems(
  monthlyBudgetItems: MonthlyBudgetItem[],
  month: string,
): number {
  return monthlyBudgetItems
    .filter((item) => item.month === month)
    .reduce((sum, item) => sum + item.amount, 0);
}

export function getCategoryBudgetByBudgetItems(
  monthlyBudgetItems: MonthlyBudgetItem[],
  budgetItems: BudgetItem[],
  month: string,
  category: Category,
): number {
  const budgetItemIds = new Set(
    budgetItems.filter((item) => item.category === category).map((item) => item.id),
  );
  return monthlyBudgetItems
    .filter((item) => item.month === month && budgetItemIds.has(item.budget_item_id))
    .reduce((sum, item) => sum + item.amount, 0);
}

export interface BudgetItemExpenseSummary {
  id: string;
  name: string;
  category: Category;
  order: number;
  budget: number;
  total: number;
}

export function getBudgetItemExpenseSummaries(
  transactions: Transaction[],
  transactionItems: TransactionItem[],
  budgetItems: BudgetItem[],
  monthlyBudgetItems: MonthlyBudgetItem[],
  month: string,
  category: Category,
): BudgetItemExpenseSummary[] {
  const transactionItemMap = getTransactionItemMap(transactionItems);
  const legacyTransactionItemMap = new Map(
    transactionItems.map((item) => [`${item.category}\u0000${item.name}`, item]),
  );
  const budgetMap = new Map<string, number>();
  const totalMap = new Map<string, number>();

  for (const budget of monthlyBudgetItems) {
    if (budget.month === month) {
      budgetMap.set(
        budget.budget_item_id,
        (budgetMap.get(budget.budget_item_id) || 0) + budget.amount,
      );
    }
  }

  for (const transaction of getMonthlyTransactions(transactions, month)) {
    const budgetItemId = getTransactionBudgetItemId(
      transaction,
      transactionItemMap,
      legacyTransactionItemMap,
    );
    if (budgetItemId) {
      totalMap.set(budgetItemId, (totalMap.get(budgetItemId) || 0) + transaction.amount);
    }
  }

  return budgetItems
    .filter((item) => item.category === category)
    .map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      order: item.order,
      budget: budgetMap.get(item.id) || 0,
      total: totalMap.get(item.id) || 0,
    }))
    .filter((item) => item.budget > 0 || item.total > 0)
    .sort((a, b) => {
      if (a.name === '기타') return 1;
      if (b.name === '기타') return -1;
      return a.order - b.order;
  });
}

export interface TransactionItemExpenseSummary {
  id: string;
  name: string;
  category: Category;
  order: number;
  budgetItemId: string;
  budget: number;
  total: number;
}

function getLegacyTransactionItemMap(
  transactionItems: TransactionItem[],
): Map<string, TransactionItem> {
  return new Map(transactionItems.map((item) => [`${item.category}\u0000${item.name}`, item]));
}

function getTransactionItemForTransaction(
  transaction: Transaction,
  transactionItemMap: Map<string, TransactionItem>,
  legacyTransactionItemMap: Map<string, TransactionItem>,
): TransactionItem | null {
  if (transaction.transaction_item_id) {
    return transactionItemMap.get(transaction.transaction_item_id) ?? null;
  }
  return legacyTransactionItemMap.get(`${transaction.category}\u0000${transaction.sub_category}`) ?? null;
}

export function getCategoryActualByTransactionItems(
  transactions: Transaction[],
  transactionItems: TransactionItem[],
  month: string,
  category: Category,
): number {
  if (transactionItems.length === 0) {
    return getCategoryTotal(transactions, month, category);
  }

  const transactionItemMap = getTransactionItemMap(transactionItems);
  const legacyTransactionItemMap = getLegacyTransactionItemMap(transactionItems);

  return getMonthlyTransactions(transactions, month)
    .filter((transaction) => {
      const item = getTransactionItemForTransaction(
        transaction,
        transactionItemMap,
        legacyTransactionItemMap,
      );
      return (item?.category ?? transaction.category) === category;
    })
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

export function getTransactionCategoryBudget(
  transactionItems: TransactionItem[],
  monthlyBudgetItems: MonthlyBudgetItem[],
  month: string,
  category: Category,
): number {
  const budgetMap = new Map<string, number>();
  for (const budget of monthlyBudgetItems) {
    if (budget.month === month) {
      budgetMap.set(
        budget.budget_item_id,
        (budgetMap.get(budget.budget_item_id) || 0) + budget.amount,
      );
    }
  }

  const budgetItemIds = new Set(
    transactionItems
      .filter((item) => item.category === category)
      .map((item) => item.budget_item_id),
  );

  let total = 0;
  for (const budgetItemId of budgetItemIds) {
    total += budgetMap.get(budgetItemId) || 0;
  }
  return total;
}

export function getTransactionItemExpenseSummaries(
  transactions: Transaction[],
  transactionItems: TransactionItem[],
  monthlyBudgetItems: MonthlyBudgetItem[],
  month: string,
  category: Category,
): TransactionItemExpenseSummary[] {
  const transactionItemMap = getTransactionItemMap(transactionItems);
  const legacyTransactionItemMap = getLegacyTransactionItemMap(transactionItems);
  const budgetMap = new Map<string, number>();
  const totalMap = new Map<string, number>();

  for (const budget of monthlyBudgetItems) {
    if (budget.month === month) {
      budgetMap.set(
        budget.budget_item_id,
        (budgetMap.get(budget.budget_item_id) || 0) + budget.amount,
      );
    }
  }

  for (const transaction of getMonthlyTransactions(transactions, month)) {
    const item = getTransactionItemForTransaction(
      transaction,
      transactionItemMap,
      legacyTransactionItemMap,
    );
    if (item) {
      totalMap.set(item.id, (totalMap.get(item.id) || 0) + transaction.amount);
    }
  }

  return transactionItems
    .filter((item) => item.category === category)
    .map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      order: item.order,
      budgetItemId: item.budget_item_id,
      budget: budgetMap.get(item.budget_item_id) || 0,
      total: totalMap.get(item.id) || 0,
    }))
    .filter((item) => item.budget > 0 || item.total > 0)
    .sort((a, b) => {
      if (a.name === '기타') return 1;
      if (b.name === '기타') return -1;
      return a.order - b.order;
    });
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

export function getMealCostTotal(
  transactions: Transaction[],
  month: string,
  transactionItems: TransactionItem[] = [],
): number {
  const transactionItemMap = getTransactionItemMap(transactionItems);
  return getMonthlyTransactions(transactions, month)
    .filter((t) => {
      const itemName = t.transaction_item_id
        ? transactionItemMap.get(t.transaction_item_id)?.name
        : null;
      return (itemName ?? t.sub_category) === '식비';
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getMealCount(
  transactions: Transaction[],
  month: string,
  transactionItems: TransactionItem[] = [],
): number {
  const transactionItemMap = getTransactionItemMap(transactionItems);
  return getMonthlyTransactions(transactions, month)
    .filter((t) => {
      const itemName = t.transaction_item_id
        ? transactionItemMap.get(t.transaction_item_id)?.name
        : null;
      return (itemName ?? t.sub_category) === '식비';
    })
    .reduce((sum, t) => sum + (t.meal_count ?? 1), 0);
}

export function getPercentage(actual: number, budget: number): number {
  if (budget === 0) return 0;
  return Math.round((actual / budget) * 100);
}
