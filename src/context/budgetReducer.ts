import type {
  BudgetState, ViewId, Transaction, MonthlyIncome,
  MonthlySavings, MonthlyDebt, AdditionalIncome, MonthlyInstallment, MonthlySubBudget,
  IncomeItem, ExpenseSubItem, SavingsItem, DebtItem, Goal, ModalState,
  EditingSection, UserSettings,
} from '../types/budget';

export type BudgetAction =
  | { type: 'SET_VIEW'; view: ViewId }
  | { type: 'SET_MONTH'; month: string }
  | { type: 'SET_SELECTED_DATE'; date: string | null }
  | { type: 'SET_MODAL'; modal: ModalState }
  | { type: 'SET_EDITING_SECTION'; section: EditingSection }
  | { type: 'SET_EDITING_GOALS'; editing: boolean }
  | { type: 'SET_LOADING'; loading: boolean }
  // Data loaders
  | { type: 'LOAD_ALL'; payload: Partial<BudgetState> }
  | { type: 'LOAD_SETTINGS'; payload: {
      incomeItems: IncomeItem[];
      expenseSubItems: ExpenseSubItem[];
      savingsItems: SavingsItem[];
      debtItems: DebtItem[];
      userSettings: UserSettings;
    }}
  | { type: 'LOAD_MONTHLY_DATA'; payload: {
      transactions: Transaction[];
      monthlyIncomes: MonthlyIncome[];
      monthlySavings: MonthlySavings[];
      monthlyDebts: MonthlyDebt[];
      additionalIncomes: AdditionalIncome[];
      monthlyInstallments: MonthlyInstallment[];
      monthlySubBudgets: MonthlySubBudget[];
      goal: Goal;
    }}
  // Transactions
  | { type: 'ADD_TRANSACTION'; transaction: Transaction }
  | { type: 'DELETE_TRANSACTION'; id: string }
  // Monthly Incomes
  | { type: 'SET_MONTHLY_INCOMES'; incomes: MonthlyIncome[] }
  | { type: 'UPSERT_MONTHLY_INCOME'; income: MonthlyIncome }
  // Monthly Savings
  | { type: 'SET_MONTHLY_SAVINGS'; savings: MonthlySavings[] }
  | { type: 'UPSERT_MONTHLY_SAVINGS'; savings: MonthlySavings }
  // Monthly Debts
  | { type: 'SET_MONTHLY_DEBTS'; debts: MonthlyDebt[] }
  | { type: 'UPSERT_MONTHLY_DEBT'; debt: MonthlyDebt }
  // Additional Incomes
  | { type: 'ADD_ADDITIONAL_INCOME'; income: AdditionalIncome }
  | { type: 'DELETE_ADDITIONAL_INCOME'; id: string }
  | { type: 'SET_ADDITIONAL_INCOMES'; incomes: AdditionalIncome[] }
  // Monthly Installments
  | { type: 'ADD_INSTALLMENT'; installment: MonthlyInstallment }
  | { type: 'DELETE_INSTALLMENT'; id: string }
  | { type: 'SET_INSTALLMENTS'; installments: MonthlyInstallment[] }
  // Settings items
  | { type: 'SET_INCOME_ITEMS'; items: IncomeItem[] }
  | { type: 'ADD_INCOME_ITEM'; item: IncomeItem }
  | { type: 'DELETE_INCOME_ITEM'; id: string }
  | { type: 'SET_EXPENSE_SUB_ITEMS'; items: ExpenseSubItem[] }
  | { type: 'ADD_EXPENSE_SUB_ITEM'; item: ExpenseSubItem }
  | { type: 'DELETE_EXPENSE_SUB_ITEM'; id: string }
  | { type: 'SET_SAVINGS_ITEMS'; items: SavingsItem[] }
  | { type: 'ADD_SAVINGS_ITEM'; item: SavingsItem }
  | { type: 'DELETE_SAVINGS_ITEM'; id: string }
  | { type: 'SET_DEBT_ITEMS'; items: DebtItem[] }
  | { type: 'ADD_DEBT_ITEM'; item: DebtItem }
  | { type: 'DELETE_DEBT_ITEM'; id: string }
  // Monthly Sub-Budgets
  | { type: 'SET_MONTHLY_SUB_BUDGETS'; month: string; subBudgets: MonthlySubBudget[] }
  // Goal
  | { type: 'SET_GOAL'; goal: Goal }
  // User settings
  | { type: 'SET_USER_SETTINGS'; settings: UserSettings };

