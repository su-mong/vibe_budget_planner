import { useBudget } from '../../hooks/useBudget';
import { supabase } from '../../lib/supabase';
import { Card } from '../shared/Card';

export function CardPaymentCard() {
  const { state, dispatch } = useBudget();
  const currentDay = state.userSettings.card_payment_day;

  const handleDayChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === '' ? null : parseInt(e.target.value, 10);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_settings')
        .update({ card_payment_day: value })
        .eq('user_id', user.id);

      dispatch({ 
        type: 'SET_USER_SETTINGS', 
        settings: { ...state.userSettings, card_payment_day: value } 
      });
    } catch (err) {
      console.error('Failed to update card payment day:', err);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">카드 대금 지급</h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            매월 카드 대금이 빠져나가는 날을 지정합니다. (캘린더에 표시됨)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={currentDay ?? ''}
            onChange={handleDayChange}
            className="rounded-lg border border-[var(--border-default)] bg-white px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
          >
            <option value="">미지정</option>
            {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
              <option key={day} value={day}>
                {day}일
              </option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  );
}
