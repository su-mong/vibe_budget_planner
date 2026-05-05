import type { ReactNode } from 'react';
import { formatNumber } from '../../utils/format';

interface BudgetRowProps {
  label: string;
  value: number;
  isEditing: boolean;
  onChange: (value: number) => void;
  prefix?: ReactNode;
}

export function BudgetRow({ label, value, isEditing, onChange, prefix }: BudgetRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        {prefix}
        <span className="text-sm text-[var(--text-primary)]">{label}</span>
      </div>

      {isEditing ? (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-32 rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-right text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]"
          placeholder="0"
        />
      ) : (
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {formatNumber(value)}원
        </span>
      )}
    </div>
  );
}
