import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('ads.txt contains the AdSense publisher declaration', () => {
  const adsTxt = fs.readFileSync(new URL('../../public/ads.txt', import.meta.url), 'utf8');
  assert.match(adsTxt, /google\.com, pub-8868090753979495, DIRECT, f08c47fec0942fa0/);
});

test('root layout declares the AdSense account meta tag and global script host', () => {
  const layout = fs.readFileSync(new URL('../../src/app/layout.tsx', import.meta.url), 'utf8');
  assert.match(layout, /google-adsense-account/);
  assert.match(layout, /ca-pub-8868090753979495/);
  assert.match(layout, /AdNetworkScripts/);
});
