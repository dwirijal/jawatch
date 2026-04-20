import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function read(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function hasExplicitNavbarFooterCleanup(source) {
  const cleanupBlocks = Array.from(
    source.matchAll(/return\s*\(\)\s*=>\s*{([\s\S]*?)\n\s*};/gm),
    (match) => match[1] ?? '',
  );

  return cleanupBlocks.some(
    (block) => block.includes('setNavbarHidden(false);') && block.includes('setFooterHidden(false);'),
  );
}

test('UI surfaces that hide navbar and footer include unmount cleanup', () => {
  const files = [
    'src/components/organisms/WatchModeSurface.tsx',
    'src/features/shorts/DrachinPageClient.tsx',
  ];

  const violations = files
    .map((file) => {
      const source = read(file);
      return hasExplicitNavbarFooterCleanup(source) ? null : `${file}: missing navbar/footer cleanup`;
    })
    .filter(Boolean);

  assert.deepEqual(violations, []);
});
