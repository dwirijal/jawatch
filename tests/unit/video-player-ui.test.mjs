import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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

test('landscape video player wrapper does not force full height inside watch grids', () => {
  const source = readFileSync(new URL('../../src/components/organisms/VideoPlayer.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /'relative z-\\[150\\] h-full w-full/);
  assert.match(source, /format === 'shorts' && 'h-full'/);
});

test('embed players defer third-party iframe loading until playback intent', () => {
  const source = readFileSync(new URL('../../src/components/organisms/video-player/VideoPlayerFrame.tsx', import.meta.url), 'utf8');

  assert.match(source, /const \[embedActivated, setEmbedActivated\]/);
  assert.match(source, /if \(!embedActivated\)/);
  assert.match(source, /aria-label="Putar video"/);
  assert.match(source, /loading="lazy"/);
});

test('detail trailer sections defer YouTube iframe loading until playback intent', () => {
  const lazyTrailerSource = readFileSync(new URL('../../src/components/organisms/LazyTrailerEmbed.tsx', import.meta.url), 'utf8');
  const movieDetailSource = readFileSync(new URL('../../src/domains/movies/ui/MovieDetailPage.tsx', import.meta.url), 'utf8');
  const seriesDetailSource = readFileSync(new URL('../../src/domains/series/ui/SeriesDetailPage.tsx', import.meta.url), 'utf8');

  assert.match(lazyTrailerSource, /const \[activated, setActivated\]/);
  assert.match(lazyTrailerSource, /aria-label={`Putar trailer/);
  assert.match(lazyTrailerSource, /<iframe/);
  assert.match(movieDetailSource, /<LazyTrailerEmbed embedUrl={trailerEmbedUrl} title={movie\.title} \/>/);
  assert.match(seriesDetailSource, /<LazyTrailerEmbed embedUrl={trailerEmbedUrl} title={series\.title} \/>/);
  assert.doesNotMatch(movieDetailSource, /<iframe/);
  assert.doesNotMatch(seriesDetailSource, /<iframe/);
});

test('series episode player wires the next control to a real route action', () => {
  const playerSource = readFileSync(new URL('../../src/components/organisms/VideoPlayer.tsx', import.meta.url), 'utf8');
  const episodePageSource = readFileSync(new URL('../../src/features/series/SeriesEpisodePage.tsx', import.meta.url), 'utf8');

  assert.match(playerSource, /nextHref\?: string \| null/);
  assert.match(playerSource, /const canGoNext = hasNext && Boolean\(onNext \|\| nextHref\)/);
  assert.match(episodePageSource, /nextHref={episode\.nextEpisodeHref}/);
});
