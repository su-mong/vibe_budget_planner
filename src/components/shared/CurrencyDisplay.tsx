import { formatWon } from '../../utils/format';

interface CurrencyDisplayProps {
  amount: number;
  className?: string;
}

export function CurrencyDisplay({ amount, className = '' }: CurrencyDisplayProps) {
  return <span className={className}>{formatWon(amount)}</span>;
}
