"use client";

import { useMemo } from "react";
import type { AdminCategory } from "@/interfaces/Category";

interface CategoryMultiSelectProps {
  categories: AdminCategory[];
  value: string[];
  onChange: (value: string[]) => void;
  emptyText?: string;
}

export default function CategoryMultiSelect({
  categories,
  value,
  onChange,
  emptyText = "Create categories first.",
}: CategoryMultiSelectProps) {
  const parents = useMemo(
    () => categories.filter((category) => category.parentId === null),
    [categories],
  );

  const childrenByParent = useMemo(() => {
    const map = new Map<string, AdminCategory[]>();

    categories
      .filter((category) => category.parentId)
      .forEach((category) => {
        const current = map.get(category.parentId!) ?? [];
        current.push(category);
        map.set(category.parentId!, current);
      });

    return map;
  }, [categories]);

  function toggle(id: string) {
    onChange(
      value.includes(id)
        ? value.filter((categoryId) => categoryId !== id)
        : [...value, id],
    );
  }

  if (!parents.length) {
    return <p className="admin-artist-empty">{emptyText}</p>;
  }

  return (
    <div className="admin-painting-category-grid">
      {parents.map((parent) => (
        <div className="admin-painting-category-group" key={parent.id}>
          <label>
            <input
              type="checkbox"
              checked={value.includes(parent.id)}
              onChange={() => toggle(parent.id)}
            />
            <span>{parent.name}</span>
          </label>

          {(childrenByParent.get(parent.id) ?? []).map((child) => (
            <label key={child.id} className="is-child">
              <input
                type="checkbox"
                checked={value.includes(child.id)}
                onChange={() => toggle(child.id)}
              />
              <span>{child.name}</span>
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}
