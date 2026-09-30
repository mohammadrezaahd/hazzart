import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Project } from '../interfaces/Portfolio.ts';
import { countProjectImages, getProjectImageRatio, getProjectImages } from '../utils/projects.ts';

const projects: Project[] = [1, 2, 3].map((index) => ({
  id: 'test-project-' + index,
  name: 'Test Project ' + index,
  tagline: 'A local test project fixture.',
  description: 'A local test fixture used only to verify project image utilities.',
  year: 2024,
  discipline: 'Painting',
  client: 'Test',
  myRole: ['Artist'],
  images: [
    { src: '/images/1.png', alt: 'Test project image one', width: 143, height: 190, aspectRatio: 143 / 190 },
    { src: '/images/2.jpg', alt: 'Test project image two', width: 3024, height: 4032, aspectRatio: 3024 / 4032 },
    { src: '/images/3.jpg', alt: 'Test project image three', width: 3024, height: 4032, aspectRatio: 3024 / 4032 },
  ],
  links: [],
  dynamicFields: { Medium: 'Painting' },
}));

test('project fixtures have unique IDs and valid metadata', () => {
  assert.equal(new Set(projects.map(project => project.id)).size, projects.length);
  for (const project of projects) {
    assert.ok(project.name.length > 2);
    assert.ok(project.description.length > 20);
    assert.ok(project.images.length >= 3);
    assert.ok(Object.keys(project.dynamicFields).length > 0);
  }
});

test('every project image exists and keeps its aspect ratio', () => {
  for (const project of projects) {
    const images = getProjectImages(project);
    assert.equal(countProjectImages(project), images.length);
    assert.equal(new Set(images.map(image => image.src)).size, images.length);

    for (const image of images) {
      assert.ok(existsSync(join(process.cwd(), 'public', image.src)), image.src + ' is missing');
      assert.ok(image.alt.length > 5);
      assert.ok(Math.abs(getProjectImageRatio(image) - image.width / image.height) < 0.02);
    }
  }
});
