import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fakeData } from '../consts/fakeData.ts';
import { getProjectMedia, countProjectMedia, getProjectMediaCount } from '../utils/projects.ts';

const { projects } = fakeData;

test('projects have unique ids and complete, ordered copy', () => {
  assert.equal(new Set(projects.map(project => project.id)).size, projects.length);
  assert.ok(projects.length >= 3);
  for (const project of projects) {
    assert.ok(project.name.length > 2);
    assert.ok(project.tagline.length > 20);
    assert.ok(project.description.length > 80);
    assert.ok(project.year > 2000);
    assert.ok(project.discipline.length > 2);
    assert.ok(project.client.length > 2);
    assert.ok(project.myRole.length > 0);
    assert.ok(Object.keys(project.dynamicFields).length > 0);
    assert.ok(Object.values(project.dynamicFields).every(value => value.length > 1));
    assert.ok(project.links.every(link => link.href.startsWith('https://')));
    assert.equal(new Set(project.links.map(link => link.id)).size, project.links.length);
  }
});

test('every project asset exists, is described and keeps its aspect ratio', () => {
  for (const project of projects) {
    for (const item of getProjectMedia(project)) {
      assert.ok(existsSync(join(process.cwd(), 'public', item.src)), `${item.src} is missing`);
      assert.ok(item.alt.length > 20, `${item.src} needs a real alt text`);
      assert.ok(Math.abs(item.aspectRatio - item.width / item.height) < 0.02, `${item.src} aspect ratio is off`);
      assert.ok(item.width > 0 && item.height > 0);
    }
    assert.ok(project.cover.caption);
  }
});

test('the projects data reuses the supplied artwork assets', () => {
  const used = new Set(projects.flatMap(project => getProjectMedia(project).map(item => item.src)));
  for (const src of [
    '/images/1.png',
    '/images/2.jpg',
    '/images/3.jpg',
    '/images/4.jpg',
    '/images/5.jpg',
    '/images/6.jpg',
    '/images/7.jpg',
    '/artworks/artwork-6.png',
    '/artworks/artwork-7.png',
    '/artworks/artwork-12.png',
    '/artworks/artwork-13.png',
    '/artworks/artwork-16.png',
    '/artworks/artwork-19.png',
  ]) {
    assert.ok(used.has(src), `${src} should appear in the projects data`);
  }
  // 13 distinct files across 14 media slots: one reference photograph is shared.
  assert.equal(countProjectMedia(projects), 14);
  assert.equal(used.size, 13);
  assert.equal(getProjectMediaCount(projects[0]), 1 + projects[0].gallery.length);
  assert.equal(getProjectMedia(projects[0])[0], projects[0].cover);
});
