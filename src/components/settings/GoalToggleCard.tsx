import { useBudget } from '../../hooks/useBudget';
import { supabase } from '../../lib/supabase';
import { Card } from '../shared/Card';

export function GoalToggleCard() {
  const { state, dispatch } = useBudget();
  const enabled = state.userSettings.show_goals;

  const handleToggle = async () => {
    const newValue = !enabled;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_settings')
        .update({ show_goals: newValue })
        .eq('user_id', user.id);

      dispatch({ type: 'SET_USER_SETTINGS', settings: { ...state.userSettings, show_goals: newValue } });
    } catch (err) {
      console.error('Failed to update goal toggle:', err);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">목표 표시</h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            대시보드에 목표 섹션을 표시합니다
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
            enabled ? 'bg-[var(--accent-blue)]' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </Card>
  );
}
