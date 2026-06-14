import { Plus } from 'lucide-react';
import { useBudget } from '../../hooks/useBudget';
import { formatNumber } from '../../utils/format';

interface CalendarCellProps {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isCardPaymentDay: boolean;
  income: number;
  expense: number;
  exerciseRecord?: {
    running_completed: boolean;
  };
}

export function CalendarCell({
  date,
  day,
  isCurrentMonth,
  isSelected,
  isCardPaymentDay,
  income,
  expense,
  exerciseRecord,
}: CalendarCellProps) {
  const { dispatch } = useBudget();
  const today = new Date();
  const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const isToday = date === todayDate;

  const handleCellClick = () => {
    dispatch({ type: 'SET_SELECTED_DATE', date });
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'SET_MODAL', modal: { type: 'transaction', date } });
  };

  return (
    <div
      onClick={handleCellClick}
      className={`relative min-h-[80px] cursor-pointer border border-[var(--border-light)] p-1.5 transition-colors ${
        isSelected ? 'rounded border-2 border-[var(--accent-blue)] bg-[#FEF3C7]' : ''
      } ${!isCurrentMonth ? 'bg-[var(--bg-muted)]' : isSelected ? '' : isToday ? 'bg-lime-100' : isCardPaymentDay ? 'bg-orange-50' : 'bg-white'}`}
    >
      {/* Day number */}
      <span
        className={`text-xs font-medium ${
          isSelected ? 'font-bold text-[#D97706]' : isCardPaymentDay ? 'text-orange-600' : !isCurrentMonth ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'
        }`}
      >
        {day}
        {isCardPaymentDay && isCurrentMonth && (
          <span className="ml-1 text-[10px] font-bold text-orange-500">(카드)</span>
        )}
      </span>

      {/* Income / Expense amounts */}
      <div className="mt-0.5 space-y-0.5">
        {income > 0 && (
          <p className="truncate text-[11px] leading-tight text-green-600">
            +{formatNumber(income)}
          </p>
        )}
        {expense > 0 && (
          <p className="truncate text-[11px] leading-tight text-red-500">
            -{formatNumber(expense)}
          </p>
        )}
        {exerciseRecord && (
          <span className="inline-flex max-w-full items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-blue-800">
            <span className="truncate">
              {exerciseRecord.running_completed ? '🏃‍➡️ 오운완' : '오운완'}
            </span>
          </span>
        )}
      </div>

      {/* Add button shown on selected cell */}
      {isSelected && isCurrentMonth && (
        <button
          onClick={handleAddClick}
          className="absolute top-1 right-1 flex h-[22px] w-[22px] items-center justify-center rounded-[6px] bg-[var(--accent-blue)] text-white transition-opacity hover:opacity-80"
        >
          <Plus size={14} />
        </button>
      )}
    </div>
  );
}