export function budgetReducer(state: BudgetState, action: BudgetAction): BudgetState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, activeView: action.view };
    case 'SET_MONTH':
      return { ...state, currentMonth: action.month, selectedDate: null };
    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.date };
    case 'SET_MODAL':
      return { ...state, modalState: action.modal };
    case 'SET_EDITING_SECTION':
      return { ...state, editingSection: action.section };
    case 'SET_EDITING_GOALS':
      return { ...state, editingGoals: action.editing };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'LOAD_ALL':
      return { ...state, ...action.payload, loading: false };
    case 'LOAD_SETTINGS':
      return { ...state, ...action.payload };
    case 'LOAD_MONTHLY_DATA':
      return { ...state, ...action.payload, loading: false };

    // Transactions
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.transaction] };
    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) };

    // Monthly Incomes
    case 'SET_MONTHLY_INCOMES':
      return { ...state, monthlyIncomes: action.incomes };
    case 'UPSERT_MONTHLY_INCOME': {
      const idx = state.monthlyIncomes.findIndex((i) => i.id === action.income.id);
      if (idx >= 0) {
        const updated = [...state.monthlyIncomes];
        updated[idx] = action.income;
        return { ...state, monthlyIncomes: updated };
      }
      return { ...state, monthlyIncomes: [...state.monthlyIncomes, action.income] };
    }

    // Monthly Savings
    case 'SET_MONTHLY_SAVINGS':
      return { ...state, monthlySavings: action.savings };
    case 'UPSERT_MONTHLY_SAVINGS': {
      const idx = state.monthlySavings.findIndex((s) => s.id === action.savings.id);
      if (idx >= 0) {
        const updated = [...state.monthlySavings];
        updated[idx] = action.savings;
        return { ...state, monthlySavings: updated };
      }
      return { ...state, monthlySavings: [...state.monthlySavings, action.savings] };
    }

    // Monthly Debts
    case 'SET_MONTHLY_DEBTS':
      return { ...state, monthlyDebts: action.debts };
    case 'UPSERT_MONTHLY_DEBT': {
      const idx = state.monthlyDebts.findIndex((d) => d.id === action.debt.id);
      if (idx >= 0) {
        const updated = [...state.monthlyDebts];
        updated[idx] = action.debt;
        return { ...state, monthlyDebts: updated };
      }
      return { ...state, monthlyDebts: [...state.monthlyDebts, action.debt] };
    }

    // Additional Incomes
    case 'ADD_ADDITIONAL_INCOME':
      return { ...state, additionalIncomes: [...state.additionalIncomes, action.income] };
    case 'DELETE_ADDITIONAL_INCOME':
      return { ...state, additionalIncomes: state.additionalIncomes.filter((a) => a.id !== action.id) };
    case 'SET_ADDITIONAL_INCOMES':
      return { ...state, additionalIncomes: action.incomes };

    // Monthly Installments
    case 'ADD_INSTALLMENT':
      return { ...state, monthlyInstallments: [...state.monthlyInstallments, action.installment] };
    case 'DELETE_INSTALLMENT':
      return { ...state, monthlyInstallments: state.monthlyInstallments.filter((i) => i.id !== action.id) };
    case 'SET_INSTALLMENTS':
      return { ...state, monthlyInstallments: action.installments };

    // Settings items
    case 'SET_INCOME_ITEMS':
      return { ...state, incomeItems: action.items };
    case 'ADD_INCOME_ITEM':
      return { ...state, incomeItems: [...state.incomeItems, action.item] };
    case 'DELETE_INCOME_ITEM':
      return { ...state, incomeItems: state.incomeItems.filter((i) => i.id !== action.id) };
    case 'SET_EXPENSE_SUB_ITEMS':
      return { ...state, expenseSubItems: action.items };
    case 'ADD_EXPENSE_SUB_ITEM':
      return { ...state, expenseSubItems: [...state.expenseSubItems, action.item] };
    case 'DELETE_EXPENSE_SUB_ITEM':
      return { ...state, expenseSubItems: state.expenseSubItems.filter((i) => i.id !== action.id) };
    case 'SET_SAVINGS_ITEMS':
      return { ...state, savingsItems: action.items };
    case 'ADD_SAVINGS_ITEM':
      return { ...state, savingsItems: [...state.savingsItems, action.item] };
    case 'DELETE_SAVINGS_ITEM':
      return { ...state, savingsItems: state.savingsItems.filter((i) => i.id !== action.id) };
    case 'SET_DEBT_ITEMS':
      return { ...state, debtItems: action.items };
    case 'ADD_DEBT_ITEM':
      return { ...state, debtItems: [...state.debtItems, action.item] };
    case 'DELETE_DEBT_ITEM':
      return { ...state, debtItems: state.debtItems.filter((i) => i.id !== action.id) };

    // Monthly Sub-Budgets
    case 'SET_MONTHLY_SUB_BUDGETS': {
      const others = state.monthlySubBudgets.filter((sb) => sb.month !== action.month);
      return { ...state, monthlySubBudgets: [...others, ...action.subBudgets] };
    }

    // Goal
    case 'SET_GOAL':
      return { ...state, goal: action.goal };

    // User settings
    case 'SET_USER_SETTINGS':
      return { ...state, userSettings: action.settings };

    default:
      return state;
  }
}
