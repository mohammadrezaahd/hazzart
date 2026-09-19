import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nearestSlideIndex, projectMomentum, thumbGeometry, edgeAt } from '../utils/slider.ts';
import { clamp, damp, prefersReducedMotion } from '../utils/motion.ts';

test('nearestSlideIndex reports the slide the visitor is closest to', () => {
  const fractions = [0, 0.25, 0.5, 0.75, 1];
  assert.equal(nearestSlideIndex(fractions, 0), 0);
  assert.equal(nearestSlideIndex(fractions, 0.31), 1);
  assert.equal(nearestSlideIndex(fractions, 0.5), 2);
  assert.equal(nearestSlideIndex(fractions, 0.9), 4);
  assert.equal(nearestSlideIndex(fractions, 1), 4);
  assert.equal(nearestSlideIndex(fractions, -3), 0);
  assert.equal(nearestSlideIndex([0.4], 0.9), 0);
  assert.equal(nearestSlideIndex([], 0.5), 0);
});

test('projectMomentum carries the release velocity and stays inside the track', () => {
  assert.equal(projectMomentum(400, 0, 2000), 400);
  assert.equal(projectMomentum(400, 1000, 2000, 0.32), 720);
  assert.equal(projectMomentum(400, -100000, 2000, 0.32), 0);
  assert.equal(projectMomentum(1900, 100000, 2000, 0.32), 2000);
  assert.equal(projectMomentum(0, 0, 0), 0);
});

test('thumbGeometry keeps the range thumb inside its rail and never smaller than a page width', () => {
  assert.deepEqual(thumbGeometry(0, 0.5), { start: 0, size: 0.5 });
  assert.deepEqual(thumbGeometry(1, 0.25), { start: 0.75, size: 0.25 });
  assert.deepEqual(thumbGeometry(0.9, 0.4), { start: 0.6, size: 0.4 });
  assert.deepEqual(thumbGeometry(-4, 0.02), { start: 0, size: 0.06 });
  assert.deepEqual(thumbGeometry(2, 4), { start: 0, size: 1 });
});

test('edgeAt only reports the ends of a bounded slider', () => {
  assert.equal(edgeAt(0, 1200), 'previous');
  assert.equal(edgeAt(1200, 1200), 'next');
  assert.equal(edgeAt(600, 1200), null);
  assert.equal(edgeAt(0, 0), null);
});

test('damp is frame-rate independent and converges on its target', () => {
  let slow = 0;
  for (let step = 0; step < 20; step++) slow = damp(slow, 100, 15, 0.05);
  let fast = 0;
  for (let step = 0; step < 100; step++) fast = damp(fast, 100, 15, 0.01);
  assert.ok(Math.abs(slow - fast) < 0.05);
  assert.ok(slow > 99);
  assert.equal(clamp(11, 0, 10), 10);
  assert.equal(prefersReducedMotion(), false, 'no window in Node — the guard must not throw');
});
