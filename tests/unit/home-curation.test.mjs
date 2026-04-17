import test from 'node:test';
import assert from 'node:assert/strict';

import {
  HOME_EDITORIAL_MAX_ITEMS,
  HOME_EDITORIAL_MAX_SECTIONS,
  curateHomeSections,
} from '../../src/lib/home-curation.ts';

function makeSection(id, itemCount) {
  return {
    id,
    title: id,
    subtitle: `${id} subtitle`,
    iconKey: 'popular',
    items: Array.from({ length: itemCount }, (_, index) => ({
      id: `${id}:${index}`,
      title: `${id} item ${index}`,
      image: '/placeholder.png',
      href: `/${id}/${index}`,
      theme: 'movie',
    })),
  };
}

test('curateHomeSections prioritizes editorial sections before falling back', () => {
  const curated = curateHomeSections([
    makeSection('series-korea', 5),
    makeSection('series-radar', 5),
    makeSection('popular-media', 5),
    makeSection('movie-latest', 5),
    makeSection('fresh-week', 5),
    makeSection('top-reading', 5),
    makeSection('community-lovers', 5),
  ]);

  assert.deepEqual(
    curated.map((section) => section.id),
    ['fresh-week', 'popular-media', 'movie-latest', 'series-radar', 'top-reading', 'community-lovers'],
  );
  assert.equal(curated.length, HOME_EDITORIAL_MAX_SECTIONS);
});

test('curateHomeSections filters undersized sections and caps items', () => {
  const curated = curateHomeSections([
    makeSection('fresh-week', 2),
    makeSection('popular-media', 10),
    makeSection('movie-latest', 9),
    makeSection('series-radar', 8),
    makeSection('top-reading', 4),
    makeSection('series-korea', 6),
  ]);

  assert.deepEqual(
    curated.map((section) => section.id),
    ['popular-media', 'movie-latest', 'series-radar', 'top-reading', 'series-korea'],
  );
  assert.equal(curated[0].items.length, HOME_EDITORIAL_MAX_ITEMS);
  assert.equal(curated[1].items.length, HOME_EDITORIAL_MAX_ITEMS);
});
