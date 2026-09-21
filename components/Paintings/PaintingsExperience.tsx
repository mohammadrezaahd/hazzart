"use client";

import { useMemo, useState } from "react";
import { fakeData } from "@/consts/fakeData";
import {
  getCategoryAndDescendantIds,
  getExpandedCategoryId,
} from "@/utils/categories";
import { ArtworkSlider } from "./ArtworkSlider";
import { PaintingCategoryFilter } from "./PaintingCategoryFilter";

export function PaintingsExperience() {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const expandedId = getExpandedCategoryId(
    fakeData.paintingCategories,
    categoryId,
  );
  const selectedIds = useMemo(
    () =>
      categoryId
        ? new Set(
            getCategoryAndDescendantIds(
              fakeData.paintingCategories,
              categoryId,
            ),
          )
        : null,
    [categoryId],
  );
  const paintings = useMemo(
    () =>
      selectedIds
        ? fakeData.artworks.filter((artwork) =>
            artwork.paintingCategoryIds.some((id) => selectedIds.has(id)),
          )
        : fakeData.artworks,
    [selectedIds],
  );

  return (
    <main
      className="paintings-experience"
      data-series-expanded={expandedId === "series"}
      id="main-content"
    >
      <PaintingCategoryFilter
        categories={fakeData.paintingCategories}
        value={categoryId}
        onChange={setCategoryId}
      />
      <ArtworkSlider
        items={paintings}
        ariaLabel={
          categoryId ? `Paintings filtered by ${categoryId}` : "All paintings"
        }
      />
      <span className="sr-only" role="status">
        {paintings.length} paintings shown
      </span>
    </main>
  );
}
