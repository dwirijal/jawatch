import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

if (process.env.VERCEL === "1") {
  process.exit(0);
}

const targetPath = path.join(
  process.cwd(),
  "node_modules",
  "@opennextjs",
  "cloudflare",
  "dist",
  "cli",
  "build",
  "patches",
  "plugins",
  "load-manifest.js",
);

const candidateNeedles = [
  '**/{*-manifest,required-server-files}.json',
  '**/{*-manifest,required-server-files,prefetch-hints}.json',
];
const patchedNeedle = '**/*.json';

if (!existsSync(targetPath)) {
  process.exit(0);
}

let source = await readFile(targetPath, "utf8");

if (!source.includes(patchedNeedle)) {
  const legacyNeedle = candidateNeedles.find((needle) => source.includes(needle));

  if (!legacyNeedle) {
    throw new Error(`Could not find expected manifest glob in ${targetPath}`);
  }

  source = source.replace(legacyNeedle, patchedNeedle);
}

const fallbackNeedle = '  throw new Error(\\`Unexpected loadManifest(\\${$PATH}) call!\\`);';
const fallbackPatch = '  return "{}";';

if (!source.includes('throw new Error(\\`Unexpected loadManifest(\\${$PATH}) call!\\`);')) {
  await writeFile(targetPath, source);
  process.exit(0);
}

if (!source.includes('return "{}";')) {
  if (!source.includes(fallbackNeedle)) {
    throw new Error(`Could not find expected loadManifest fallback in ${targetPath}`);
  }

  source = source.replace(fallbackNeedle, fallbackPatch);
} else if (source.includes(fallbackNeedle)) {
  source = source.replace(fallbackNeedle, fallbackPatch);
}

await writeFile(targetPath, source);
