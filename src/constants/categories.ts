import { Category } from '../types/budget';

export interface CategoryInfo {
  key: Category;
  label: string;
  color: string;
  bgColor: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { key: Category.FIXED, label: '고정비', color: 'var(--cat-fixed)', bgColor: 'var(--cat-fixed-bg)' },
  { key: Category.LIVING, label: '생활비', color: 'var(--cat-living)', bgColor: 'var(--cat-living-bg)' },
  { key: Category.SELFCARE, label: '자기관리비', color: 'var(--cat-selfcare)', bgColor: 'var(--cat-selfcare-bg)' },
  { key: Category.SOCIAL, label: '사회생활비', color: 'var(--cat-social)', bgColor: 'var(--cat-social-bg)' },
  { key: Category.LEISURE, label: '여가비', color: 'var(--cat-leisure)', bgColor: 'var(--cat-leisure-bg)' },
  { key: Category.ETC, label: '기타', color: 'var(--cat-etc)', bgColor: 'var(--cat-etc-bg)' },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c])
) as Record<Category, CategoryInfo>;

export const DEFAULT_EXPENSE_SUB_ITEMS: { category: Category; items: string[] }[] = [
  { category: Category.FIXED, items: ['월세', '관리비', '공과금', '대중교통비', '시외교통비', '통신비', '구독료', '보험료'] },
  { category: Category.LIVING, items: ['식비', '커피', '간식및과일', '잡화', '병원비', '세탁비', '기타'] },
  { category: Category.SELFCARE, items: ['AI 관련', '미용관리', '책', '행사참여', '기타'] },
  { category: Category.SOCIAL, items: ['가족회비', '동아리', '경조사', '밥약', '카페', '이체', '택시', '선물', '기타'] },
  { category: Category.LEISURE, items: ['카페', '여행', '게임', '덕질', '기타'] },
  { category: Category.ETC, items: ['쇼핑', '예상외지출', '기타'] },
];

export const DEFAULT_INCOME_ITEMS = ['급여'];
