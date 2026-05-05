import { createContext } from 'react';
import type { BudgetState } from '../types/budget';
import type { BudgetAction } from './budgetReducer';

export interface BudgetContextValue {
  state: BudgetState;
  dispatch: React.Dispatch<BudgetAction>;
}

export const BudgetContext = createContext<BudgetContextValue | null>(null);
