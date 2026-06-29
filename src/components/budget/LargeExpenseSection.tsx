import { useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Trash2, WalletCards } from 'lucide-react';
import { Card } from '../shared/Card';
import { useBudget } from '../../hooks/useBudget';
import { supabase } from '../../lib/supabase';
import { formatNumber } from '../../utils/format';

interface DraftSubItem {
  id: string;
  name: string;
  amount: number;
  order: number;
}

interface DraftGroup {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  order: number;
  subItems: DraftSubItem[];
}

const createTempId = () => `temp-${crypto.randomUUID()}`;

const createDraftSubItem = (order: number): DraftSubItem => ({
  id: createTempId(),
  name: '',
  amount: 0,
  order,
});

const isPersistedId = (id: string) => !id.startsWith('temp-');

const getMonthDateRange = (month: string) => {
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return {
    start: `${month}-01`,
    end: `${month}-${String(lastDay).padStart(2, '0')}`,
  };
};

const createDraftGroup = (order: number, month: string): DraftGroup => {
  const { start, end } = getMonthDateRange(month);

  return {
    id: createTempId(),
    name: '',
    start_date: start,
    end_date: end,
    order,
    subItems: [createDraftSubItem(0)],
  };
};

const overlapsMonth = (startDate: string, endDate: string, month: string) => {
  const monthRange = getMonthDateRange(month);
  return startDate <= monthRange.end && endDate >= monthRange.start;
};

