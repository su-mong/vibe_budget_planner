export function formatWon(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

export function formatNumber(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

export function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  return `${year}년 ${parseInt(m)}월`;
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getPrevMonth(month: string): string {
  const [year, m] = month.split('-').map(Number);
  if (m === 1) return `${year - 1}-12`;
  return `${year}-${String(m - 1).padStart(2, '0')}`;
}

export function getNextMonth(month: string): string {
  const [year, m] = month.split('-').map(Number);
  if (m === 12) return `${year + 1}-01`;
  return `${year}-${String(m + 1).padStart(2, '0')}`;
}

export function getDaysInMonth(month: string): number {
  const [year, m] = month.split('-').map(Number);
  return new Date(year, m, 0).getDate();
}

export function getFirstDayOfMonth(month: string): number {
  const [year, m] = month.split('-').map(Number);
  return new Date(year, m - 1, 1).getDay();
}

export function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
