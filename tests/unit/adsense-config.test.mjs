import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('ads.txt contains the AdSense publisher declaration', () => {
  const adsTxt = fs.readFileSync(new URL('../../public/ads.txt', import.meta.url), 'utf8');
  assert.match(adsTxt, /google\.com, pub-8868090753979495, DIRECT, f08c47fec0942fa0/);
});

test('root layout declares the AdSense account meta tag and global script host', () => {
  const layout = fs.readFileSync(new URL('../../src/app/layout.tsx', import.meta.url), 'utf8');
  const clientShell = fs.readFileSync(new URL('../../src/components/organisms/ClientShell.tsx', import.meta.url), 'utf8');
  assert.match(layout, /google-adsense-account/);
  assert.match(layout, /ca-pub-8868090753979495/);
  assert.match(clientShell, /AdNetworkScripts/);
  assert.doesNotMatch(layout, /<AdNetworkScripts/);
});

test('root layout loads the Ahrefs analytics script globally', () => {
  const layout = fs.readFileSync(new URL('../../src/app/layout.tsx', import.meta.url), 'utf8');
  assert.match(layout, /analytics\.ahrefs\.com\/analytics\.js/);
  assert.match(layout, /9conK1TrStSjw\+RqnvRU4g/);
});

test('content security policy permits configured analytics script hosts', () => {
  const config = fs.readFileSync(new URL('../../next.config.ts', import.meta.url), 'utf8');
  assert.match(config, /script-src[^"]*https:\/\/analytics\.ahrefs\.com/);
});

test('ad network script loads only when ad slots are configured', () => {
  const source = fs.readFileSync(new URL('../../src/components/organisms/AdNetworkScripts.tsx', import.meta.url), 'utf8');
  assert.match(source, /NEXT_PUBLIC_ADSENSE_SLOT_HORIZONTAL/);
  assert.match(source, /HAS_ADSENSE_INVENTORY/);
  assert.match(source, /ADSENSE_SLOT_IDS\.some\(Boolean\)/);
});
