import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { orderArtworks } from '../utils/artworks.ts';
import { navigationItems, footerItems } from '../consts/navigation.ts';
import { getCategoryAndDescendantIds, getExpandedCategoryId } from '../utils/categories.ts';
import type { Artwork, PaintingCategory } from '../interfaces/Portfolio.ts';

const categories: PaintingCategory[] = [
  { id: 'charcoal', label: 'Charcoal' },
  { id: 'series', label: 'Series', children: [{ id: 'portrait-series', label: 'Portraits' }] },
];

const artworks: Artwork[] = [
  {
    id: 'one', title: 'One', year: 2024, createdAt: '2024-01-01', description: 'Test',
    mediumId: 'charcoal', paintingCategoryIds: ['charcoal'],
    image: { src: '/images/1.png', alt: 'Test image', width: 143, height: 190 },
    hoverImage: { src: '/images/2.jpg', alt: 'Test hover', width: 3024, height: 4032 },
    dimensions: '', table: { rotation: 0, aspectRatio: 0.75 },
  },
  {
    id: 'two', title: 'Two', year: 2025, createdAt: '2025-01-01', description: 'Test',
    mediumId: 'charcoal', paintingCategoryIds: ['series', 'portrait-series'],
    image: { src: '/images/3.jpg', alt: 'Test image', width: 3024, height: 4032 },
    hoverImage: { src: '/images/4.jpg', alt: 'Test hover', width: 919, height: 1225 },
    dimensions: '', table: { rotation: 5, aspectRatio: 0.75 },
  },
];

test('artwork ordering is deterministic and does not mutate the source', () => {
  const before = JSON.stringify(artworks);
  assert.deepEqual(orderArtworks(artworks, 'random', 1), orderArtworks(artworks, 'random', 1));
  assert.equal(JSON.stringify(artworks), before);
  assert.deepEqual(orderArtworks([], 'recent', 0), []);
});

test('painting categories support parent and child filtering', () => {
  assert.deepEqual(getCategoryAndDescendantIds(categories, 'series'), ['series', 'portrait-series']);
  assert.equal(getExpandedCategoryId(categories, 'portrait-series'), 'series');
  assert.deepEqual(getCategoryAndDescendantIds(categories, 'missing'), []);
});

test('navigation and footer IDs are unique and routes are local', () => {
  assert.equal(new Set(navigationItems.map(item => item.href)).size, navigationItems.length);
  assert.equal(new Set(footerItems.map(item => item.id)).size, footerItems.length);
  for (const item of navigationItems) assert.match(item.href, /^\/(?:[a-z-]+)?$/);
});

test('desktop navigation keeps the underline hidden until the active item', () => {
  const css = readFileSync('app/globals.css', 'utf8');
  assert.match(css, /\.nav-indicator\s*\{[\s\S]*?opacity:\s*0/);
});

test('paper sound is a valid nonempty PCM WAV file', () => {
  const sound = readFileSync('public/audio/paper-drop.wav');
  assert.equal(sound.toString('ascii', 0, 4), 'RIFF');
  assert.equal(sound.toString('ascii', 8, 12), 'WAVE');
  assert.ok(sound.length > 1000);
});
