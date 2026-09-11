'use client';
import { useMemo, useState } from 'react';
import { fakeData } from '@/consts/fakeData';
import { orderArtworks } from '@/utils/artworks';
import type { TableOrder } from '@/interfaces/Portfolio';
import { FooterComponent } from '@/components/Layouts';
import { DeskModeComponent } from './ViewMode/DeskMode.component';

export function HomeExperience() {
  const [order, setOrder] = useState<TableOrder>('random');
  const [seed, setSeed] = useState(0);
  const [mediumId, setMediumId] = useState<string | null>(null);
  const artworks = useMemo(() => orderArtworks(fakeData.artworks.filter(art => !mediumId || art.mediumId === mediumId), order, seed), [mediumId, order, seed]);
  return <main className="table-experience" id="main-content">
    <DeskModeComponent artworks={artworks} arrangementKey={`${order}:${seed}:${mediumId ?? 'all'}`} />
    <FooterComponent order={order} mediumId={mediumId} mediums={fakeData.mediums} onMediumChange={setMediumId} onOrderChange={next => { setOrder(next); if (next === 'random') setSeed(current => current + 1); }} />
  </main>;
}
