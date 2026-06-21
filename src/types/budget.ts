export enum Category {
  FIXED = 'fixed',
  LIVING = 'living',
  SELFCARE = 'selfcare',
  SOCIAL = 'social',
  LEISURE = 'leisure',
  ETC = 'etc',
}

export type ViewId = 'dashboard' | 'calendar' | 'budget' | 'settings';

export interface Transaction {
  id: string;
  date: string;
  type: 'expense';
  transaction_item_id?: string | null;
  category: Category;
  sub_category: string;
  amount: number;
  meal_count?: number | null;
  memo?: string | null;
  created_at: string;
}

export interface ExerciseRecord {
  id: string;
  date: string;
  running_completed: boolean;
  memo?: string | null;
  created_at?: string;
}

export interface MonthlyIncome {
  id: string;
  month: string;
  item_id: string;
  amount: number;
  receive_date?: string | null;
}

export interface MonthlySavings {
  id: string;
  month: string;
  item_id: string;
  budget: number;
  actual: number;
  date?: string | null;
  memo?: string | null;
}

export interface MonthlyDebt {
  id: string;
  month: string;
  item_id: string;
  budget: number;
  actual: number;
  date?: string | null;
  memo?: string | null;
}

export interface AdditionalIncome {
  id: string;
  month: string;
  name: string;
  amount: number;
  date?: string | null;
}

export interface MonthlyInstallment {
  id: string;
  month: string;
  name: string;
  amount: number;
  created_at?: string;
}

export interface IncomeItem {
  id: string;
  name: string;
  order: number;
}

export interface ExpenseSubItem {
  id: string;
  category: Category;
  name: string;
  order: number;
}

export interface BudgetItem {
  id: string;
  category: Category;
  name: string;
  order: number;
}

export interface TransactionItem {
  id: string;
  budget_item_id: string;
  category: Category;
  name: string;
  order: number;
  is_active: boolean;
}

export interface SavingsItem {
  id: string;
  name: string;
  order: number;
}

export interface DebtItem {
  id: string;
  name: string;
  order: number;
}

export interface MonthlySubBudget {
  id: string;
  month: string;
  sub_item_id: string;
  amount: number;
}

export interface MonthlyBudgetItem {
  id: string;
  month: string;
  budget_item_id: string;
  amount: number;
}

export interface Goal {
  id: string;
  month: string;
  title: string;
  content: string;
  order: number;
}

export interface UserSettings {
  show_goals: boolean;
  card_payment_day?: number | null;
}

export type EditingSection = 'income' | 'expense' | 'savings' | 'debt' | 'extraIncome' | null;

export type ModalState =
  | { type: 'closed' }
  | { type: 'transaction'; date: string }
  | { type: 'additionalIncome' }
  | { type: 'installment' }
  | { type: 'addIncomeItem' }
  | { type: 'addExpenseSubItem' }
  | { type: 'addBudgetItem' }
  | { type: 'addTransactionItem' }
  | { type: 'addSavingsItem' }
  | { type: 'addDebtItem' };

export interface BudgetState {
  activeView: ViewId;
  currentMonth: string;
  selectedDate: string | null;
  transactions: Transaction[];
  exerciseRecords: ExerciseRecord[];
  monthlyIncomes: MonthlyIncome[];
  monthlySavings: MonthlySavings[];
  monthlyDebts: MonthlyDebt[];
  additionalIncomes: AdditionalIncome[];
  monthlyInstallments: MonthlyInstallment[];
  monthlySubBudgets: MonthlySubBudget[];
  monthlyBudgetItems: MonthlyBudgetItem[];
  incomeItems: IncomeItem[];
  expenseSubItems: ExpenseSubItem[];
  budgetItems: BudgetItem[];
  transactionItems: TransactionItem[];
  savingsItems: SavingsItem[];
  debtItems: DebtItem[];
  goal: Goal;
  userSettings: UserSettings;
  modalState: ModalState;
  editingSection: EditingSection;
  editingGoals: boolean;
  loading: boolean;
}
