import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isDirectMediaUrl,
  isHlsUrl,
  resolveVideoPlayerMediaMode,
} from '../../src/lib/video-player-media.ts';

test('resolveVideoPlayerMediaMode distinguishes direct, hls, embed, and empty states', () => {
  assert.equal(resolveVideoPlayerMediaMode(''), 'empty');
  assert.equal(resolveVideoPlayerMediaMode('https://cdn.example.com/video.mp4'), 'native');
  assert.equal(resolveVideoPlayerMediaMode('/api/lk21/manifest?id=abc'), 'hls');
  assert.equal(resolveVideoPlayerMediaMode('https://player.example.com/embed/123'), 'embed');
});

test('media URL helpers detect direct and hls playback sources explicitly', () => {
  assert.equal(isDirectMediaUrl('https://cdn.example.com/video.webm?token=123'), true);
  assert.equal(isDirectMediaUrl('https://player.example.com/embed/123'), false);

  assert.equal(isHlsUrl('https://cdn.example.com/live/master.m3u8'), true);
  assert.equal(isHlsUrl('/api/lk21/stream?id=abc'), true);
  assert.equal(isHlsUrl('https://cdn.example.com/video.mp4'), false);
});
