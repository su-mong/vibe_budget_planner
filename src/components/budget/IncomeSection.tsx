import { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { Card } from '../shared/Card';
import { BudgetRow } from './BudgetRow';
import { useBudget } from '../../hooks/useBudget';
import { supabase } from '../../lib/supabase';
import { formatNumber } from '../../utils/format';
import type { MonthlyIncome } from '../../types/budget';

export function IncomeSection() {
  const { state, dispatch } = useBudget();
  const isEditing = state.editingSection === 'income';

  // Build a map of item_id -> amount for the current month
  const incomeMap: Record<string, number> = {};
  const incomeDateMap: Record<string, string> = {};
  state.monthlyIncomes
    .filter((mi) => mi.month === state.currentMonth)
    .forEach((mi) => {
      incomeMap[mi.item_id] = mi.amount;
      incomeDateMap[mi.item_id] = mi.receive_date || '';
    });

  const [editValues, setEditValues] = useState<Record<string, number>>({});
  const [editDates, setEditDates] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditing) {
      const values: Record<string, number> = {};
      const dates: Record<string, string> = {};
      state.incomeItems.forEach((item) => {
        values[item.id] = incomeMap[item.id] || 0;
        dates[item.id] = incomeDateMap[item.id] || '';
      });
      setEditValues(values);
      setEditDates(dates);
    }
  }, [isEditing]);

  const total = state.incomeItems.reduce((sum, item) => sum + (incomeMap[item.id] || 0), 0);

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    for (const item of state.incomeItems) {
      const amount = editValues[item.id] || 0;
      const receive_date = editDates[item.id] || null;

      const { data, error } = await supabase
        .from('monthly_incomes')
        .upsert(
          {
            user_id: user.id,
            month: state.currentMonth,
            item_id: item.id,
            amount,
            receive_date,
          },
          { onConflict: 'user_id,month,item_id' }
        )
        .select()
        .single();

      if (error || !data) continue;

      const income: MonthlyIncome = {
        id: data.id,
        month: data.month,
        item_id: data.item_id,
        amount: data.amount,
        receive_date: data.receive_date,
      };

      dispatch({ type: 'UPSERT_MONTHLY_INCOME', income });
    }

    dispatch({ type: 'SET_EDITING_SECTION', section: null });
  };

  return (
    <Card>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">수입</h3>
        {!isEditing && (
          <button
            onClick={() => dispatch({ type: 'SET_EDITING_SECTION', section: 'income' })}
            className="rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)]"
          >
            <Pencil size={16} />
          </button>
        )}
      </div>

      {/* Income rows */}
      <div className="divide-y divide-[var(--border-default)]">
        {state.incomeItems.map((item) => (
          <div key={item.id} className="py-2">
            <BudgetRow
              label={item.name}
              value={isEditing ? (editValues[item.id] || 0) : (incomeMap[item.id] || 0)}
              isEditing={isEditing}
              onChange={(val) => setEditValues((prev) => ({ ...prev, [item.id]: val }))}
            />
            {item.name === '급여' && (
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">급여일</span>
                {isEditing ? (
                  <input
                    type="date"
                    value={editDates[item.id] || ''}
                    onChange={(e) => setEditDates((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    className="w-40 rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-right text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]"
                  />
                ) : (
                  <span className="text-xs font-medium text-[var(--text-primary)]">
                    {incomeDateMap[item.id] || '-'}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-3 flex items-center justify-between border-t border-[var(--border-default)] pt-3">
        <span className="text-sm font-semibold text-[var(--text-primary)]">합계</span>
        <span className="text-sm font-semibold text-[var(--text-primary)]">
          {formatNumber(isEditing
            ? Object.values(editValues).reduce((s, v) => s + v, 0)
            : total
          )}원
        </span>
      </div>

      {/* Save button */}
      {isEditing && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSave}
            className="rounded-lg bg-[var(--accent-blue)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            확인
          </button>
        </div>
      )}
    </Card>
  );
}
