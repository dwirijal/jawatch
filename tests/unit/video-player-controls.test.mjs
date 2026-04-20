import test from 'node:test';
import assert from 'node:assert/strict';

import { buildVideoPlayerControls } from '../../src/lib/video-player-controls.ts';

test('buildVideoPlayerControls keeps stable labels and order for compact layouts', () => {
  const controls = buildVideoPlayerControls({
    hasNext: true,
    hasReportedCurrentMirror: false,
  });

  assert.deepEqual(
    controls.map((item) => item.id),
    ['next', 'report', 'refresh', 'lights', 'theater'],
  );
  assert.deepEqual(
    controls.map((item) => item.label),
    ['Episode berikutnya', 'Laporkan sumber', 'Muat ulang pemutar', 'Redupkan lampu', 'Mode teater'],
  );
});

test('buildVideoPlayerControls disables only the report control after reporting the current mirror', () => {
  const controls = buildVideoPlayerControls({
    hasNext: false,
    hasReportedCurrentMirror: true,
  });

  assert.equal(controls.some((item) => item.id === 'next'), false);
  assert.equal(controls.find((item) => item.id === 'report')?.disabled, true);
  assert.equal(controls.find((item) => item.id === 'refresh')?.disabled ?? false, false);
  assert.equal(controls.find((item) => item.id === 'lights')?.disabled ?? false, false);
  assert.equal(controls.find((item) => item.id === 'theater')?.disabled ?? false, false);
});
