import { Wallet, LayoutDashboard, Calendar, PiggyBank, Settings, X } from 'lucide-react';
import type { ViewId } from '../../types/budget';
import { NavItem } from './NavItem';

interface SidebarProps {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: { icon: typeof LayoutDashboard; label: string; view: ViewId }[] = [
  { icon: LayoutDashboard, label: '대시보드', view: 'dashboard' },
  { icon: Calendar, label: '기록', view: 'calendar' },
  { icon: PiggyBank, label: '예산 관리', view: 'budget' },
  { icon: Settings, label: '설정', view: 'settings' },
];

function SidebarContent({ activeView, onNavigate }: Pick<SidebarProps, 'activeView' | 'onNavigate'>) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <Wallet size={24} className="text-[var(--accent-blue)]" />
        <span className="text-lg font-bold text-[var(--text-primary)]">Budget Recorder</span>
      </div>

      {/* Nav items */}
      <nav className="mt-2 flex flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.view}
            icon={item.icon}
            label={item.label}
            active={activeView === item.view}
            onClick={() => onNavigate(item.view)}
          />
        ))}
      </nav>
    </>
  );
}

export function Sidebar({ activeView, onNavigate, mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-[240px] shrink-0 border-r border-[var(--border-default)] bg-white md:block">
        <SidebarContent activeView={activeView} onNavigate={onNavigate} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onCloseMobile}
          />

          {/* Sidebar panel */}
          <aside className="relative z-10 flex h-full w-[240px] flex-col bg-white">
            {/* Close button */}
            <div className="flex justify-end px-4 pt-4">
              <button
                onClick={onCloseMobile}
                className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
              >
                <X size={20} />
              </button>
            </div>

            <SidebarContent
              activeView={activeView}
              onNavigate={(view) => {
                onNavigate(view);
                onCloseMobile();
              }}
            />
          </aside>
        </div>
      )}
    </>
  );
}
