import type { Artwork, TableOrder } from '@/interfaces/Portfolio';

/** Return a copy: never mutate the source data or reorder during SSR. */
export function orderArtworks(artworks: Artwork[], order: TableOrder, seed: number): Artwork[] {
  if (order === 'recent') return [...artworks].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (order === 'yearly') return [...artworks].sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));
  if (seed === 0) return [...artworks]; // Figma's initial stack, stable on server and client.
  let state = seed;
  const result = [...artworks];
  for (let i = result.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
