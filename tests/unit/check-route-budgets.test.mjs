import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateBudgetLevel,
  evaluateRouteBudget,
  evaluateSharedChunkBudget,
  matchRouteBudgetGroup,
} from '../../scripts/check-route-budgets.mjs';

const routeGroups = [
  {
    name: 'detail',
    routePatterns: ['^/series/\\[slug\\]$', '^/movies/\\[slug\\]$'],
    budgets: {
      healthy: { gzipBytes: 180_000, rawBytes: 575_000 },
      warn: { gzipBytes: 205_000, rawBytes: 675_000 },
      fail: { gzipBytes: 230_000, rawBytes: 760_000 },
    },
  },
];

test('matches routes against budget group regexes', () => {
  assert.equal(matchRouteBudgetGroup('/series/[slug]', routeGroups)?.name, 'detail');
  assert.equal(matchRouteBudgetGroup('/unknown', routeGroups), null);
});

test('classifies budget levels using healthy, warn, and fail thresholds', () => {
  assert.equal(
    evaluateBudgetLevel(
      { gzipBytes: 170_000, rawBytes: 500_000 },
      routeGroups[0].budgets,
    ),
    'HEALTHY',
  );

  assert.equal(
    evaluateBudgetLevel(
      { gzipBytes: 210_000, rawBytes: 700_000 },
      routeGroups[0].budgets,
    ),
    'WARN',
  );

  assert.equal(
    evaluateBudgetLevel(
      { gzipBytes: 235_000, rawBytes: 700_000 },
      routeGroups[0].budgets,
    ),
    'FAIL',
  );
});

test('evaluates route budgets with the matched group attached', () => {
  const result = evaluateRouteBudget(
    { route: '/series/[slug]', gzipBytes: 227_408, rawBytes: 745_960, brotliBytes: 198_601 },
    routeGroups,
  );

  assert.deepEqual(
    {
      route: result.route,
      groupName: result.groupName,
      level: result.level,
      blocking: result.blocking,
    },
    {
      route: '/series/[slug]',
      groupName: 'detail',
      level: 'WARN',
      blocking: false,
    },
  );
});

test('marks shared chunk overages as non-blocking when report-only is enabled', () => {
  const result = evaluateSharedChunkBudget(
    [
      { path: 'a.js', count: 39, rawBytes: 226_355, gzipBytes: 70_572, brotliBytes: 60_461 },
      { path: 'b.js', count: 39, rawBytes: 136_649, gzipBytes: 37_048, brotliBytes: 31_941 },
    ],
    {
      name: 'shared-global',
      topN: 2,
      reportOnly: true,
      budgets: {
        healthy: { gzipBytes: 60_000, rawBytes: 220_000 },
        warn: { gzipBytes: 80_000, rawBytes: 300_000 },
        fail: { gzipBytes: 95_000, rawBytes: 340_000 },
      },
    },
  );

  assert.deepEqual(
    {
      groupName: result.groupName,
      level: result.level,
      blocking: result.blocking,
      gzipBytes: result.gzipBytes,
      rawBytes: result.rawBytes,
    },
    {
      groupName: 'shared-global',
      level: 'FAIL',
      blocking: false,
      gzipBytes: 107_620,
      rawBytes: 363_004,
    },
  );
});
