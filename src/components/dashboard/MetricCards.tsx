import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useBudget } from '../../hooks/useBudget';
import { getTotalIncome, getTotalExpense, getTotalDebtActual } from '../../utils/calculations';
import { MetricCard } from './MetricCard';

export function MetricCards() {
  const { state } = useBudget();
  const month = state.currentMonth;

  const totalIncome = getTotalIncome(state.monthlyIncomes, state.additionalIncomes, month);
  const totalExpense = getTotalExpense(state.transactions, month);
  const totalDebt = getTotalDebtActual(state.monthlyDebts, month);
  const balance = totalIncome - totalExpense - totalDebt;

  return (
    <div className="flex gap-5">
      <div className="min-w-0 flex-1">
        <MetricCard
          title="총 수입"
          amount={totalIncome}
          icon={TrendingUp}
          iconColor="#22A06B"
          iconBgColor="#E9F5EF"
        />
      </div>
      <div className="min-w-0 flex-1">
        <MetricCard
          title="총 지출"
          amount={totalExpense}
          icon={TrendingDown}
          iconColor="#DC2626"
          iconBgColor="#FEF2F2"
        />
      </div>
      <div className="min-w-0 flex-1">
        <MetricCard
          title="잔액"
          amount={balance}
          valueColor="var(--accent-blue)"
          icon={Wallet}
          iconColor="#D97706"
          iconBgColor="#FEF3C7"
        />
      </div>
    </div>
  );
}
