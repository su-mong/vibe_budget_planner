import { Plus, Trash2 } from 'lucide-react';
import { Card } from '../shared/Card';
import { useBudget } from '../../hooks/useBudget';
import { supabase } from '../../lib/supabase';
import { formatNumber } from '../../utils/format';

export function InstallmentSection() {
  const { state, dispatch } = useBudget();

  const currentInstallments = state.monthlyInstallments.filter(
    (mi) => mi.month === state.currentMonth
  );

  const total = currentInstallments.reduce((sum, mi) => sum + mi.amount, 0);

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('monthly_installments')
      .delete()
      .eq('id', id);

    if (error) return;

    dispatch({ type: 'DELETE_INSTALLMENT', id });
  };

  const handleAdd = () => {
    dispatch({ type: 'SET_MODAL', modal: { type: 'installment' } });
  };

  return (
    <Card>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">월별 할부 납부 내역</h3>
        <button
          onClick={handleAdd}
          className="rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)]"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Table header */}
      {currentInstallments.length > 0 && (
        <div className="mb-1 flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <span className="flex-1">항목</span>
          <span className="w-32 text-right">금액</span>
          <span className="w-8" /> {/* Delete button spacer */}
        </div>
      )}

      {/* Installment rows */}
      <div className="divide-y divide-[var(--border-default)]">
        {currentInstallments.length === 0 ? (
          <p className="py-3 text-center text-sm text-[var(--text-secondary)]">
            할부 납부 내역이 없습니다
          </p>
        ) : (
          currentInstallments.map((mi) => (
            <div key={mi.id} className="flex items-center justify-between py-2">
              <span className="flex-1 text-sm text-[var(--text-primary)]">{mi.name}</span>
              <span className="w-32 text-right text-sm font-medium text-[var(--text-primary)]">
                {formatNumber(mi.amount)}원
              </span>
              <div className="flex w-8 justify-end">
                <button
                  onClick={() => handleDelete(mi.id)}
                  className="rounded-lg p-1 text-[var(--text-secondary)] transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Total */}
      <div className="mt-3 flex items-center justify-between border-t border-[var(--border-default)] pt-3">
        <span className="flex-1 text-sm font-semibold text-[var(--text-primary)]">합계</span>
        <div className="flex items-center">
          <span className="w-32 text-right text-sm font-semibold text-[var(--text-primary)]">
            {formatNumber(total)}원
          </span>
          <span className="w-8" />
        </div>
      </div>
    </Card>
  );
}
