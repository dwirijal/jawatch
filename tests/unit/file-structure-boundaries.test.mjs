import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

test('top-level source roots exist for domains, platform, and shared', () => {
  const srcDir = join(process.cwd(), 'src');
  const names = readdirSync(srcDir);

  assert.equal(names.includes('domains'), true);
  assert.equal(names.includes('platform'), true);
  assert.equal(names.includes('shared'), true);
});

test('shared UI avoids single-purpose wrappers for detail pages and cards', () => {
  const removedWrappers = [
    'src/components/organisms/VideoDetailHero.tsx',
    'src/components/organisms/HorizontalMediaDetailPage.tsx',
    'src/components/organisms/ReaderMediaDetailPage.tsx',
    'src/components/atoms/StaticMediaCard.tsx',
  ];

  for (const relativePath of removedWrappers) {
    assert.equal(
      existsSync(join(process.cwd(), relativePath)),
      false,
      `${relativePath} should stay folded into the canonical component`,
    );
  }
});

test('shared UI component filenames use standard product-neutral names', () => {
  const retiredComponentNames = [
    'src/components/atoms/Popper.tsx',
    'src/components/atoms/TitleBlock.tsx',
    'src/components/molecules/HubLaneCard.tsx',
    'src/components/molecules/StaggerEntry.tsx',
    'src/components/organisms/MediaHubHeader.tsx',
    'src/components/organisms/MediaHubTemplate.tsx',
    'src/components/organisms/VideoDetailHeroFrame.tsx',
  ];

  for (const relativePath of retiredComponentNames) {
    assert.equal(
      existsSync(join(process.cwd(), relativePath)),
      false,
      `${relativePath} should stay renamed to the canonical design-system name`,
    );
  }
});
