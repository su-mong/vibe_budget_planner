import { useReducer, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { BudgetState } from '../types/budget';
import { BudgetContext } from './BudgetContext';
import { budgetReducer } from './budgetReducer';
import { supabase } from '../lib/supabase';
import { getCurrentMonth, getDaysInMonth } from '../utils/format';

const initialState: BudgetState = {
  activeView: 'dashboard',
  currentMonth: getCurrentMonth(),
  selectedDate: null,
  transactions: [],
  monthlyIncomes: [],
  monthlySavings: [],
  monthlyDebts: [],
  additionalIncomes: [],
  monthlySubBudgets: [],
  incomeItems: [],
  expenseSubItems: [],
  savingsItems: [],
  debtItems: [],
  goal: { id: '', month: '', title: '', content: '', order: 0 },
  userSettings: { show_goals: true, card_payment_day: null },
  modalState: { type: 'closed' },
  editingSection: null,
  editingGoals: false,
  loading: true,
};

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(budgetReducer, initialState);
  const isInitializedRef = useRef(false);
  const prevMonthRef = useRef(state.currentMonth);

  // 설정 데이터 로드 (최초 1회만)
  const loadSettings = useCallback(async () => {
    try {
      const [
        { data: incomeItems },
        { data: expenseSubItems },
        { data: savingsItems },
        { data: debtItems },
        { data: userSettings },
      ] = await Promise.all([
        supabase.from('income_items').select('*').order('order'),
        supabase.from('expense_sub_items').select('*').order('order'),
        supabase.from('savings_items').select('*').order('order'),
        supabase.from('debt_items').select('*').order('order'),
        supabase.from('user_settings').select('*').limit(1),
      ]);

      const settings = userSettings?.[0] ?? { show_goals: true, card_payment_day: null };

      dispatch({
        type: 'LOAD_SETTINGS',
        payload: {
          incomeItems: incomeItems ?? [],
          expenseSubItems: expenseSubItems ?? [],
          savingsItems: savingsItems ?? [],
          debtItems: debtItems ?? [],
          userSettings: { 
            show_goals: settings.show_goals ?? true,
            card_payment_day: settings.card_payment_day ?? null
          },
        },
      });
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }, []);

  // 월별 데이터 로드 (월 변경 시마다)
  const loadMonthlyData = useCallback(async (month: string) => {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const startDate = `${month}-01`;
      const lastDay = getDaysInMonth(month);
      const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

      const [
        { data: transactions },
        { data: monthlyIncomes },
        { data: monthlySavings },
        { data: monthlyDebts },
        { data: additionalIncomes },
        { data: goals },
        { data: monthlySubBudgets },
      ] = await Promise.all([
        supabase.from('transactions').select('*')
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false }),
        supabase.from('monthly_incomes').select('*').eq('month', month),
        supabase.from('monthly_savings').select('*').eq('month', month),
        supabase.from('monthly_debts').select('*').eq('month', month),
        supabase.from('additional_incomes').select('*').eq('month', month),
        supabase.from('goals').select('*').eq('month', month).limit(1),
        supabase.from('monthly_sub_budgets').select('*').eq('month', month),
      ]);

      const goal = goals?.[0] ?? { id: '', month, title: '', content: '', order: 0 };

      dispatch({
        type: 'LOAD_MONTHLY_DATA',
        payload: {
          transactions: transactions ?? [],
          monthlyIncomes: monthlyIncomes ?? [],
          monthlySavings: monthlySavings ?? [],
          monthlyDebts: monthlyDebts ?? [],
          additionalIncomes: additionalIncomes ?? [],
          monthlySubBudgets: monthlySubBudgets ?? [],
          goal,
        },
      });
    } catch (err) {
      console.error('Failed to load monthly data:', err);
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, []);

  // 최초 로드: 설정 + 현재 월 데이터
  useEffect(() => {
    const initLoad = async () => {
      await loadSettings();
      await loadMonthlyData(state.currentMonth);
      isInitializedRef.current = true;
    };
    initLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 월 변경 시 해당 월 데이터 로드
  useEffect(() => {
    if (isInitializedRef.current && prevMonthRef.current !== state.currentMonth) {
      prevMonthRef.current = state.currentMonth;
      loadMonthlyData(state.currentMonth);
    }
  }, [state.currentMonth, loadMonthlyData]);

  return (
    <BudgetContext.Provider value={{ state, dispatch }}>
      {children}
    </BudgetContext.Provider>
  );
}
