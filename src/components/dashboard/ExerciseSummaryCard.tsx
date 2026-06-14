import { useMemo } from 'react';
import { Activity, Footprints } from 'lucide-react';
import { useBudget } from '../../hooks/useBudget';
import { getDaysInMonth, getFirstDayOfMonth } from '../../utils/format';
import { Card } from '../shared/Card';

export function ExerciseSummaryCard() {
  const { state } = useBudget();
  const month = state.currentMonth;

  const monthlyExerciseRecords = useMemo(
    () => state.exerciseRecords.filter((record) => record.date.startsWith(month)),
    [state.exerciseRecords, month]
  );
  const monthlyExerciseCount = monthlyExerciseRecords.length;
  const monthlyRunningCount = monthlyExerciseRecords.filter(
    (record) => record.running_completed
  ).length;
  const weeklySummaries = useMemo(() => {
    const firstDay = getFirstDayOfMonth(month);
    const weekCount = Math.ceil((firstDay + getDaysInMonth(month)) / 7);
    const summaries = Array.from({ length: weekCount }, (_, index) => ({
      week: index + 1,
      exerciseCount: 0,
      runningCount: 0,
    }));

    monthlyExerciseRecords.forEach((record) => {
      const day = Number(record.date.slice(-2));
      const weekIndex = Math.ceil((firstDay + day) / 7) - 1;
      const summary = summaries[weekIndex];
      if (!summary) return;

      summary.exerciseCount += 1;
      if (record.running_completed) {
        summary.runningCount += 1;
      }
    });

    return summaries;
  }, [monthlyExerciseRecords, month]);

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">운동 기록</h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">이번 달 운동 요약</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700">
              <Activity size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-blue-700">월별 운동 횟수</p>
              <p className="mt-0.5 text-xl font-bold leading-tight text-blue-900">
                {monthlyExerciseCount}회
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700">
              <Footprints size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-emerald-700">월별 런닝 횟수</p>
              <p className="mt-0.5 text-xl font-bold leading-tight text-emerald-900">
                {monthlyRunningCount}회
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-[var(--border-default)]">
          <div className="grid grid-cols-[1fr_1fr_1fr] bg-[var(--bg-muted)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)]">
            <span>주차</span>
            <span className="text-right">운동</span>
            <span className="text-right">런닝</span>
          </div>
          <div className="divide-y divide-[var(--border-light)]">
            {weeklySummaries.map((summary) => (
              <div
                key={summary.week}
                className="grid grid-cols-[1fr_1fr_1fr] px-4 py-2 text-sm text-[var(--text-primary)]"
              >
                <span>{summary.week}주차</span>
                <span className="text-right font-medium text-blue-800">
                  {summary.exerciseCount}회
                </span>
                <span className="text-right font-medium text-emerald-800">
                  {summary.runningCount}회
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
