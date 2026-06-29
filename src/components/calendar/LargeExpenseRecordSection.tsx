import { useMemo } from 'react';
import { WalletCards } from 'lucide-react';
import { Card } from '../shared/Card';
import { useBudget } from '../../hooks/useBudget';
import { formatNumber } from '../../utils/format';

export function LargeExpenseRecordSection() {
  const { state } = useBudget();

  const linkedTransactionsBySubItem = useMemo(() => {
    const transactionMap = new Map(
      state.largeExpenseLinkedTransactions.map((transaction) => [transaction.id, transaction]),
    );
    const map: Record<string, typeof state.largeExpenseLinkedTransactions> = {};

    for (const link of state.largeExpenseTransactionLinks) {
      const transaction = transactionMap.get(link.transaction_id);
      if (!transaction) continue;
      if (!map[link.large_expense_sub_item_id]) {
        map[link.large_expense_sub_item_id] = [];
      }
      map[link.large_expense_sub_item_id].push(transaction);
    }

    for (const subItemId in map) {
      map[subItemId].sort((a, b) => b.date.localeCompare(a.date));
    }

    return map;
  }, [state.largeExpenseTransactionLinks, state.largeExpenseLinkedTransactions]);

  const groups = useMemo(() => {
    return state.largeExpenses
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((group) => ({
        ...group,
        subItems: state.largeExpenseSubItems
          .filter((item) => item.large_expense_id === group.id)
          .slice()
          .sort((a, b) => a.order - b.order),
      }));
  }, [state.largeExpenses, state.largeExpenseSubItems]);

  const total = useMemo(
    () =>
      groups.reduce(
        (sum, group) =>
          sum + group.subItems.reduce((subSum, item) => subSum + (item.budget_amount || 0), 0),
        0,
      ),
    [groups],
  );
  const actualTotal = useMemo(
    () =>
      Object.values(linkedTransactionsBySubItem).reduce(
        (sum, transactions) =>
          sum + transactions.reduce((transactionSum, transaction) => transactionSum + transaction.amount, 0),
        0,
      ),
    [linkedTransactionsBySubItem],
  );

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2.5">
        <WalletCards size={18} className="text-[var(--accent-blue)]" />
        <h3 className="text-base font-semibold text-[var(--text-primary)]">큰 지출</h3>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border-default)]">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[1fr_1.1fr_140px_1.8fr] items-center border-b border-[var(--border-default)] bg-[#F9FAFB] px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)]">
            <span>메인 항목</span>
            <span>서브 항목</span>
            <span className="text-right">예산안</span>
            <span>실제 지출 내역</span>
          </div>

          {groups.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[var(--text-secondary)]">
              표시할 큰 지출 예산이 없습니다
            </p>
          ) : (
            <div className="divide-y divide-[var(--border-default)]">
              {groups.map((group) => (
                <div key={group.id}>
                  {group.subItems.length > 0 ? (
                    group.subItems.map((subItem, subIndex) => {
                      const linkedTransactions = linkedTransactionsBySubItem[subItem.id] ?? [];
                      const subItemActualTotal = linkedTransactions.reduce(
                        (sum, transaction) => sum + transaction.amount,
                        0,
                      );

                      return (
                        <div
                          key={subItem.id}
                          className="grid grid-cols-[1fr_1.1fr_140px_1.8fr] items-start gap-3 px-4 py-2.5 text-sm"
                        >
                          <span className="font-medium text-[var(--text-primary)]">
                            {subIndex === 0 ? group.name : ''}
                          </span>
                          <span className="text-[var(--text-secondary)]">{subItem.name}</span>
                          <span className="text-right font-medium text-[var(--text-primary)]">
                            {formatNumber(subItem.budget_amount || 0)}원
                          </span>
                          <div className="space-y-1">
                            {linkedTransactions.length > 0 ? (
                              <>
                                <div className="text-xs font-semibold text-[var(--status-negative)]">
                                  실제 {formatNumber(subItemActualTotal)}원
                                </div>
                                <div className="space-y-1">
                                  {linkedTransactions.map((transaction) => (
                                    <div
                                      key={transaction.id}
                                      className="flex items-start justify-between gap-3 rounded-lg bg-[#F9FAFB] px-2.5 py-1.5"
                                    >
                                      <div className="min-w-0">
                                        <div className="text-xs font-medium text-[var(--text-primary)]">
                                          {transaction.date} · {transaction.sub_category}
                                        </div>
                                        {transaction.memo && (
                                          <div className="truncate text-[11px] text-[var(--text-tertiary)]">
                                            {transaction.memo}
                                          </div>
                                        )}
                                      </div>
                                      <span className="shrink-0 text-xs font-semibold text-[var(--status-negative)]">
                                        -{formatNumber(transaction.amount)}원
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <span className="text-xs text-[var(--text-tertiary)]">
                                연결된 실제 지출이 없습니다
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="grid grid-cols-[1fr_1.1fr_140px_1.8fr] items-center gap-3 px-4 py-2.5 text-sm">
                      <span className="font-medium text-[var(--text-primary)]">{group.name}</span>
                      <span className="text-[var(--text-tertiary)]">-</span>
                      <span className="text-right font-medium text-[var(--text-primary)]">0원</span>
                      <span className="text-xs text-[var(--text-tertiary)]">연결된 실제 지출이 없습니다</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[var(--border-default)] pt-3">
        <span className="text-sm font-semibold text-[var(--text-primary)]">합계</span>
        <div className="flex items-center gap-4 text-sm font-semibold">
          <span className="text-[var(--accent-blue-dark)]">예산 {formatNumber(total)}원</span>
          <span className="text-[var(--status-negative)]">실제 {formatNumber(actualTotal)}원</span>
        </div>
      </div>
    </Card>
  );
}
