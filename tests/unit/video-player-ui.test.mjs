import test from 'node:test';
import assert from 'node:assert/strict';

import { deriveMirrorSourceLabel, presentMirrorLabel } from '../../src/lib/video-player-ui.ts';

test('mirror labels preserve explicit quality markers first', () => {
  assert.equal(presentMirrorLabel('stream 1080p backup', 'https://cdn.example.com/embed', 0), '1080P');
  assert.equal(presentMirrorLabel('hls primary', 'https://cdn.example.com/embed', 0), 'HLS');
});

test('mirror labels infer a clearer source before falling back to numbered mirror text', () => {
  assert.equal(deriveMirrorSourceLabel('https://embedfast.example.com/stream/abc'), 'EMBEDFAST');
  assert.equal(deriveMirrorSourceLabel('/api/lk21/manifest/series-1'), 'SERVER');
  assert.equal(deriveMirrorSourceLabel('https://localhost/watch'), null);

  assert.equal(presentMirrorLabel('', 'https://embedfast.example.com/stream/abc', 1), 'EMBEDFAST');
  assert.equal(presentMirrorLabel('backup stream', 'about:blank', 2), 'Mirror 3');
  assert.equal(presentMirrorLabel('backup stream', '', 0), 'Mirror 1');
});
