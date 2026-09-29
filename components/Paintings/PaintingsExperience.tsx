"use client";

import { useEffect, useMemo, useState } from "react";
import { getPublicPortfolio, type PublicPortfolioResponse } from "@/components/api/public";
import { getCategoryAndDescendantIds, getExpandedCategoryId } from "@/utils/categories";
import { ArtworkSlider } from "./ArtworkSlider";
import { PaintingCategoryFilter } from "./PaintingCategoryFilter";

export function PaintingsExperience() {
  const [data, setData] = useState<PublicPortfolioResponse | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  useEffect(() => { void getPublicPortfolio().then(setData).catch(() => setData(null)); }, []);

  const categories = data?.paintingCategories ?? [];
  const expandedId = getExpandedCategoryId(categories, categoryId);
  const selectedIds = useMemo(
    () => categoryId ? new Set(getCategoryAndDescendantIds(categories, categoryId)) : null,
    [categories, categoryId],
  );

  const paintings = useMemo(
    () => selectedIds
      ? (data?.artworks ?? []).filter((artwork) => artwork.paintingCategoryIds.some((id) => selectedIds.has(id)))
      : (data?.artworks ?? []),
    [data?.artworks, selectedIds],
  );

  if (!data) return <main className="paintings-experience" id="main-content"><p className="paintings-empty">Loading…</p></main>;

  return (
    <main className="paintings-experience" data-series-expanded={expandedId === "series"} id="main-content">
      <PaintingCategoryFilter categories={categories} value={categoryId} onChange={setCategoryId} />
      <ArtworkSlider items={paintings} ariaLabel={categoryId ? "Paintings filtered by " + categoryId : "All paintings"} />
      <span className="sr-only" role="status">{paintings.length} paintings shown</span>
    </main>
  );
}
