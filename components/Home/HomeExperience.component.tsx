'use client';

import { useEffect, useMemo, useState } from 'react';
import { getPublicPortfolio, type PublicPortfolioResponse } from '@/components/api/public';
import { orderArtworks } from '@/utils/artworks';
import type { TableOrder } from '@/interfaces/Portfolio';
import { FooterComponent } from '@/components/Layouts';
import { DeskModeComponent } from './ViewMode/DeskMode.component';

export function HomeExperience() {
  const [data, setData] = useState<PublicPortfolioResponse | null>(null);
  const [order, setOrder] = useState<TableOrder>('random');
  const [seed, setSeed] = useState(0);
  const [mediumId, setMediumId] = useState<string | null>(null);

  useEffect(() => { void getPublicPortfolio().then(setData).catch(() => setData(null)); }, []);

  const artworks = useMemo(() => {
    if (!data) return [];
    return orderArtworks(data.artworks.filter((art) => !mediumId || art.mediumId === mediumId), order, seed);
  }, [data, mediumId, order, seed]);

  if (!data) return <main className="table-experience" id="main-content"><p className="empty-table">Loading…</p></main>;

  return <main className="table-experience" id="main-content">
    <DeskModeComponent artworks={artworks} arrangementKey={order + ':' + seed + ':' + (mediumId ?? 'all')} />
    <FooterComponent order={order} mediumId={mediumId} mediums={data.mediums} onMediumChange={setMediumId} onOrderChange={next => { setOrder(next); if (next === 'random') setSeed(current => current + 1); }} />
  </main>;
}