import test from 'node:test';
import assert from 'node:assert/strict';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import nextConfig from '../../next.config.ts';

test('turbopack config pins the canonical app root for linked launch paths', () => {
  const tailwindCssEntry = fileURLToPath(new URL('../../node_modules/tailwindcss/index.css', import.meta.url));

  assert.equal(
    nextConfig.turbopack?.root,
    realpathSync(new URL('../../', import.meta.url)),
  );
  assert.deepEqual(nextConfig.turbopack?.resolveAlias, {
    animejs: 'animejs',
    'lucide-react': 'lucide-react',
    tailwindcss: tailwindCssEntry,
  });
});
