import { useState } from 'react';
import { Menu, Loader2 } from 'lucide-react';
import { useBudget } from '../../hooks/useBudget';
import type { ViewId } from '../../types/budget';
import { Sidebar } from './Sidebar';
import { DashboardView } from '../dashboard/DashboardView';
import { CalendarView } from '../calendar/CalendarView';
import { BudgetView } from '../budget/BudgetView';
import { SettingsView } from '../settings/SettingsView';

function ActiveView({ view }: { view: ViewId }) {
  switch (view) {
    case 'dashboard':
      return <DashboardView />;
    case 'calendar':
      return <CalendarView />;
    case 'budget':
      return <BudgetView />;
    case 'settings':
      return <SettingsView />;
    default:
      return <DashboardView />;
  }
}

export function AppLayout() {
  const { state, dispatch } = useBudget();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigate = (view: ViewId) => {
    dispatch({ type: 'SET_VIEW', view });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-primary)]">
      {/* Sidebar */}
      <Sidebar
        activeView={state.activeView}
        onNavigate={handleNavigate}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main content */}
      <main className="relative flex-1 overflow-y-auto">
        {/* Mobile header with menu toggle */}
        <div className="sticky top-0 z-10 flex items-center border-b border-[var(--border-default)] bg-white px-4 py-3 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
          >
            <Menu size={22} />
          </button>
        </div>

        {/* View content */}
        <div className="p-6 md:px-10 md:py-8">
          <ActiveView view={state.activeView} />
        </div>

        {/* Loading overlay */}
        {state.loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60">
            <Loader2 size={32} className="animate-spin text-[var(--accent-blue)]" />
          </div>
        )}
      </main>
    </div>
  );
}
