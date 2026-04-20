import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function walk(relativeDir) {
  const root = join(process.cwd(), relativeDir);
  const output = [];

  function visit(currentDir, currentRelativeDir) {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const nextPath = join(currentDir, entry.name);
      const nextRelativePath = `${currentRelativeDir}/${entry.name}`;

      if (entry.isDirectory()) {
        visit(nextPath, nextRelativePath);
        continue;
      }

      output.push(nextRelativePath);
    }
  }

  visit(root, relativeDir);
  return output;
}

function read(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function listSourceFiles() {
  return [...walk('src/components'), ...walk('src/features')].filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'));
}

const UNSAFE_PATTERNS = [
  /bg-surface-(?:1|2|elevated)[^"'`\n]*text-white|text-white[^"'`\n]*bg-surface-(?:1|2|elevated)/g,
  /bg-surface-(?:1|2|elevated)[^"'`\n]*text-zinc-(?:100|200|300|400)[^"'`\n]*|text-zinc-(?:100|200|300|400)[^"'`\n]*bg-surface-(?:1|2|elevated)/g,
];

test('light-surface classes avoid hard-coded white and pale zinc text colors', () => {
  const violations = [];

  for (const file of listSourceFiles()) {
    const source = read(file);

    for (const pattern of UNSAFE_PATTERNS) {
      const matches = source.match(pattern);
      if (!matches) {
        continue;
      }

      for (const match of matches) {
        violations.push(`${file}: ${match}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});
