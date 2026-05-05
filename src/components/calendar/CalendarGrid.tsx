import { useMemo } from 'react';
import { useBudget } from '../../hooks/useBudget';
import { getDaysInMonth, getFirstDayOfMonth, formatDate } from '../../utils/format';
import { CalendarCell } from './CalendarCell';
import type { Transaction } from '../../types/budget';

const DAY_HEADERS = ['일', '월', '화', '수', '목', '금', '토'];

export function CalendarGrid() {
  const { state } = useBudget();
  const { currentMonth, selectedDate, transactions, monthlyIncomes, additionalIncomes } = state;

  const [year, month] = currentMonth.split('-').map(Number);
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);

  // Previous month info for leading cells
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  const daysInPrevMonth = getDaysInMonth(prevMonthStr);

  // Next month info for trailing cells
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  // Pre-compute totals per date for the month
  const dailyTotals = useMemo(() => {
    const expenseMap: Record<string, number> = {};
    const incomeMap: Record<string, number> = {};

    transactions.forEach((t: Transaction) => {
      if (t.date.startsWith(currentMonth)) {
        expenseMap[t.date] = (expenseMap[t.date] || 0) + t.amount;
      }
    });

    // Include debts in daily expense totals
    state.monthlyDebts.forEach((d) => {
      if (d.date && d.date.startsWith(currentMonth) && d.actual > 0) {
        expenseMap[d.date] = (expenseMap[d.date] || 0) + d.actual;
      }
    });

    // Monthly incomes are month-level, distribute to day 1
    const firstDate = formatDate(year, month, 1);
    const monthlyIncomeTotal = monthlyIncomes
      .filter((i) => i.month === currentMonth)
      .reduce((sum, i) => sum + i.amount, 0);
    const additionalIncomeTotal = additionalIncomes
      .filter((a) => a.month === currentMonth)
      .reduce((sum, a) => sum + a.amount, 0);

    if (monthlyIncomeTotal + additionalIncomeTotal > 0) {
      incomeMap[firstDate] = monthlyIncomeTotal + additionalIncomeTotal;
    }

    return { expenseMap, incomeMap };
  }, [transactions, monthlyIncomes, additionalIncomes, currentMonth, year, month]);

  // Build grid cells
  const totalCells = firstDay + daysInMonth;
  const rows = Math.ceil(totalCells / 7);
  const totalSlots = rows * 7;

  const cells: {
    date: string;
    day: number;
    isCurrentMonth: boolean;
  }[] = [];

  // Leading cells (previous month)
  for (let i = 0; i < firstDay; i++) {
    const day = daysInPrevMonth - firstDay + 1 + i;
    cells.push({
      date: formatDate(prevYear, prevMonth, day),
      day,
      isCurrentMonth: false,
    });
  }

  // Current month cells
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      date: formatDate(year, month, d),
      day: d,
      isCurrentMonth: true,
    });
  }

  // Trailing cells (next month)
  const remaining = totalSlots - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({
      date: formatDate(nextYear, nextMonth, d),
      day: d,
      isCurrentMonth: false,
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-white">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7">
        {DAY_HEADERS.map((label, i) => (
          <div
            key={label}
            className={`py-2 text-center text-sm font-medium text-[var(--text-secondary)] ${
              i === 0 ? 'text-red-500' : ''
            } ${i === 6 ? 'text-amber-500' : ''}`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7">
        {cells.map((cell) => (
          <CalendarCell
            key={cell.date}
            date={cell.date}
            day={cell.day}
            isCurrentMonth={cell.isCurrentMonth}
            isSelected={selectedDate === cell.date}
            isCardPaymentDay={cell.isCurrentMonth && state.userSettings.card_payment_day === cell.day}
            income={dailyTotals.incomeMap[cell.date] || 0}
            expense={dailyTotals.expenseMap[cell.date] || 0}
          />
        ))}
      </div>
    </div>
  );
}
