import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CalendarCheck, ChevronDown, EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import { useBudget } from '../../hooks/useBudget';
import { supabase } from '../../lib/supabase';
import { formatNumber } from '../../utils/format';
import { CATEGORIES } from '../../constants/categories';
import { Category } from '../../types/budget';
import type { Transaction } from '../../types/budget';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const BADGE_BG: Record<Category, string> = {
  [Category.FIXED]: '#E5E5E5',
  [Category.LIVING]: '#D4EDDA',
  [Category.SELFCARE]: '#F5EBCA',
  [Category.SOCIAL]: '#FDDCBF',
  [Category.LEISURE]: '#E6DCFA',
  [Category.ETC]: '#E3E4E7',
};

export function ExpenseHistoryTable() {
  const { state, dispatch } = useBudget();
  const { transactions, selectedDate, monthlyIncomes, additionalIncomes, currentMonth } = state;
  const [collapsedCategories, setCollapsedCategories] = useState<Set<Category>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenuId) return;
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if ((e.target as HTMLElement).closest?.('[data-menu-trigger]')) return;
      setOpenMenuId(null);
      setMenuPosition(null);
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [openMenuId]);

  const handleMenuToggle = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
      setMenuPosition(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownHeight = 80;
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < dropdownHeight + 8;
    setOpenMenuId(id);
    setMenuPosition({
      top: showAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
      left: rect.right - 120,
    });
  };

  const dailyTransactions = useMemo(
    () => (selectedDate ? transactions.filter((t) => t.date === selectedDate) : []),
    [transactions, selectedDate],
  );

  const totalExpense = useMemo(
    () => dailyTransactions.reduce((sum, t) => sum + t.amount, 0),
    [dailyTransactions],
  );

  const dailyIncome = useMemo(() => {
    if (!selectedDate) return 0;
    const [year, month] = currentMonth.split('-').map(Number);
    const firstDate = `${year}-${String(month).padStart(2, '0')}-01`;
    if (selectedDate !== firstDate) return 0;
    const monthlyTotal = monthlyIncomes
      .filter((i) => i.month === currentMonth)
      .reduce((sum, i) => sum + i.amount, 0);
    const additionalTotal = additionalIncomes
      .filter((a) => a.month === currentMonth)
      .reduce((sum, a) => sum + a.amount, 0);
    return monthlyTotal + additionalTotal;
  }, [selectedDate, currentMonth, monthlyIncomes, additionalIncomes]);

  const groupedByCategory = useMemo(() => {
    const groups: Partial<Record<Category, Transaction[]>> = {};
    for (const t of dailyTransactions) {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category]!.push(t);
    }
    return groups;
  }, [dailyTransactions]);

  const orderedCategories = CATEGORIES.filter((c) => groupedByCategory[c.key]);

  const toggleCategory = (key: Category) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    setOpenMenuId(null);
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      dispatch({ type: 'DELETE_TRANSACTION', id });
    }
  };

  if (!selectedDate) {
    return (
      <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-white">
        <div className="flex items-center gap-2.5 border-b border-[var(--border-default)] px-5 py-4">
          <CalendarCheck size={18} className="text-[var(--accent-blue)]" />
          <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
            지출 내역
          </h2>
        </div>
        <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">날짜를 선택하세요</p>
      </div>
    );
  }

  const [, m, d] = selectedDate.split('-');
  const dateObj = new Date(selectedDate);
  const dayOfWeek = DAY_NAMES[dateObj.getDay()];
  const dateLabel = `${parseInt(m)}월 ${parseInt(d)}일 (${dayOfWeek})`;

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-default)] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <CalendarCheck size={18} className="text-[var(--accent-blue)]" />
          <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
            {dateLabel} 지출 내역
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[var(--text-secondary)]">수입</span>
            <span className="text-xs font-bold text-[var(--status-positive)]">
              {formatNumber(dailyIncome)}원
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[var(--text-secondary)]">지출</span>
            <span className="text-xs font-bold text-[var(--status-negative)]">
              {formatNumber(totalExpense)}원
            </span>
          </div>
        </div>
      </div>

      {/* Column Headers */}
      <div className="flex items-center gap-3 border-b border-[var(--border-default)] bg-[#F9FAFB] px-5 py-2.5">
        <span className="flex-1 text-[11px] font-bold text-[var(--text-secondary)]">항목</span>
        <span className="flex-1 text-[11px] font-bold text-[var(--text-secondary)]">세부항목</span>
        <span className="w-[120px] text-right text-[11px] font-bold text-[var(--text-secondary)]">
          금액
        </span>
        <span className="w-10 text-center text-[11px] font-bold text-[var(--text-secondary)]">
          작업
        </span>
      </div>

      {/* Content */}
      {dailyTransactions.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">
          지출 내역이 없습니다
        </p>
      ) : (
        orderedCategories.map((catInfo, catIdx) => {
          const items = groupedByCategory[catInfo.key]!;
          const catTotal = items.reduce((sum, t) => sum + t.amount, 0);
          const isOpen = !collapsedCategories.has(catInfo.key);
          const isLast = catIdx === orderedCategories.length - 1;

          return (
            <div
              key={catInfo.key}
              className={!isLast ? 'border-b border-[var(--border-default)]' : ''}
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(catInfo.key)}
                className="flex w-full items-center justify-between px-5 py-2.5"
                style={{ backgroundColor: catInfo.bgColor }}
              >
                <div className="flex items-center gap-2">
                  <ChevronDown
                    size={14}
                    style={{ color: catInfo.color }}
                    className={`transition-transform ${isOpen ? '' : '-rotate-90'}`}
                  />
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: catInfo.color }}
                  />
                  <span
                    className="rounded-[10px] px-2.5 py-0.5 text-[11px] font-bold"
                    style={{ color: catInfo.color, backgroundColor: BADGE_BG[catInfo.key] }}
                  >
                    {catInfo.label}
                  </span>
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    {items.length}건
                  </span>
                </div>
                <span className="text-[13px] font-bold" style={{ color: catInfo.color }}>
                  -{formatNumber(catTotal)}원
                </span>
              </button>

              {/* Transaction Items */}
              {isOpen &&
                items.map((t, i) => (
                  <div
                    key={t.id}
                    className="flex flex-col py-2.5 pl-12 pr-5"
                    style={
                      i < items.length - 1
                        ? { borderBottom: '1px solid var(--border-light)' }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-3">
                      {/* Sub Category & Memo */}
                      <div className="flex flex-1 items-center gap-1.5 min-w-0">
                        <div className="h-1 w-1 shrink-0 rounded-full bg-[var(--text-tertiary)]" />
                        <span className="truncate text-xs text-[var(--text-primary)]">
                          {t.sub_category}
                          {t.memo && (
                            <span className="text-[var(--text-tertiary)] ml-1 font-normal">
                              | {t.memo}
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Spacer for 세부항목 column */}
                      <div className="flex-1" />

                      {/* Amount */}
                      <div className="w-[120px] text-right text-xs text-[var(--status-negative)]">
                        -{formatNumber(t.amount)}
                      </div>

                      {/* Action */}
                      <div className="w-10 text-center">
                        <button
                          data-menu-trigger
                          onClick={(e) => handleMenuToggle(t.id, e)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)]"
                        >
                          <EllipsisVertical size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          );
        })
      )}

      {/* Dropdown Menu (Portal) */}
      {openMenuId && menuPosition && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 w-[120px] rounded-lg border border-[var(--border-default)] bg-white p-1"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
        >
          <button
            onClick={() => setOpenMenuId(null)}
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-[13px] text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)]"
          >
            <Pencil size={14} className="text-[var(--text-secondary)]" />
            수정
          </button>
          <div className="mx-2 h-px bg-[var(--border-default)]" />
          <button
            onClick={() => handleDelete(openMenuId)}
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-[13px] text-[var(--status-negative)] transition-colors hover:bg-red-50"
          >
            <Trash2 size={14} />
            삭제
          </button>
        </div>,
        document.body,
      )}
    </div>
  );
}
