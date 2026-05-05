import { useBudget } from '../../hooks/useBudget';
import { getPrevMonth, getNextMonth } from '../../utils/format';
import { PageHeader } from '../shared/PageHeader';
import { MonthSelector } from '../shared/MonthSelector';
import { CalendarGrid } from './CalendarGrid';
import { ExpenseHistoryTable } from './ExpenseHistoryTable';
import { TransactionModal } from './TransactionModal';

export function CalendarView() {
  const { state, dispatch } = useBudget();

  const handlePrevMonth = () => {
    dispatch({ type: 'SET_MONTH', month: getPrevMonth(state.currentMonth) });
  };

  const handleNextMonth = () => {
    dispatch({ type: 'SET_MONTH', month: getNextMonth(state.currentMonth) });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="거래 내역">
        <MonthSelector
          month={state.currentMonth}
          onPrev={handlePrevMonth}
          onNext={handleNextMonth}
        />
      </PageHeader>

      <CalendarGrid />

      <ExpenseHistoryTable />

      {state.modalState.type === 'transaction' && <TransactionModal />}
    </div>
  );
}
