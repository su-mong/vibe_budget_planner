import type { Category } from '../../types/budget';
import { CATEGORY_MAP } from '../../constants/categories';

interface CategoryDotProps {
  category: Category;
}

export function CategoryDot({ category }: CategoryDotProps) {
  const info = CATEGORY_MAP[category];

  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ backgroundColor: info.color }}
    />
  );
}
