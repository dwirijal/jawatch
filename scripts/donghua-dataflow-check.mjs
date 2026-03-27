import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const donghuaAdapterPath = path.join(__dirname, '..', 'src', 'lib', 'adapters', 'donghua.ts');
const donghuaPagePath = path.join(__dirname, '..', 'src', 'app', 'donghua', 'page.tsx');
const donghuaClientPath = path.join(__dirname, '..', 'src', 'app', 'donghua', 'DonghuaPageClient.tsx');
const donghuaDetailPath = path.join(__dirname, '..', 'src', 'app', 'donghua', '[slug]', 'page.tsx');
const donghuaEpisodePath = path.join(__dirname, '..', 'src', 'app', 'donghua', 'episode', '[episodeSlug]', 'page.tsx');
const apiPath = path.join(__dirname, '..', 'src', 'lib', 'api.ts');

assert.equal(fs.existsSync(apiPath), false, 'legacy src/lib/api.ts should be removed');

const adapterSource = fs.readFileSync(donghuaAdapterPath, 'utf8');
const pageSource = fs.readFileSync(donghuaPagePath, 'utf8');
const clientSource = fs.readFileSync(donghuaClientPath, 'utf8');
const detailSource = fs.readFileSync(donghuaDetailPath, 'utf8');
const episodeSource = fs.readFileSync(donghuaEpisodePath, 'utf8');

for (const token of [
  'export const getDonghuaHome',
  'export async function getDonghuaDetail',
  'export async function searchDonghua',
  'export async function getDonghuaEpisode',
  'export const getDonghuaWatch = getDonghuaEpisode',
  'export const donghua = {',
]) {
  assert.ok(adapterSource.includes(token), `donghua adapter is missing: ${token}`);
}

assert.ok(pageSource.includes(`from '@/lib/adapters/donghua'`), 'donghua page should use donghua adapter');
assert.ok(clientSource.includes(`from '@/lib/adapters/donghua'`), 'donghua client should use donghua adapter');
assert.ok(detailSource.includes(`from '@/lib/adapters/donghua'`), 'donghua detail should use donghua adapter');
assert.ok(episodeSource.includes(`from '@/lib/adapters/donghua'`), 'donghua episode should use donghua adapter');

console.log('Donghua adapter smoke checks passed.');
