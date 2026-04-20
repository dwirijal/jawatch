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

const css = read('src/app/globals.css');
const primitiveVars = extractVars(extractBlock(css, ':root {', ':root,\nhtml[data-color-mode="light"] {'));
const lightVars = extractVars(extractBlock(css, ':root,\nhtml[data-color-mode="light"] {', 'html[data-color-mode="dark"] {'));
const darkVars = extractVars(extractBlock(css, 'html[data-color-mode="dark"] {', '@theme inline {'));
const themeVars = extractVars(extractBlock(css, '@theme inline {', '@layer base {'));

const EXPECTED_PRIMITIVES = {
  'color-classic-crimson-50': 'oklch(94.89% 0.020 9.78)',
  'color-classic-crimson-100': 'oklch(90.01% 0.039 12.05)',
  'color-classic-crimson-200': 'oklch(80.32% 0.083 12.48)',
  'color-classic-crimson-300': 'oklch(71.18% 0.130 14.87)',
  'color-classic-crimson-400': 'oklch(63.19% 0.174 17.78)',
  'color-classic-crimson-500': 'oklch(57.14% 0.208 22.63)',
  'color-classic-crimson-600': 'oklch(48.57% 0.174 22.14)',
  'color-classic-crimson-700': 'oklch(39.59% 0.139 21.86)',
  'color-classic-crimson-800': 'oklch(30.14% 0.101 20.61)',
  'color-classic-crimson-900': 'oklch(19.95% 0.058 19.04)',
  'color-classic-crimson-950': 'oklch(16.71% 0.043 17.02)',
  'color-mint-leaf-50': 'oklch(97.68% 0.024 173.86)',
  'color-mint-leaf-100': 'oklch(95.41% 0.048 173.51)',
  'color-mint-leaf-200': 'oklch(91.33% 0.093 170.89)',
  'color-mint-leaf-300': 'oklch(87.93% 0.131 168.77)',
  'color-mint-leaf-400': 'oklch(85.22% 0.160 165.91)',
  'color-mint-leaf-500': 'oklch(83.19% 0.180 161.92)',
  'color-mint-leaf-600': 'oklch(70.42% 0.151 162.43)',
  'color-mint-leaf-700': 'oklch(57.02% 0.121 162.71)',
  'color-mint-leaf-800': 'oklch(42.78% 0.089 163.23)',
  'color-mint-leaf-900': 'oklch(27.23% 0.053 166.15)',
  'color-mint-leaf-950': 'oklch(22.18% 0.041 167.33)',
  'color-golden-orange-50': 'oklch(97.34% 0.021 79.10)',
  'color-golden-orange-100': 'oklch(94.89% 0.043 81.89)',
  'color-golden-orange-200': 'oklch(90.01% 0.085 81.41)',
  'color-golden-orange-300': 'oklch(85.20% 0.122 79.36)',
  'color-golden-orange-400': 'oklch(80.93% 0.150 76.55)',
  'color-golden-orange-500': 'oklch(77.04% 0.165 70.66)',
  'color-golden-orange-600': 'oklch(65.28% 0.139 71.04)',
  'color-golden-orange-700': 'oklch(52.96% 0.112 71.64)',
  'color-golden-orange-800': 'oklch(40.09% 0.083 74.05)',
  'color-golden-orange-900': 'oklch(25.84% 0.051 78.08)',
  'color-golden-orange-950': 'oklch(21.04% 0.041 81.04)',
  'color-strawberry-red-50': 'oklch(94.78% 0.023 17.56)',
  'color-strawberry-red-100': 'oklch(89.44% 0.049 18.10)',
  'color-strawberry-red-200': 'oklch(79.43% 0.103 19.60)',
  'color-strawberry-red-300': 'oklch(70.52% 0.159 21.99)',
  'color-strawberry-red-400': 'oklch(63.58% 0.209 25.41)',
  'color-strawberry-red-500': 'oklch(59.55% 0.237 28.57)',
  'color-strawberry-red-600': 'oklch(50.47% 0.200 28.44)',
  'color-strawberry-red-700': 'oklch(40.98% 0.160 28.19)',
  'color-strawberry-red-800': 'oklch(30.93% 0.117 27.66)',
  'color-strawberry-red-900': 'oklch(19.98% 0.071 26.45)',
  'color-strawberry-red-950': 'oklch(16.47% 0.055 25.63)',
  'color-azure-blue-50': 'oklch(95.25% 0.021 259.19)',
  'color-azure-blue-100': 'oklch(90.24% 0.044 259.95)',
  'color-azure-blue-200': 'oklch(80.61% 0.090 260.01)',
  'color-azure-blue-300': 'oklch(71.25% 0.139 259.68)',
  'color-azure-blue-400': 'oklch(62.55% 0.187 259.69)',
  'color-azure-blue-500': 'oklch(55.12% 0.229 260.92)',
  'color-azure-blue-600': 'oklch(46.93% 0.191 260.78)',
  'color-azure-blue-700': 'oklch(38.38% 0.151 260.54)',
  'color-azure-blue-800': 'oklch(29.34% 0.109 260.05)',
  'color-azure-blue-900': 'oklch(19.62% 0.064 257.65)',
  'color-azure-blue-950': 'oklch(16.50% 0.047 256.29)',
  'neutral-50': '#F7F7F7',
  'neutral-100': '#EFEFEF',
  'neutral-200': '#D9D9D9',
  'neutral-300': '#BFBFBF',
  'neutral-400': '#A6A6A6',
  'neutral-500': '#8C8C8C',
  'neutral-600': '#737373',
  'neutral-700': '#595959',
  'neutral-800': '#404040',
  'neutral-900': '#2A2A2A',
  'neutral-950': '#212121',
};

