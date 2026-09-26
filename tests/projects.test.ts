import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fakeData } from '../consts/fakeData.ts';
import { countProjectImages, getProjectImageRatio, getProjectImages } from '../utils/projects.ts';

const { projects } = fakeData;

test('the projects page has a navigable fake project collection', () => {
  assert.ok(projects.length >= 3, 'the collection needs at least three projects');
  assert.equal(new Set(projects.map(project => project.id)).size, projects.length);

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

test('every project image exists, is described and keeps its aspect ratio', () => {
  for (const project of projects) {
    const images = getProjectImages(project);

    assert.ok(images.length >= 3, project.id + ' needs something to scroll through');
    assert.equal(countProjectImages(project), images.length);
    assert.equal(new Set(images.map(image => image.src)).size, images.length);

    for (const image of images) {
      assert.ok(existsSync(join(process.cwd(), 'public', image.src)), image.src + ' is missing');
      assert.ok(image.alt.length > 20, image.src + ' needs a real alt text');
      assert.ok(image.width > 0 && image.height > 0);
      assert.ok(
        Math.abs(getProjectImageRatio(image) - image.width / image.height) < 0.02,
        image.src + ' aspect ratio is off',
      );
    }
  }
});

test('the fake collection contains different project stories', () => {
  assert.ok(new Set(projects.map(project => project.name)).size >= 3);
  assert.ok(new Set(projects.map(project => project.description)).size >= 3);
});
