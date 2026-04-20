import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildLk21ProxyManifestUrl,
  buildLk21ProxyStreamUrl,
  extractLk21PlaybackId,
  resolveLk21MovieProviderUrl,
  rewriteLk21ManifestText,
  rewriteDeadLk21MirrorUrl,
} from '../../src/lib/adapters/movie-lk21-stream-resolver.ts';

test('rewriteDeadLk21MirrorUrl rewrites dead apivalidasi player host', () => {
  assert.equal(
    rewriteDeadLk21MirrorUrl('https://lk21.apivalidasi.my.id/pemutar-video?id=2a61889d280f49dba2a75308ba0fe120'),
    'https://playeriframe.sbs/iframe/p2p/2a61889d280f49dba2a75308ba0fe120',
  );
});

test('extractLk21PlaybackId reads ids from iframe and cloud player urls', () => {
  assert.equal(
    extractLk21PlaybackId('https://playeriframe.sbs/iframe/p2p/2a61889d280f49dba2a75308ba0fe120'),
    '2a61889d280f49dba2a75308ba0fe120',
  );
  assert.equal(
    extractLk21PlaybackId('https://cloud.hownetwork.xyz/video.php?id=2a61889d280f49dba2a75308ba0fe120'),
    '2a61889d280f49dba2a75308ba0fe120',
  );
  assert.equal(
    extractLk21PlaybackId('/api/lk21/manifest?id=2a61889d280f49dba2a75308ba0fe120'),
    '2a61889d280f49dba2a75308ba0fe120',
  );
});

test('resolveLk21MovieProviderUrl resolves ngopi redirect into local lk21 manifest proxy', async () => {
  const calls = [];
  const resolved = await resolveLk21MovieProviderUrl(
    'https://ngopi.web.id/dl.php?url=infiesto-2023&type=movie',
    async (input, init) => {
      calls.push({ input, init });
      return new Response(null, {
        status: 302,
        headers: {
          location: 'https://lk21.apivalidasi.my.id/pemutar-video?id=2a61889d280f49dba2a75308ba0fe120',
        },
      });
    },
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].input, 'https://ngopi.web.id/dl.php?url=infiesto-2023&type=movie');
  assert.equal(calls[0].init?.redirect, 'manual');
  assert.equal(
    resolved,
    buildLk21ProxyManifestUrl('2a61889d280f49dba2a75308ba0fe120'),
  );
});

test('rewriteLk21ManifestText rewrites upstream manifests to the local stream proxy', () => {
  const playbackId = '2a61889d280f49dba2a75308ba0fe120';
  const rewritten = rewriteLk21ManifestText(
    [
      '#EXTM3U',
      '#EXT-X-STREAM-INF:BANDWIDTH=800000',
      'https://cloud.hownetwork.xyz/xxx/2a61889d280f49dba2a75308ba0fe120/4/480.m3u8',
      '#EXTINF:5.000000,',
      'https://60f2b318.kisenupi.xyz/docs/sub4/2a61889d280f49dba2a75308ba0fe120/000.pict',
    ].join('\n'),
    'https://cloud.hownetwork.xyz/zzz/2a61889d280f49dba2a75308ba0fe120/4/480.m3u8',
    playbackId,
  );

  assert.equal(
    rewritten,
    [
      '#EXTM3U',
      '#EXT-X-STREAM-INF:BANDWIDTH=800000',
      buildLk21ProxyStreamUrl(
        'https://cloud.hownetwork.xyz/xxx/2a61889d280f49dba2a75308ba0fe120/4/480.m3u8',
        playbackId,
      ),
      '#EXTINF:5.000000,',
      buildLk21ProxyStreamUrl(
        'https://60f2b318.kisenupi.xyz/docs/sub4/2a61889d280f49dba2a75308ba0fe120/000.pict',
        playbackId,
      ),
    ].join('\n'),
  );
});
