import { useBudget } from '../../hooks/useBudget';
import { PageHeader } from '../shared/PageHeader';
import { GoalToggleCard } from './GoalToggleCard';
import { IncomeItemsCard } from './IncomeItemsCard';
import { BudgetItemsCard } from './BudgetItemsCard';
import { TransactionItemsCard } from './TransactionItemsCard';
import { SavingsItemsCard } from './SavingsItemsCard';
import { DebtItemsCard } from './DebtItemsCard';
import { CardPaymentCard } from './CardPaymentCard';
import { AccountCard } from './AccountCard';
import { AddIncomeItemModal } from './AddIncomeItemModal';
import { AddBudgetItemModal } from './AddBudgetItemModal';
import { AddTransactionItemModal } from './AddTransactionItemModal';
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
        <BudgetItemsCard />
        <TransactionItemsCard />
        <SavingsItemsCard />
        <DebtItemsCard />
        <CardPaymentCard />
        <AccountCard />
      </div>

      {/* Modals */}
      {state.modalState.type === 'addIncomeItem' && <AddIncomeItemModal />}
      {state.modalState.type === 'addBudgetItem' && <AddBudgetItemModal />}
      {state.modalState.type === 'addTransactionItem' && <AddTransactionItemModal />}
      {state.modalState.type === 'addSavingsItem' && <AddSavingsItemModal />}
      {state.modalState.type === 'addDebtItem' && <AddDebtItemModal />}
    </div>
  );
}