const SEMANTIC_RUNTIME_TOKENS = [
  'background',
  'background-alt',
  'foreground',
  'muted-foreground',
  'border-subtle',
  'border-strong',
  'surface-1',
  'surface-2',
  'surface-elevated',
  'surface-overlay',
  'accent',
  'accent-soft',
  'accent-strong',
  'accent-contrast',
  'shadow-color',
  'shadow-color-strong',
  'page-glow-top',
  'page-glow-side',
  'selection',
  'signal-success',
  'signal-success-surface',
  'signal-success-contrast',
  'signal-warning',
  'signal-warning-surface',
  'signal-warning-contrast',
  'signal-danger',
  'signal-danger-surface',
  'signal-danger-contrast',
  'signal-info',
  'signal-info-surface',
  'signal-info-contrast',
  'theme-primary-fill',
  'theme-primary-contrast',
  'theme-primary-text',
  'theme-primary-border',
  'theme-primary-surface',
  'theme-primary-shadow',
  'theme-default-fill',
  'theme-default-contrast',
  'theme-default-text',
  'theme-default-border',
  'theme-default-surface',
  'theme-default-shadow',
  'theme-anime-fill',
  'theme-anime-contrast',
  'theme-anime-text',
  'theme-anime-border',
  'theme-anime-surface',
  'theme-anime-shadow',
  'theme-manga-fill',
  'theme-manga-contrast',
  'theme-manga-text',
  'theme-manga-border',
  'theme-manga-surface',
  'theme-manga-shadow',
  'theme-donghua-fill',
  'theme-donghua-contrast',
  'theme-donghua-text',
  'theme-donghua-border',
  'theme-donghua-surface',
  'theme-donghua-shadow',
  'theme-movie-fill',
  'theme-movie-contrast',
  'theme-movie-text',
  'theme-movie-border',
  'theme-movie-surface',
  'theme-movie-shadow',
  'theme-drama-fill',
  'theme-drama-contrast',
  'theme-drama-text',
  'theme-drama-border',
  'theme-drama-surface',
  'theme-drama-shadow',
  'theme-novel-fill',
  'theme-novel-contrast',
  'theme-novel-text',
  'theme-novel-border',
  'theme-novel-surface',
  'theme-novel-shadow',
];

const THEME_SUFFIXES = ['fill', 'contrast', 'text', 'border', 'surface', 'shadow'];
const LEGACY_THEME_FAMILIES = ['default', 'anime', 'manga', 'donghua', 'movie', 'drama', 'novel'];
const THEME_EXPORT_FAMILIES = ['primary', 'success', 'warning', 'danger', 'info', 'neutral'];
const SCALE_STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

test('raw primitive palette matches the approved source-of-truth values', () => {
  for (const [token, expectedValue] of Object.entries(EXPECTED_PRIMITIVES)) {
    assert.equal(primitiveVars[token], expectedValue, `Unexpected value for ${token}`);
  }
});

for (const [mode, vars] of [['light', lightVars], ['dark', darkVars]]) {
  test(`${mode} runtime color aliases point at primitive tokens instead of raw colors`, () => {
    for (const token of SEMANTIC_RUNTIME_TOKENS) {
      assert.match(
        vars[token],
        /^var\(--[a-zA-Z0-9-]+\)$/,
        `${mode} ${token} must resolve through a token alias`,
      );
    }
  });
}

test('legacy theme families collapse into theme-primary compatibility aliases', () => {
  for (const suffix of THEME_SUFFIXES) {
    for (const family of LEGACY_THEME_FAMILIES) {
      assert.equal(
        lightVars[`theme-${family}-${suffix}`],
        `var(--theme-primary-${suffix})`,
        `light theme ${family}.${suffix} should point to theme-primary`,
      );
      assert.equal(
        darkVars[`theme-${family}-${suffix}`],
        `var(--theme-primary-${suffix})`,
        `dark theme ${family}.${suffix} should point to theme-primary`,
      );
    }
  }
});

test('@theme inline exports every approved primitive alias family and scale', () => {
  for (const family of THEME_EXPORT_FAMILIES) {
    for (const step of SCALE_STEPS) {
      const tokenName = `color-${family}-${step}`;
      assert.ok(themeVars[tokenName], `Missing ${tokenName} export in @theme inline`);
      assert.equal(
        themeVars[tokenName],
        `var(--primitive-color-${family}-${step})`,
        `${tokenName} should mirror the primitive alias`,
      );
    }
  }
});
