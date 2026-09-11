import { test } from 'node:test';
import assert from 'node:assert/strict';
import { orderArtworks } from '../utils/artworks.ts';
import { fakeData } from '../consts/fakeData.ts';
import { navigationItems, footerItems } from '../consts/navigation.ts';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

test('initial stack is hydration-stable and puts the Figma active artwork on top', () => {
  const first = orderArtworks(fakeData.artworks, 'random', 0);
  assert.deepEqual(first, orderArtworks(fakeData.artworks, 'random', 0));
  assert.equal(first.at(-1)?.id, 'roxy-on-a-ride');
  assert.notEqual(first, fakeData.artworks);
});
test('every shuffle preserves all IDs without changing the source', () => {
  const before = JSON.stringify(fakeData.artworks);
  const expected = fakeData.artworks.map(art => art.id).sort();
  for (let seed = 1; seed < 30; seed++) {
    const result = orderArtworks(fakeData.artworks, 'random', seed);
    assert.deepEqual(result.map(art => art.id).sort(), expected);
    assert.deepEqual(result, orderArtworks(fakeData.artworks, 'random', seed));
  }
  assert.equal(JSON.stringify(fakeData.artworks), before);
  assert.notDeepEqual(orderArtworks(fakeData.artworks, 'random', 1), fakeData.artworks);
});
test('recent and yearly arrangements expose the newest work at the top of the stack', () => {
  assert.equal(orderArtworks(fakeData.artworks, 'recent', 0).at(-1)?.id, 'floating');
  assert.equal(orderArtworks(fakeData.artworks, 'yearly', 0).at(-1)?.year, 2025);
  assert.deepEqual(orderArtworks([], 'recent', 0), []);
});
test('mock content uses valid dynamic categories and existing durable assets', () => {
  const mediums = new Set(fakeData.mediums.map(medium => medium.id));
  assert.equal(new Set(fakeData.artworks.map(art => art.id)).size, fakeData.artworks.length);
  for (const artwork of fakeData.artworks) {
    assert.ok(mediums.has(artwork.mediumId));
    assert.ok(existsSync(join(process.cwd(), 'public', artwork.image.src)));
    assert.ok(artwork.image.alt.length > 10);
    assert.ok(artwork.table.aspectRatio > 0);
  }
});
test('navigation and footer IDs are unique and routes are local', () => {
  assert.equal(new Set(navigationItems.map(item => item.href)).size, navigationItems.length);
  assert.equal(new Set(footerItems.map(item => item.id)).size, footerItems.length);
  for (const item of navigationItems) assert.match(item.href, /^\/(?:[a-z-]+)?$/);
});
test('paper sound is a valid nonempty PCM WAV file', () => {
  const sound = readFileSync('public/audio/paper-drop.wav');
  assert.equal(sound.toString('ascii', 0, 4), 'RIFF');
  assert.equal(sound.toString('ascii', 8, 12), 'WAVE');
  assert.ok(sound.length > 1000);
});
