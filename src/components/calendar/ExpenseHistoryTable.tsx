import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CalendarCheck, ChevronDown, EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import { useBudget } from '../../hooks/useBudget';
import { supabase } from '../../lib/supabase';
import { formatNumber } from '../../utils/format';
import { CATEGORIES } from '../../constants/categories';
import { Category } from '../../types/budget';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

type HistoryItem = 
  | { type: 'expense'; id: string; category: Category; subCategory: string; amount: number; memo?: string | null }
  | { type: 'savings'; id: string; name: string; amount: number; memo?: string | null }
  | { type: 'debt'; id: string; name: string; amount: number; memo?: string | null };

export function ExpenseHistoryTable() {
  const { state, dispatch } = useBudget();
  const { 
    transactions, 
    selectedDate, 
    monthlyIncomes, 
    additionalIncomes, 
    currentMonth,
    monthlySavings,
    monthlyDebts,
    savingsItems,
    debtItems
  } = state;

  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openMenuType, setOpenMenuType] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenuId) return;
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if ((e.target as HTMLElement).closest?.('[data-menu-trigger]')) return;
      setOpenMenuId(null);
      setOpenMenuType(null);
      setMenuPosition(null);
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [openMenuId]);

  const handleMenuToggle = (id: string, type: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
      setOpenMenuType(null);
      setMenuPosition(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownHeight = 80;
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < dropdownHeight + 8;
    setOpenMenuId(id);
    setOpenMenuType(type);
    setMenuPosition({
      top: showAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
      left: rect.right - 120,
    });
  };

  const dailyItems = useMemo(() => {
    if (!selectedDate) return [];
    
    const items: HistoryItem[] = [];
    
    // Add expenses
    transactions
      .filter((t) => t.date === selectedDate)
      .forEach((t) => {
        items.push({
          type: 'expense',
          id: t.id,
          category: t.category,
          subCategory: t.sub_category,
          amount: t.amount,
          memo: t.memo
        });
      });

    // Add savings
    monthlySavings
      .filter((s) => s.date === selectedDate && s.actual > 0)
      .forEach((s) => {
        const itemInfo = savingsItems.find(i => i.id === s.item_id);
        items.push({
          type: 'savings',
          id: s.id,
          name: itemInfo?.name || '알 수 없는 저축',
          amount: s.actual,
          memo: s.memo
        });
      });

    // Add debts
    monthlyDebts
      .filter((d) => d.date === selectedDate && d.actual > 0)
      .forEach((d) => {
        const itemInfo = debtItems.find(i => i.id === d.item_id);
        items.push({
          type: 'debt',
          id: d.id,
          name: itemInfo?.name || '알 수 없는 부채',
          amount: d.actual,
          memo: d.memo
        });
      });

    return items;
  }, [selectedDate, transactions, monthlySavings, monthlyDebts, savingsItems, debtItems]);

  const totalExpensePlusDebt = useMemo(
    () => dailyItems.filter(item => item.type === 'expense' || item.type === 'debt').reduce((sum, i) => sum + i.amount, 0),
    [dailyItems],
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

  const groupedItems = useMemo(() => {
    const groups: Record<string, HistoryItem[]> = {};
    
    dailyItems.forEach((item) => {
      let groupKey = '';
      if (item.type === 'expense') groupKey = item.category;
      else if (item.type === 'savings') groupKey = 'savings';
      else if (item.type === 'debt') groupKey = 'debt';
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
    });
    
    return groups;
  }, [dailyItems]);

  const orderedGroupKeys = useMemo(() => {
    const keys: string[] = [];
    CATEGORIES.forEach(cat => {
      if (groupedItems[cat.key]) keys.push(cat.key);
    });
    if (groupedItems['savings']) keys.push('savings');
    if (groupedItems['debt']) keys.push('debt');
    return keys;
  }, [groupedItems]);

  const toggleGroup = (key: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleDelete = async (id: string, type: string) => {
    setOpenMenuId(null);
    setOpenMenuType(null);

    if (type === 'expense') {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (!error) {
        dispatch({ type: 'DELETE_TRANSACTION', id });
      }
      return;
    }

    const tableName = type === 'savings' ? 'monthly_savings' : 'monthly_debts';
    const item = type === 'savings' 
      ? monthlySavings.find(s => s.id === id)
      : monthlyDebts.find(d => d.id === id);
    
    if (item && item.budget > 0) {
      const { data, error } = await supabase
        .from(tableName)
        .update({ actual: 0, date: null, memo: null })
        .eq('id', id)
        .select()
        .single();
      
      if (!error && data) {
        if (type === 'savings') {
          dispatch({ type: 'UPSERT_MONTHLY_SAVINGS', savings: { ...data, date: data.date } });
        } else if (type === 'debt') {
          dispatch({ type: 'UPSERT_MONTHLY_DEBT', debt: { ...data, date: data.date } });
        }
      }
    } else {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (!error) {
        const { data, error: fetchError } = await supabase
          .from(tableName)
          .select('*')
          .eq('month', currentMonth);
        
        if (!fetchError && data) {
          if (type === 'savings') {
            dispatch({ type: 'SET_MONTHLY_SAVINGS', savings: data });
          } else if (type === 'debt') {
            dispatch({ type: 'SET_MONTHLY_DEBTS', debts: data });
          }
        }
      }
    }
  };

  if (!selectedDate) {
    return (
      <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-white">
        <div className="flex items-center gap-2.5 border-b border-[var(--border-default)] px-5 py-4">
          <CalendarCheck size={18} className="text-[var(--accent-blue)]" />
          <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
            거래 내역
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
            {dateLabel} 거래 내역
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
            <span className="text-[11px] text-[var(--text-secondary)]">지출(+부채)</span>
            <span className="text-xs font-bold text-[var(--status-negative)]">
              {formatNumber(totalExpensePlusDebt)}원
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
      {dailyItems.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">
          거래 내역이 없습니다
        </p>
      ) : (
        orderedGroupKeys.map((groupKey, groupIdx) => {
          const items = groupedItems[groupKey]!;
          const groupTotal = items.reduce((sum, i) => sum + i.amount, 0);
          const isOpen = !collapsedCategories.has(groupKey);
          const isLast = groupIdx === orderedGroupKeys.length - 1;

          let label = '';
          let color = '';
          let bgColor = '';
          
          const catInfo = CATEGORIES.find(c => c.key === groupKey);
          if (catInfo) {
            label = catInfo.label;
            color = catInfo.color;
            bgColor = catInfo.bgColor;
          } else if (groupKey === 'savings') {
            label = '저축';
            color = '#3B82F6'; // blue-500
            bgColor = '#EFF6FF';
          } else if (groupKey === 'debt') {
            label = '부채';
            color = '#EF4444'; // red-500
            bgColor = '#FEF2F2';
          }

          return (
            <div
              key={groupKey}
              className={!isLast ? 'border-b border-[var(--border-default)]' : ''}
            >
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(groupKey)}
                className="flex w-full items-center justify-between px-5 py-2.5"
                style={{ backgroundColor: bgColor }}
              >
                <div className="flex items-center gap-2">
                  <ChevronDown
                    size={14}
                    style={{ color: color }}
                    className={`transition-transform ${isOpen ? '' : '-rotate-90'}`}
                  />
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span
                    className="rounded-[10px] px-2.5 py-0.5 text-[11px] font-bold"
                    style={{ color: color, backgroundColor: 'white', border: `1px solid ${color}20` }}
                  >
                    {label}
                  </span>
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    {items.length}건
                  </span>
                </div>
                <span className="text-[13px] font-bold" style={{ color: color }}>
                  {groupKey === 'savings' ? '' : '-'}{formatNumber(groupTotal)}원
                </span>
              </button>

              {/* Transaction Items */}
              {isOpen &&
                items.map((item, i) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex flex-col py-2.5 pl-12 pr-5"
                    style={
                      i < items.length - 1
                        ? { borderBottom: '1px solid var(--border-light)' }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-3">
                      {/* Sub Category / Name & Memo */}
                      <div className="flex flex-1 items-center gap-1.5 min-w-0">
                        <div className="h-1 w-1 shrink-0 rounded-full bg-[var(--text-tertiary)]" />
                        <span className="truncate text-xs text-[var(--text-primary)]">
                          {item.type === 'expense' ? item.subCategory : item.name}
                          {item.memo && (
                            <span className="text-[var(--text-tertiary)] ml-1 font-normal">
                              | {item.memo}
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Spacer for 세부항목 column */}
                      <div className="flex-1" />

                      {/* Amount */}
                      <div className={`w-[120px] text-right text-xs font-medium ${item.type === 'savings' ? 'text-blue-600' : 'text-[var(--status-negative)]'}`}>
                        {item.type === 'savings' ? '' : '-'}{formatNumber(item.amount)}
                      </div>

                      {/* Action */}
                      <div className="w-10 text-center">
                        <button
                          data-menu-trigger
                          onClick={(e) => handleMenuToggle(item.id, item.type, e)}
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
            onClick={() => {
              // Edit not yet implemented for all types, focusing on delete first
              setOpenMenuId(null);
              setOpenMenuType(null);
            }}
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-[13px] text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)]"
          >
            <Pencil size={14} className="text-[var(--text-secondary)]" />
            수정
          </button>
          <div className="mx-2 h-px bg-[var(--border-default)]" />
          <button
            onClick={() => handleDelete(openMenuId, openMenuType!)}
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
