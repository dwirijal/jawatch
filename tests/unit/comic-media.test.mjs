import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isProxyableComicImageHost,
  normalizeComicImageUrl,
  pickSubtypePosterImage,
} from '../../src/lib/comic-media.ts';

test('normalizes protocol-relative comic image URLs to https', () => {
  assert.equal(
    normalizeComicImageUrl('//cdn.example.com/posters/cover.jpg?width=300'),
    'https://cdn.example.com/posters/cover.jpg',
  );
});

test('upgrades insecure comic image URLs to https', () => {
  assert.equal(
    normalizeComicImageUrl('http://kacu.gmbr.pro/uploads/manga-images/m/murim-login/chapter-250/1.jpg?token=abc'),
    'https://kacu.gmbr.pro/uploads/manga-images/m/murim-login/chapter-250/1.jpg',
  );
});

test('routes hotlink-protected comic posters through the internal proxy', () => {
  assert.equal(
    normalizeComicImageUrl('https://bacaman00.sokuja.id/2024/10/BACAMAN-ao_no_hako-3.jpg'),
    '/api/comic/image?url=https%3A%2F%2Fbacaman00.sokuja.id%2F2024%2F10%2FBACAMAN-ao_no_hako-3.jpg',
  );
  assert.equal(
    normalizeComicImageUrl('https://02.ikiru.wtf/wp-content/uploads/2026/04/poster.png?resize=320'),
    '/api/comic/image?url=https%3A%2F%2F02.ikiru.wtf%2Fwp-content%2Fuploads%2F2026%2F04%2Fposter.png',
  );
});

test('comic image proxy allowlist includes only supported hotlink hosts', () => {
  assert.equal(isProxyableComicImageHost('bacaman00.sokuja.id'), true);
  assert.equal(isProxyableComicImageHost('03.ikiru.wtf'), true);
  assert.equal(isProxyableComicImageHost('images.example.com'), false);
});

test('picks a matching subtype poster from the primary comic shelf first', () => {
  assert.equal(
    pickSubtypePosterImage(
      [
        { image: 'https://cdn.example.com/manga.jpg', type: 'Manga', subtype: 'manga' },
        { image: 'https://cdn.example.com/manhwa.jpg', type: 'Manhwa', subtype: 'manhwa' },
      ],
      [{ image: 'https://cdn.example.com/fallback-manhwa.jpg', type: 'Manhwa', subtype: 'manhwa' }],
      'manhwa',
    ),
    'https://cdn.example.com/manhwa.jpg',
  );
});

test('falls back to the secondary comic shelf when the primary shelf misses a subtype poster', () => {
  assert.equal(
    pickSubtypePosterImage(
      [{ image: 'https://cdn.example.com/manga.jpg', type: 'Manga', subtype: 'manga' }],
      [{ image: 'https://cdn.example.com/manhua.jpg', type: 'Manhua', subtype: 'manhua' }],
      'manhua',
    ),
    'https://cdn.example.com/manhua.jpg',
  );
});
