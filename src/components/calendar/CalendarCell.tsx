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
}

export function CalendarCell({
  date,
  day,
  isCurrentMonth,
  isSelected,
  isCardPaymentDay,
  income,
  expense,
}: CalendarCellProps) {
  const { dispatch } = useBudget();

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
      } ${!isCurrentMonth ? 'bg-[var(--bg-muted)]' : isCardPaymentDay ? 'bg-orange-50' : !isSelected ? 'bg-white' : ''}`}
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
