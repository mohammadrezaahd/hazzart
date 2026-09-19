import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  edgeAt,
  nearestSlideIndex,
  pageWheelIntent,
  projectMomentum,
  railPositionToSlider,
  thumbGeometry,
} from '../utils/slider.ts';
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

test('the range thumb keeps both ends exact and lines up with the page cells', () => {
  assert.deepEqual(thumbGeometry(0, 0.5), { start: 0, size: 0.5 });
  assert.deepEqual(thumbGeometry(1, 0.25), { start: 0.75, size: 0.25 });
  assert.deepEqual(thumbGeometry(0.5, 0.4), { start: 0.3, size: 0.4 });
  assert.deepEqual(thumbGeometry(-1, 0.02), { start: 0, size: 0.06 });
  assert.deepEqual(thumbGeometry(2, 4), { start: 0, size: 1 });

  // Four projects: one page per cell, so every resting position sits on its cell.
  const size = 1 / 4;
  for (let index = 0; index < 4; index++) {
    const { start } = thumbGeometry(index / 3, size);
    assert.ok(Math.abs(start - index / 4) < 1e-9, `page ${index} should sit on its cell`);
  }
});

test('railPositionToSlider mirrors thumbGeometry while the control is dragged', () => {
  const size = 0.25;
  for (const position of [0, 0.25, 0.5, 0.75, 1]) {
    const { start } = thumbGeometry(position, size);
    const centre = start + size / 2;
    assert.ok(Math.abs(railPositionToSlider(centre, size) - position) < 1e-9);
  }
  assert.equal(railPositionToSlider(0.5, 1), 0);
});

test('pageWheelIntent turns a gesture into exactly one step', () => {
  let state = { direction: 0 as -1 | 1 | 0, accumulator: 0 };
  assert.deepEqual(pageWheelIntent(0, 12, 0, 40), { direction: 0, accumulator: 12 });
  assert.deepEqual(pageWheelIntent(12, 12, 1, 40), { direction: 0, accumulator: 24 });
  state = pageWheelIntent(24, 20, 1, 40);
  assert.deepEqual(state, { direction: 1, accumulator: 0 });
  // A new direction never reuses the old intent.
  assert.deepEqual(pageWheelIntent(30, -12, 1, 40), { direction: 0, accumulator: -12 });
  assert.deepEqual(pageWheelIntent(-35, -10, -1, 40), { direction: -1, accumulator: 0 });
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
