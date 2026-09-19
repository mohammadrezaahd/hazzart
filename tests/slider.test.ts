import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  edgeAt,
  nearestSlideIndex,
  projectMomentum,
  rangePositionFromPointer,
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

test('edgeAt only reports the ends of a bounded slider', () => {
  assert.equal(edgeAt(0, 1200), 'previous');
  assert.equal(edgeAt(1200, 1200), 'next');
  assert.equal(edgeAt(600, 1200), null);
  assert.equal(edgeAt(0, 0), null);
});

test('the range dot follows the pointer and keeps its grab offset', () => {
  const rect = { left: 100, width: 400 };
  const close = (input: number, expected: number) => {
    assert.ok(Math.abs(input - expected) < 1e-6, `${input} should be ${expected}`);
  };
  close(rangePositionFromPointer(100, rect), 0);
  close(rangePositionFromPointer(300, rect), 0.5);
  close(rangePositionFromPointer(500, rect), 1);
  close(rangePositionFromPointer(900, rect), 1);
  close(rangePositionFromPointer(0, rect), 0);
  // Grabbed off centre: the dot stays under the finger instead of jumping to it.
  close(rangePositionFromPointer(340, rect, 0.1), 0.7);
  close(rangePositionFromPointer(340, rect, -0.05), 0.55);
  close(rangePositionFromPointer(300, { left: 0, width: 0 }), 0);
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
