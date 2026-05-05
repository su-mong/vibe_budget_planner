import { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { Card } from '../shared/Card';
import { useBudget } from '../../hooks/useBudget';
import { supabase } from '../../lib/supabase';
import { formatNumber } from '../../utils/format';

interface DebtSummary {
  budget: number;
  actual: number;
}

export function DebtSection() {
  const { state, dispatch } = useBudget();
  const isEditing = state.editingSection === 'debt';

  // Aggregate monthly debts by item_id
  const debtSummaryMap: Record<string, DebtSummary> = {};
  state.monthlyDebts
    .filter((md) => md.month === state.currentMonth)
    .forEach((md) => {
      if (!debtSummaryMap[md.item_id]) {
        debtSummaryMap[md.item_id] = { budget: 0, actual: 0 };
      }
      // Sum actuals, but for budget we take the one that is set (or the first one we find)
      debtSummaryMap[md.item_id].actual += md.actual;
      if (md.budget > 0 || debtSummaryMap[md.item_id].budget === 0) {
        debtSummaryMap[md.item_id].budget = Math.max(debtSummaryMap[md.item_id].budget, md.budget);
      }
    });

  const [editValues, setEditValues] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isEditing) {
      const values: Record<string, number> = {};
      state.debtItems.forEach((item) => {
        values[item.id] = debtSummaryMap[item.id]?.budget || 0;
      });
      setEditValues(values);
    }
  }, [isEditing]);

  const totalBudget = state.debtItems.reduce(
    (sum, item) => sum + (debtSummaryMap[item.id]?.budget || 0), 0
  );
  const totalActual = state.debtItems.reduce(
    (sum, item) => sum + (debtSummaryMap[item.id]?.actual || 0), 0
  );

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    for (const item of state.debtItems) {
      const newBudget = editValues[item.id] || 0;
      const existingRecords = state.monthlyDebts.filter(
        (md) => md.month === state.currentMonth && md.item_id === item.id
      );

      if (existingRecords.length > 0) {
        // Update the first record with the new budget, reset others to 0 budget
        for (let i = 0; i < existingRecords.length; i++) {
          const record = existingRecords[i];
          const targetBudget = i === 0 ? newBudget : 0;

          if (record.budget !== targetBudget) {
            const { data, error } = await supabase
              .from('monthly_debts')
              .update({ budget: targetBudget })
              .eq('id', record.id)
              .select()
              .single();

            if (!error && data) {
              dispatch({ 
                type: 'UPSERT_MONTHLY_DEBT', 
                debt: { ...data, date: data.date, memo: data.memo } 
              });
            }
          }
        }
      } else if (newBudget > 0) {
        // Create a new record if one doesn't exist
        const { data, error } = await supabase
          .from('monthly_debts')
          .insert({
            user_id: user.id,
            month: state.currentMonth,
            item_id: item.id,
            budget: newBudget,
            actual: 0,
          })
          .select()
          .single();

        if (!error && data) {
          dispatch({ 
            type: 'UPSERT_MONTHLY_DEBT', 
            debt: { ...data, date: data.date } 
          });
        }
      }
    }

    dispatch({ type: 'SET_EDITING_SECTION', section: null });
  };

  return (
    <Card>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">부채</h3>
        {!isEditing && (
          <button
            onClick={() => dispatch({ type: 'SET_EDITING_SECTION', section: 'debt' })}
            className="rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)]"
          >
            <Pencil size={16} />
          </button>
        )}
      </div>

      {/* Table header */}
      <div className="mb-1 flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <span className="flex-1">항목</span>
        <span className="w-32 text-right">예상 납부액</span>
        <span className="w-32 text-right">실제 납부액</span>
      </div>

      {/* Debt rows */}
      <div className="divide-y divide-[var(--border-default)]">
        {state.debtItems.map((item) => {
          const summary = debtSummaryMap[item.id] || { budget: 0, actual: 0 };
          const editingBudget = editValues[item.id] ?? summary.budget;

          return (
            <div key={item.id} className="flex items-center justify-between py-2">
              <span className="flex-1 text-sm text-[var(--text-primary)]">{item.name}</span>

              {isEditing ? (
                <>
                  <input
                    type="number"
                    value={editingBudget || ''}
                    onChange={(e) => setEditValues(prev => ({ ...prev, [item.id]: Number(e.target.value) || 0 }))}
                    className="w-32 rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-right text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]"
                    placeholder="0"
                  />
                  <span className="ml-2 w-32 text-right text-sm font-medium text-[var(--text-primary)] opacity-50">
                    {formatNumber(summary.actual)}원
                  </span>
                </>
              ) : (
                <>
                  <span className="w-32 text-right text-sm font-medium text-[var(--text-primary)]">
                    {formatNumber(summary.budget)}원
                  </span>
                  <span className="w-32 text-right text-sm font-medium text-[var(--text-primary)]">
                    {formatNumber(summary.actual)}원
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="mt-3 flex items-center justify-between border-t border-[var(--border-default)] pt-3">
        <span className="flex-1 text-sm font-semibold text-[var(--text-primary)]">합계</span>
        <span className="w-32 text-right text-sm font-semibold text-[var(--text-primary)]">
          {formatNumber(isEditing
            ? Object.values(editValues).reduce((s, v) => s + v, 0)
            : totalBudget
          )}원
        </span>
        <span className="w-32 text-right text-sm font-semibold text-[var(--text-primary)]">
          {formatNumber(totalActual)}원
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
