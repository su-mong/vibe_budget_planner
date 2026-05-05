import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonth } from '../../utils/format';

interface MonthSelectorProps {
  month: string;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthSelector({ month, onPrev, onNext }: MonthSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrev}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-default)] bg-white transition-colors hover:bg-[var(--bg-muted)]"
      >
        <ChevronLeft size={18} />
      </button>

      <span className="min-w-[120px] text-center text-sm font-medium text-[var(--text-primary)]">
        {formatMonth(month)}
      </span>

      <button
        onClick={onNext}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-default)] bg-white transition-colors hover:bg-[var(--bg-muted)]"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
