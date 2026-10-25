"use client";

import { useEffect, useMemo, useState } from "react";
import { getPublicPortfolio, getPublicPortfolioSnapshot, type PublicPortfolioResponse } from "@/components/api/public";
import { getCategoryAndDescendantIds, getExpandedCategoryId } from "@/utils/categories";
import { orderArtworks } from "@/utils/artworks";
import { ArtworkSlider } from "./ArtworkSlider";
import { PaintingCategoryFilter } from "./PaintingCategoryFilter";

export function PaintingsExperience() {
  const [data, setData] = useState<PublicPortfolioResponse | null>(() => getPublicPortfolioSnapshot());
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [randomSeed, setRandomSeed] = useState(0);

  useEffect(() => { void getPublicPortfolio().then(setData).catch(() => setData(null)); }, []);

  // Shuffle after hydration so the initial server and client render match.
  useEffect(() => { setRandomSeed(Math.floor(Math.random() * 2_147_483_646) + 1); }, []);

  const categories = data?.paintingCategories ?? [];
  const expandedId = getExpandedCategoryId(categories, categoryId);
  const selectedIds = useMemo(
    () => categoryId ? new Set(getCategoryAndDescendantIds(categories, categoryId)) : null,
    [categories, categoryId],
  );

  const paintings = useMemo(
    () => orderArtworks(
      selectedIds
        ? (data?.artworks ?? []).filter((artwork) => artwork.paintingCategoryIds.some((id) => selectedIds.has(id)))
        : (data?.artworks ?? []),
      "random",
      randomSeed,
    ),
    [data?.artworks, selectedIds, randomSeed],
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