import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeChapterDetailPayload } from '../../src/lib/adapters/comic-chapter-normalization.ts';

test('chapter normalization filters empty images, upgrades URLs, and deduplicates pages', () => {
  const chapter = normalizeChapterDetailPayload({
    title: 'Chapter 1',
    images: [
      ' http://cdn.example.com/page-1.jpg?token=abc ',
      '//cdn.example.com/page-2.jpg',
      'https://cdn.example.com/page-2.jpg',
      '',
      '   ',
      '/local/page-3.jpg',
    ],
    navigation: {
      next: null,
      prev: null,
    },
  });

  assert.deepEqual(chapter.images, [
    'https://cdn.example.com/page-1.jpg',
    'https://cdn.example.com/page-2.jpg',
    '/local/page-3.jpg',
  ]);
});
