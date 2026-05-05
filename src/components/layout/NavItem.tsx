import type { LucideIcon } from 'lucide-react';

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}

export function NavItem({ icon: Icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
        active
          ? 'bg-[#FEF3C7] font-semibold text-[var(--accent-blue)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );
}
