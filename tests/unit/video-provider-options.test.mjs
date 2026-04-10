import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  buildCanonicalDownloadGroups,
  buildCanonicalMirrors,
} from '../../src/lib/adapters/video-provider-option-utils.ts';

test('buildCanonicalMirrors keeps provider order and removes duplicate URLs', () => {
  const mirrors = buildCanonicalMirrors([
    { label: 'Server 1', embed_url: 'https://vidhide.org/embed/demo', host_code: 'vidhide_org', quality_code: null },
    { label: 'Mirror Duplicate', embed_url: 'https://vidhide.org/embed/demo', host_code: 'vidhide_org', quality_code: null },
    { label: '', embed_url: 'https://mixdrop.co/e/demo-2', host_code: 'mixdrop_co', quality_code: null },
  ]);

  assert.deepEqual(mirrors, [
    { label: 'Server 1', embed_url: 'https://vidhide.org/embed/demo' },
    { label: 'mixdrop_co', embed_url: 'https://mixdrop.co/e/demo-2' },
  ]);
});

test('buildCanonicalDownloadGroups groups downloads by format and quality', () => {
  const groups = buildCanonicalDownloadGroups([
    { label: 'PixelDrain', download_url: 'https://pixeldrain.com/u/demo-1080', host_code: 'pixeldrain_com', quality_code: '1080P', format_code: 'MKV' },
    { label: 'Mirror Duplicate', download_url: 'https://pixeldrain.com/u/demo-1080', host_code: 'pixeldrain_com', quality_code: '1080P', format_code: 'MKV' },
    { label: '', download_url: 'https://buzzheavier.com/demo-720', host_code: 'buzzheavier_com', quality_code: '720P', format_code: 'MP4' },
  ]);

  assert.deepEqual(groups, [
    {
      format: 'MKV',
      quality: '1080P',
      links: [{ label: 'PixelDrain', href: 'https://pixeldrain.com/u/demo-1080' }],
    },
    {
      format: 'MP4',
      quality: '720P',
      links: [{ label: 'buzzheavier_com', href: 'https://buzzheavier.com/demo-720' }],
    },
  ]);
});

test('readCanonicalPlaybackOptions orders canonical options by ascending stored priority with existing tie-breakers intact', () => {
  const source = readFileSync(new URL('../../src/lib/adapters/video-db-common.ts', import.meta.url), 'utf8');

  assert.match(source, /order by s\.priority asc, s\.last_verified_at desc nulls last, s\.updated_at desc nulls last/i);
  assert.match(source, /order by d\.priority asc, d\.last_verified_at desc nulls last, d\.updated_at desc nulls last/i);
});
