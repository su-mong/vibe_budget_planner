import type { Category } from '../../types/budget';
import { CATEGORY_MAP } from '../../constants/categories';

interface CategoryBadgeProps {
  category: Category;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const info = CATEGORY_MAP[category];

  return (
    <span
      className="inline-block rounded px-2 py-0.5 text-xs font-medium"
      style={{ color: info.color, backgroundColor: info.bgColor }}
    >
      {info.label}
    </span>
  );
}
