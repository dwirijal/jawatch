import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

const gitignore = read('.gitignore');
const nextConfig = read('next.config.ts');
const authOrigin = read(path.join('src', 'lib', 'auth-origin.ts'));
const novelReader = read(path.join('src', 'app', 'novel', '[slug]', 'read', '[chapter]', 'page.tsx'));
const trackedFiles = execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

assert.ok(gitignore.includes('.env*'), '.gitignore must ignore .env files');
assert.ok(!nextConfig.includes("hostname: '**'"), 'next/image wildcard host allowlist must not be used');
assert.ok(nextConfig.includes('configuredHosts.length > 0 ? configuredHosts : defaultImageRemoteHostPatterns'), 'next/image host allowlist must fall back to defaults when env is empty');
assert.ok(!nextConfig.includes('fullUrl: true'), 'full fetch URL logging must stay disabled');
assert.ok(!authOrigin.includes(".endsWith('.dwizzy.my.id')"), 'auth origin pinning must not allow sibling subdomains');
assert.ok(!authOrigin.includes('auth.dwizzy.my.id'), 'auth origin logic must not hardcode legacy auth.dwizzy.my.id host');
assert.ok(authOrigin.includes("const CANONICAL_APP_HOST = 'jawatch.web.id';"), 'auth origin must define jawatch.web.id as canonical app host');
assert.ok(authOrigin.includes('const DEFAULT_AUTH_ORIGIN = DEFAULT_APP_ORIGIN;'), 'auth origin must default to local app origin for embedded auth');
assert.ok(authOrigin.includes('return authOrigin.origin === current.origin;'), 'browser auth bridge must require same-origin auth in embedded mode');
assert.ok(novelReader.includes("import sanitizeHtml from 'sanitize-html'"), 'novel reader must use sanitize-html');
assert.ok(!trackedFiles.some((file) => /^\.env/i.test(path.basename(file))), 'tracked .env files are not allowed');
assert.ok(!trackedFiles.some((file) => /client_secret_.*\.json$/i.test(path.basename(file))), 'tracked OAuth client secret files are not allowed in this repo');
assert.ok(!trackedFiles.some((file) => /\.pem$/i.test(file)), 'tracked PEM/private key files are not allowed');

console.log('Security checks passed.');