export function LargeExpenseSection() {
  const { state, dispatch } = useBudget();
  const isEditing = state.editingSection === 'largeExpense';
  const [draftGroups, setDraftGroups] = useState<DraftGroup[]>([]);
  const [deletedGroupIds, setDeletedGroupIds] = useState<string[]>([]);
  const [deletedSubItemIds, setDeletedSubItemIds] = useState<string[]>([]);

  const groups = useMemo(() => {
    return state.largeExpenses
      .slice()
      .filter((group) => overlapsMonth(group.start_date, group.end_date, state.currentMonth))
      .sort((a, b) => a.order - b.order)
      .map((group) => ({
        ...group,
        subItems: state.largeExpenseSubItems
          .filter((item) => item.large_expense_id === group.id)
          .slice()
          .sort((a, b) => a.order - b.order),
      }));
  }, [state.largeExpenses, state.largeExpenseSubItems, state.currentMonth]);

  useEffect(() => {
    if (!isEditing) return;

    const nextGroups = groups.map((group) => ({
      id: group.id,
      name: group.name,
      start_date: group.start_date,
      end_date: group.end_date,
      order: group.order,
      subItems: group.subItems.length > 0
        ? group.subItems.map((item) => ({
            id: item.id,
            name: item.name,
            amount: item.budget_amount ?? 0,
            order: item.order,
          }))
        : [createDraftSubItem(0)],
    }));

    setDraftGroups(nextGroups.length > 0 ? nextGroups : [createDraftGroup(0, state.currentMonth)]);
    setDeletedGroupIds([]);
    setDeletedSubItemIds([]);
  }, [isEditing, groups, state.currentMonth]);

  const totalAmount = isEditing
    ? draftGroups.reduce(
        (sum, group) => sum + group.subItems.reduce((subSum, item) => subSum + item.amount, 0),
        0,
      )
    : groups.reduce(
        (sum, group) =>
          sum + group.subItems.reduce((subSum, item) => subSum + (item.budget_amount || 0), 0),
        0,
      );

  const updateGroupName = (groupId: string, name: string) => {
    setDraftGroups((prev) =>
      prev.map((group) => (group.id === groupId ? { ...group, name } : group)),
    );
  };

  const updateGroupDate = (
    groupId: string,
    patch: Partial<Pick<DraftGroup, 'start_date' | 'end_date'>>,
  ) => {
    setDraftGroups((prev) =>
      prev.map((group) => (group.id === groupId ? { ...group, ...patch } : group)),
    );
  };

  const updateSubItem = (
    groupId: string,
    subItemId: string,
    patch: Partial<Pick<DraftSubItem, 'name' | 'amount'>>,
  ) => {
    setDraftGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        return {
          ...group,
          subItems: group.subItems.map((item) =>
            item.id === subItemId ? { ...item, ...patch } : item,
          ),
        };
      }),
    );
  };

  const addGroup = () => {
    setDraftGroups((prev) => [...prev, createDraftGroup(prev.length, state.currentMonth)]);
  };

  const addSubItem = (groupId: string) => {
    setDraftGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        return {
          ...group,
          subItems: [...group.subItems, createDraftSubItem(group.subItems.length)],
        };
      }),
    );
  };

  const removeGroup = (groupId: string) => {
    if (isPersistedId(groupId)) {
      setDeletedGroupIds((prev) => [...prev, groupId]);
    }
    setDraftGroups((prev) => {
      const next = prev.filter((group) => group.id !== groupId);
      return next.length > 0 ? next : [createDraftGroup(0, state.currentMonth)];
    });
  };

  const removeSubItem = (groupId: string, subItemId: string) => {
    if (isPersistedId(subItemId)) {
      setDeletedSubItemIds((prev) => [...prev, subItemId]);
    }
    setDraftGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        const nextSubItems = group.subItems.filter((item) => item.id !== subItemId);
        return {
          ...group,
          subItems: nextSubItems.length > 0 ? nextSubItems : [createDraftSubItem(0)],
        };
      }),
    );
  };

  const refreshLargeExpenseData = async (month: string) => {
    const { start, end } = getMonthDateRange(month);
    const { data: largeExpenses } = await supabase.from('large_expenses').select('*')
      .lte('start_date', end)
      .gte('end_date', start)
      .order('order');
    const activeLargeExpenseIds = (largeExpenses ?? []).map((item) => item.id);
    const { data: largeExpenseSubItems } = activeLargeExpenseIds.length > 0
      ? await supabase.from('large_expense_sub_items').select('*')
        .in('large_expense_id', activeLargeExpenseIds)
        .order('large_expense_id')
        .order('order')
      : { data: [] };

    dispatch({ type: 'SET_LARGE_EXPENSES', items: largeExpenses ?? [] });
    dispatch({ type: 'SET_LARGE_EXPENSE_SUB_ITEMS', items: largeExpenseSubItems ?? [] });
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (deletedSubItemIds.length > 0) {
      await supabase.from('large_expense_sub_items').delete().in('id', deletedSubItemIds);
    }

    if (deletedGroupIds.length > 0) {
      await supabase.from('large_expenses').delete().in('id', deletedGroupIds);
    }

    for (const [groupIndex, group] of draftGroups.entries()) {
      const groupName = group.name.trim();
      if (!groupName) continue;
      const fallbackRange = getMonthDateRange(state.currentMonth);
      const rawStartDate = group.start_date || fallbackRange.start;
      const rawEndDate = group.end_date || fallbackRange.end;
      const startDate = rawStartDate <= rawEndDate ? rawStartDate : rawEndDate;
      const endDate = rawStartDate <= rawEndDate ? rawEndDate : rawStartDate;

      const groupPayload = {
        user_id: user.id,
        name: groupName,
        start_date: startDate,
        end_date: endDate,
        order: groupIndex,
      };

      const groupQuery = isPersistedId(group.id)
        ? supabase.from('large_expenses').update(groupPayload).eq('id', group.id)
        : supabase
            .from('large_expenses')
            .upsert(groupPayload, { onConflict: 'user_id,name' });

      const { data: savedGroup, error: groupError } = await groupQuery.select().single();
      if (groupError || !savedGroup) {
        console.error('Failed to save large expense:', groupError);
        continue;
      }

      const validSubItems = group.subItems.filter((item) => item.name.trim());
      for (const [subIndex, subItem] of validSubItems.entries()) {
        const subItemPayload = {
          user_id: user.id,
          large_expense_id: savedGroup.id,
          name: subItem.name.trim(),
          budget_amount: subItem.amount,
          order: subIndex,
        };

        const subItemQuery = isPersistedId(subItem.id)
          ? supabase.from('large_expense_sub_items').update(subItemPayload).eq('id', subItem.id)
          : supabase.from('large_expense_sub_items').insert(subItemPayload);

        const { data: savedSubItem, error: subItemError } = await subItemQuery.select().single();
        if (subItemError || !savedSubItem) {
          console.error('Failed to save large expense sub item:', subItemError);
          continue;
        }

        void savedSubItem;
      }
    }

    await refreshLargeExpenseData(state.currentMonth);
    dispatch({ type: 'SET_EDITING_SECTION', section: null });
  };

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <WalletCards size={18} className="text-[var(--accent-blue)]" />
          <h3 className="text-base font-semibold text-[var(--text-primary)]">큰 지출 예산</h3>
        </div>
        {isEditing ? (
          <button
            onClick={handleSave}
            className="rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)]"
            aria-label="큰 지출 예산 저장"
          >
            <Eye size={16} />
          </button>
        ) : (
          <button
            onClick={() => dispatch({ type: 'SET_EDITING_SECTION', section: 'largeExpense' })}
            className="rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)]"
            aria-label="큰 지출 예산 편집"
          >
            <Pencil size={16} />
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border-default)]">
        <div className="min-w-[920px]">
        <div className="grid grid-cols-[1.05fr_240px_1.05fr_160px_44px] items-center border-b border-[var(--border-default)] bg-[#F9FAFB] px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)]">
          <span>메인 항목</span>
          <span>기간</span>
          <span>서브 항목</span>
          <span className="text-right">예산안</span>
          <span />
        </div>

        {isEditing ? (
          <div className="divide-y divide-[var(--border-default)]">
            {draftGroups.map((group) => (
              <div key={group.id} className="bg-white">
                {group.subItems.map((subItem, subIndex) => (
                  <div
                    key={subItem.id}
                    className="grid grid-cols-[1.05fr_240px_1.05fr_160px_44px] items-center gap-3 px-4 py-2"
                  >
                    {subIndex === 0 ? (
                      <input
                        value={group.name}
                        onChange={(event) => updateGroupName(group.id, event.target.value)}
                        className="rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]"
                        placeholder="예: 이사, 여행, 가전 교체"
                      />
                    ) : (
                      <span />
                    )}

                    {subIndex === 0 ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={group.start_date}
                          max={group.end_date}
                          onChange={(event) =>
                            updateGroupDate(group.id, { start_date: event.target.value })
                          }
                          className="w-full rounded-lg border border-[var(--border-default)] px-2 py-2 text-xs outline-none focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]"
                        />
                        <span className="text-xs text-[var(--text-tertiary)]">~</span>
                        <input
                          type="date"
                          value={group.end_date}
                          min={group.start_date}
                          onChange={(event) =>
                            updateGroupDate(group.id, { end_date: event.target.value })
                          }
                          className="w-full rounded-lg border border-[var(--border-default)] px-2 py-2 text-xs outline-none focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]"
                        />
                      </div>
                    ) : (
                      <span />
                    )}

                    <input
                      value={subItem.name}
                      onChange={(event) =>
                        updateSubItem(group.id, subItem.id, { name: event.target.value })
                      }
                      className="rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]"
                      placeholder="서브 항목명"
                    />

                    <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] px-3 py-2">
                      <span className="text-xs text-[var(--text-tertiary)]">₩</span>
                      <input
                        type="number"
                        value={subItem.amount || ''}
                        onChange={(event) =>
                          updateSubItem(group.id, subItem.id, {
                            amount: Number(event.target.value) || 0,
                          })
                        }
                        className="w-full bg-transparent text-right text-sm outline-none"
                        placeholder="0"
                      />
                    </div>

                    <button
                      onClick={() => removeSubItem(group.id, subItem.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--status-negative)]"
                      aria-label="서브 항목 삭제"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

                <div className="flex items-center justify-between bg-[#F9FAFB] px-4 py-2">
                  <button
                    onClick={() => addSubItem(group.id)}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-white"
                  >
                    <Plus size={13} />
                    서브 항목 추가
                  </button>
                  <button
                    onClick={() => removeGroup(group.id)}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:bg-white hover:text-[var(--status-negative)]"
                  >
                    메인 항목 삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : groups.length > 0 ? (
          <div className="divide-y divide-[var(--border-default)]">
            {groups.map((group) => (
              <div key={group.id}>
                {group.subItems.length > 0 ? (
                  group.subItems.map((subItem, subIndex) => (
                    <div
                      key={subItem.id}
                      className="grid grid-cols-[1.05fr_240px_1.05fr_160px_44px] items-center gap-3 px-4 py-2.5 text-sm"
                    >
                      <span className="font-medium text-[var(--text-primary)]">
                        {subIndex === 0 ? group.name : ''}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {subIndex === 0 ? `${group.start_date} ~ ${group.end_date}` : ''}
                      </span>
                      <span className="text-[var(--text-secondary)]">{subItem.name}</span>
                      <span className="text-right font-medium text-[var(--text-primary)]">
                        {formatNumber(subItem.budget_amount || 0)}원
                      </span>
                      <span />
                    </div>
                  ))
                ) : (
                  <div className="grid grid-cols-[1.05fr_240px_1.05fr_160px_44px] items-center gap-3 px-4 py-2.5 text-sm">
                    <span className="font-medium text-[var(--text-primary)]">{group.name}</span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {group.start_date} ~ {group.end_date}
                    </span>
                    <span className="text-[var(--text-tertiary)]">-</span>
                    <span className="text-right font-medium text-[var(--text-primary)]">0원</span>
                    <span />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-sm text-[var(--text-secondary)]">
            편집 버튼을 눌러 여러 달에 걸친 큰 지출 예산을 추가하세요.
          </div>
        )}
        </div>
      </div>

      {isEditing && (
        <div className="mt-3 flex justify-start">
          <button
            onClick={addGroup}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)]"
          >
            <Plus size={15} />
            메인 항목 추가
          </button>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-[var(--border-default)] pt-3">
        <span className="text-sm font-semibold text-[var(--text-primary)]">합계</span>
        <span className="text-sm font-semibold text-[var(--accent-blue-dark)]">
          {formatNumber(totalAmount)}원
        </span>
      </div>
    </Card>
  );
}
