import { useBudget } from '../../hooks/useBudget';
import { getPrevMonth, getNextMonth } from '../../utils/format';
import { PageHeader } from '../shared/PageHeader';
import { MonthSelector } from '../shared/MonthSelector';
import { GoalSection } from './GoalSection';
import { ExerciseSummaryCard } from './ExerciseSummaryCard';
import { MetricCards } from './MetricCards';
import { BalanceSheet } from './BalanceSheet';
import { CategoryExpenses } from './CategoryExpenses';

export function DashboardView() {
  const { state, dispatch } = useBudget();

  function handlePrevMonth() {
    dispatch({ type: 'SET_MONTH', month: getPrevMonth(state.currentMonth) });
  }

  function handleNextMonth() {
    dispatch({ type: 'SET_MONTH', month: getNextMonth(state.currentMonth) });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="대시보드">
        <MonthSelector
          month={state.currentMonth}
          onPrev={handlePrevMonth}
          onNext={handleNextMonth}
        />
      </PageHeader>

      {state.userSettings.show_goals && <GoalSection />}

      <MetricCards />

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          <BalanceSheet />
        </div>
        <div className="min-w-0 flex-1">
          <CategoryExpenses />
        </div>
      </div>

      <ExerciseSummaryCard />
    </div>
  );
}
