'use client';

import type { PaintingCategory } from '@/interfaces/Portfolio';
import { getExpandedCategoryId } from '@/utils/categories';

interface PaintingCategoryFilterProps {
  categories: PaintingCategory[];
  value: string | null;
  onChange: (categoryId: string | null) => void;
}

export function PaintingCategoryFilter({ categories, value, onChange }: PaintingCategoryFilterProps) {
  const expandedId = getExpandedCategoryId(categories, value);

  return (
    <nav className="painting-filter" aria-label="Filter paintings">
      <div className="painting-filter__primary">
        <button type="button" aria-pressed={value === null} onClick={() => onChange(null)}>All</button>
        {categories.map(category => {
          const hasChildren = Boolean(category.children?.length);
          const expanded = hasChildren && expandedId === category.id;
          return (
            <div className="painting-filter__branch" data-expanded={expanded} key={category.id}>
              <button
                type="button"
                aria-pressed={value === category.id}
                aria-expanded={hasChildren ? expanded : undefined}
                onClick={() => onChange(category.id)}
              >
                {category.label}
              </button>
              {hasChildren && (
                <div className="painting-filter__children" aria-hidden={!expanded}>
                  {category.children?.map(child => (
                    <button
                      type="button"
                      key={child.id}
                      tabIndex={expanded ? 0 : -1}
                      aria-pressed={value === child.id}
                      onClick={() => onChange(child.id)}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
