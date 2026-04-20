import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function read(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function extractBlock(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  if (start === -1) {
    throw new Error(`Missing CSS block start: ${startMarker}`);
  }

  const end = source.indexOf(endMarker, start);
  return source.slice(start, end === -1 ? source.length : end);
}

function extractVars(block) {
  const vars = {};
  for (const match of block.matchAll(/--([a-zA-Z0-9-]+):\s*([^;]+);/g)) {
    vars[match[1]] = match[2].trim();
  }
  return vars;
}

function resolveValue(vars, input, seen = new Set()) {
  const value = input.trim();
  const match = value.match(/^var\(--([a-zA-Z0-9-]+)\)$/);
  if (!match) {
    return value;
  }

  const tokenName = match[1];
  if (seen.has(tokenName)) {
    throw new Error(`Circular var() reference detected for ${tokenName}`);
  }

  const next = vars[tokenName];
  if (!next) {
    throw new Error(`Missing var() token: ${tokenName}`);
  }

  seen.add(tokenName);
  return resolveValue(vars, next, seen);
}

function oklchToRgb(lightness, chroma, hue) {
  const hueRadians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(hueRadians);
  const b = chroma * Math.sin(hueRadians);
  const L = lightness / 100;
  const l = L + 0.3963377774 * a + 0.2158037573 * b;
  const m = L - 0.1055613458 * a - 0.0638541728 * b;
  const s = L - 0.0894841775 * a - 1.291485548 * b;
  const l3 = l ** 3;
  const m3 = m ** 3;
  const s3 = s ** 3;

  const linear = {
    r: +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    g: -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    b: -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  };

  const toSrgb = (value) => {
    const normalized = value <= 0.0031308
      ? 12.92 * value
      : 1.055 * value ** (1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(normalized * 255)));
  };

  return {
    r: toSrgb(linear.r),
    g: toSrgb(linear.g),
    b: toSrgb(linear.b),
    a: 1,
  };
}

function parseColor(input) {
  const value = input.trim();
  if (value.startsWith('#')) {
    const hex = value.slice(1);
    if (hex.length === 6) {
      return {
        r: Number.parseInt(hex.slice(0, 2), 16),
        g: Number.parseInt(hex.slice(2, 4), 16),
        b: Number.parseInt(hex.slice(4, 6), 16),
        a: 1,
      };
    }
  }

  const oklch = value.match(/^oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/i);
  if (oklch) {
    const parsed = oklchToRgb(
      Number(oklch[1]),
      Number(oklch[2]),
      Number(oklch[3]),
    );

    return {
      ...parsed,
      a: oklch[4] == null ? 1 : Number(oklch[4]),
    };
  }

  const rgba = value.match(/rgba?\(([^)]+)\)/i);
  if (rgba) {
    const parts = rgba[1].split(',').map((part) => part.trim());
    return {
      r: Number(parts[0]),
      g: Number(parts[1]),
      b: Number(parts[2]),
      a: parts[3] == null ? 1 : Number(parts[3]),
    };
  }

  throw new Error(`Unsupported color format: ${input}`);
}

function compositeColor(foreground, background) {
  const alpha = foreground.a ?? 1;
  return {
    r: Math.round(foreground.r * alpha + background.r * (1 - alpha)),
    g: Math.round(foreground.g * alpha + background.g * (1 - alpha)),
    b: Math.round(foreground.b * alpha + background.b * (1 - alpha)),
    a: 1,
  };
}

function srgbToLinear(channel) {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(color) {
  const r = srgbToLinear(color.r);
  const g = srgbToLinear(color.g);
  const b = srgbToLinear(color.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function resolveToken(vars, tokenName, fallbackBackdrop = 'background') {
  const raw = vars[tokenName];
  if (!raw) {
    throw new Error(`Missing token: ${tokenName}`);
  }

  const parsed = parseColor(resolveValue(vars, raw));
  if ((parsed.a ?? 1) < 1) {
    return compositeColor(parsed, parseColor(resolveValue(vars, vars[fallbackBackdrop])));
  }

  return parsed;
}

const css = read('src/app/globals.css');
const primitiveVars = extractVars(extractBlock(css, ':root {', ':root,\nhtml[data-color-mode="light"] {'));
const lightVars = {
  ...primitiveVars,
  ...extractVars(extractBlock(css, ':root,\nhtml[data-color-mode="light"] {', 'html[data-color-mode="dark"] {')),
};
const darkVars = {
  ...primitiveVars,
  ...extractVars(extractBlock(css, 'html[data-color-mode="dark"] {', '@theme inline {')),
};

const CRITICAL_TOKEN_PAIRS = [
  ['accent-contrast', 'accent'],
  ['accent-contrast', 'accent-strong'],
  ['theme-default-contrast', 'theme-default-fill'],
  ['theme-anime-contrast', 'theme-anime-fill'],
  ['theme-manga-contrast', 'theme-manga-fill'],
  ['theme-donghua-contrast', 'theme-donghua-fill'],
  ['theme-movie-contrast', 'theme-movie-fill'],
  ['theme-drama-contrast', 'theme-drama-fill'],
  ['theme-novel-contrast', 'theme-novel-fill'],
  ['theme-default-text', 'theme-default-surface'],
  ['theme-anime-text', 'theme-anime-surface'],
  ['theme-manga-text', 'theme-manga-surface'],
  ['theme-donghua-text', 'theme-donghua-surface'],
  ['theme-movie-text', 'theme-movie-surface'],
  ['theme-drama-text', 'theme-drama-surface'],
  ['theme-novel-text', 'theme-novel-surface'],
];

for (const [mode, vars] of [['light', lightVars], ['dark', darkVars]]) {
  test(`${mode} mode critical token pairs keep AA contrast for normal text`, () => {
    const failures = [];

    for (const [foregroundToken, backgroundToken] of CRITICAL_TOKEN_PAIRS) {
      const ratio = contrastRatio(resolveToken(vars, foregroundToken), resolveToken(vars, backgroundToken));
      if (ratio < 4.5) {
        failures.push(`${mode}: ${foregroundToken} on ${backgroundToken} = ${ratio.toFixed(2)}:1`);
      }
    }

    assert.deepEqual(failures, []);
  });
}
