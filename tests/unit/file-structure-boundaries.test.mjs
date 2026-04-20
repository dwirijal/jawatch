import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

test('top-level source roots exist for domains, platform, and shared', () => {
  const srcDir = join(process.cwd(), 'src');
  const names = readdirSync(srcDir);

  assert.equal(names.includes('domains'), true);
  assert.equal(names.includes('platform'), true);
  assert.equal(names.includes('shared'), true);
});
