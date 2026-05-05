import { useBudget } from '../../hooks/useBudget';
import { PageHeader } from '../shared/PageHeader';
import { GoalToggleCard } from './GoalToggleCard';
import { IncomeItemsCard } from './IncomeItemsCard';
import { ExpenseItemsCard } from './ExpenseItemsCard';
import { SavingsItemsCard } from './SavingsItemsCard';
import { DebtItemsCard } from './DebtItemsCard';
import { CardPaymentCard } from './CardPaymentCard';
import { AccountCard } from './AccountCard';
import { AddIncomeItemModal } from './AddIncomeItemModal';
import { AddExpenseSubItemModal } from './AddExpenseSubItemModal';
import { AddSavingsItemModal } from './AddSavingsItemModal';
import { AddDebtItemModal } from './AddDebtItemModal';

export function SettingsView() {
  const { state } = useBudget();

  return (
    <div className="space-y-6">
      <PageHeader title="설정" />

      <div className="space-y-6">
        <GoalToggleCard />
        <IncomeItemsCard />
        <ExpenseItemsCard />
        <SavingsItemsCard />
        <DebtItemsCard />
        <CardPaymentCard />
        <AccountCard />
      </div>

      {/* Modals */}
      {state.modalState.type === 'addIncomeItem' && <AddIncomeItemModal />}
      {state.modalState.type === 'addExpenseSubItem' && <AddExpenseSubItemModal />}
      {state.modalState.type === 'addSavingsItem' && <AddSavingsItemModal />}
      {state.modalState.type === 'addDebtItem' && <AddDebtItemModal />}
    </div>
  );
}
