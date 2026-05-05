interface ProgressBarProps {
  percentage: number;
  color: string;
}

export function ProgressBar({ percentage, color }: ProgressBarProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-muted)]">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${clampedPercentage}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}
