import { PageHeader } from '../shared/PageHeader';
import { MonthSelector } from '../shared/MonthSelector';
import { IncomeSection } from './IncomeSection';
import { ExpenseSection } from './ExpenseSection';
import { SavingsSection } from './SavingsSection';
import { DebtSection } from './DebtSection';
import { ExtraIncomeSection } from './ExtraIncomeSection';
import { AdditionalIncomeModal } from './AdditionalIncomeModal';
import { useBudget } from '../../hooks/useBudget';
import { getPrevMonth, getNextMonth } from '../../utils/format';

export function BudgetView() {
  const { state, dispatch } = useBudget();

  return (
    <div className="space-y-6">
      {/* Header with month selector */}
      <PageHeader title="예산 관리">
        <MonthSelector
          month={state.currentMonth}
          onPrev={() => dispatch({ type: 'SET_MONTH', month: getPrevMonth(state.currentMonth) })}
          onNext={() => dispatch({ type: 'SET_MONTH', month: getNextMonth(state.currentMonth) })}
        />
      </PageHeader>

      {/* Budget sections */}
      <div className="flex flex-col gap-6">
        <IncomeSection />
        <ExpenseSection />
        <SavingsSection />
        <DebtSection />
        <ExtraIncomeSection />
      </div>

      {/* Additional income modal */}
      <AdditionalIncomeModal />
    </div>
  );
}
