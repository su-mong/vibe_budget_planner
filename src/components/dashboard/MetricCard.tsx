import type { LucideIcon } from 'lucide-react';
import { formatWon } from '../../utils/format';

interface MetricCardProps {
  title: string;
  amount: number;
  valueColor?: string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
}

export function MetricCard({
  title,
  amount,
  valueColor = 'var(--text-primary)',
  icon: Icon,
  iconColor,
  iconBgColor,
}: MetricCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--border-default)] bg-white p-6">
      <div className="flex items-center justify-between">
        <span
          className="text-sm italic text-[var(--text-secondary)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </span>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: iconBgColor }}
        >
          <Icon size={18} style={{ color: iconColor }} />
        </div>
      </div>
      <span className="text-[28px] font-bold leading-tight" style={{ color: valueColor }}>
        {formatWon(amount)}
      </span>
    </div>
  );
}
