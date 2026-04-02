import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, '..');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureFile(filePath, hint) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${path.relative(repoRoot, filePath)} is missing. ${hint}`);
  }
}

function loadChunkMetrics(chunkPath, cache) {
  const cached = cache.get(chunkPath);
  if (cached) {
    return cached;
  }

  const buffer = fs.readFileSync(path.join(repoRoot, chunkPath));
  const metrics = {
    path: chunkPath,
    rawBytes: buffer.length,
    gzipBytes: zlib.gzipSync(buffer, { level: 9 }).length,
    brotliBytes: zlib.brotliCompressSync(buffer, {
      params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length,
  };

  cache.set(chunkPath, metrics);
  return metrics;
}

export function matchRouteBudgetGroup(route, routeGroups) {
  for (const group of routeGroups) {
    for (const pattern of group.routePatterns) {
      if (new RegExp(pattern).test(route)) {
        return group;
      }
    }
  }

  return null;
}

export function evaluateBudgetLevel(metrics, budgets) {
  if (metrics.gzipBytes <= budgets.healthy.gzipBytes && metrics.rawBytes <= budgets.healthy.rawBytes) {
    return 'HEALTHY';
  }

  if (metrics.gzipBytes > budgets.fail.gzipBytes || metrics.rawBytes > budgets.fail.rawBytes) {
    return 'FAIL';
  }

  if (metrics.gzipBytes > budgets.warn.gzipBytes || metrics.rawBytes > budgets.warn.rawBytes) {
    return 'WARN';
  }

  return 'OK';
}

export function evaluateRouteBudget(routeMetrics, routeGroups) {
  const group = matchRouteBudgetGroup(routeMetrics.route, routeGroups);

  if (!group) {
    return null;
  }

  const level = evaluateBudgetLevel(routeMetrics, group.budgets);

  return {
    ...routeMetrics,
    groupName: group.name,
    level,
    blocking: level === 'FAIL',
  };
}

export function evaluateSharedChunkBudget(chunkMetrics, sharedChunkBudget) {
  const selectedChunks = chunkMetrics.slice(0, sharedChunkBudget.topN);
  const totals = selectedChunks.reduce(
    (result, chunk) => ({
      rawBytes: result.rawBytes + chunk.rawBytes,
      gzipBytes: result.gzipBytes + chunk.gzipBytes,
      brotliBytes: result.brotliBytes + chunk.brotliBytes,
    }),
    { rawBytes: 0, gzipBytes: 0, brotliBytes: 0 },
  );
  const level = evaluateBudgetLevel(totals, sharedChunkBudget.budgets);

  return {
    ...totals,
    groupName: sharedChunkBudget.name,
    level,
    blocking: !sharedChunkBudget.reportOnly && level === 'FAIL',
    reportOnly: Boolean(sharedChunkBudget.reportOnly),
    selectedChunks,
  };
}

function routeIsIgnored(route, ignoreRoutePatterns = []) {
  return ignoreRoutePatterns.some((pattern) => new RegExp(pattern).test(route));
}

function collectRouteMetrics(stats, chunkCache) {
  return stats.map((row) => {
    const totals = row.firstLoadChunkPaths.reduce(
      (result, chunkPath) => {
        const chunk = loadChunkMetrics(chunkPath, chunkCache);
        return {
          rawBytes: result.rawBytes + chunk.rawBytes,
          gzipBytes: result.gzipBytes + chunk.gzipBytes,
          brotliBytes: result.brotliBytes + chunk.brotliBytes,
        };
      },
      { rawBytes: 0, gzipBytes: 0, brotliBytes: 0 },
    );

    return {
      route: row.route,
      ...totals,
      chunkCount: row.firstLoadChunkPaths.length,
    };
  });
}

function collectSharedChunkMetrics(stats, chunkCache) {
  const counts = new Map();

  for (const row of stats) {
    for (const chunkPath of row.firstLoadChunkPaths) {
      counts.set(chunkPath, (counts.get(chunkPath) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([chunkPath, count]) => ({
      ...loadChunkMetrics(chunkPath, chunkCache),
      count,
    }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }
      return right.gzipBytes - left.gzipBytes;
    });
}

function formatBytes(bytes) {
  return `${(bytes / 1000).toFixed(1)} KB`;
}

function printRouteResult(result) {
  console.log(
    [
      result.level.padEnd(7),
      result.groupName.padEnd(16),
      result.route.padEnd(28),
      `gzip=${formatBytes(result.gzipBytes).padStart(9)}`,
      `raw=${formatBytes(result.rawBytes).padStart(9)}`,
      `brotli=${formatBytes(result.brotliBytes).padStart(9)}`,
    ].join('  '),
  );
}

function printSharedChunkResult(result) {
  const status = result.reportOnly && result.level === 'FAIL' ? 'REPORT' : result.level;
  console.log(
    [
      status.padEnd(7),
      result.groupName.padEnd(16),
      '(top common chunks)'.padEnd(28),
      `gzip=${formatBytes(result.gzipBytes).padStart(9)}`,
      `raw=${formatBytes(result.rawBytes).padStart(9)}`,
      `brotli=${formatBytes(result.brotliBytes).padStart(9)}`,
    ].join('  '),
  );

  for (const chunk of result.selectedChunks) {
    console.log(
      `  chunk x${chunk.count}: ${chunk.path} gzip=${formatBytes(chunk.gzipBytes)} raw=${formatBytes(chunk.rawBytes)}`,
    );
  }
}

function printSummary(routeResults, skippedRoutes, sharedChunkResult) {
  const counts = routeResults.reduce(
    (result, routeResult) => {
      result[routeResult.level] = (result[routeResult.level] || 0) + 1;
      return result;
    },
    { HEALTHY: 0, OK: 0, WARN: 0, FAIL: 0 },
  );

  console.log('');
  console.log('Route Budgets');
  console.log('-------------');
  for (const routeResult of routeResults) {
    printRouteResult(routeResult);
  }

  console.log('');
  console.log('Shared Chunk Budget');
  console.log('-------------------');
  printSharedChunkResult(sharedChunkResult);

  console.log('');
  console.log('Summary');
  console.log('-------');
  console.log(
    `healthy=${counts.HEALTHY} ok=${counts.OK} warn=${counts.WARN} fail=${counts.FAIL} skipped=${skippedRoutes.length}`,
  );

  if (skippedRoutes.length > 0) {
    for (const route of skippedRoutes) {
      console.log(`  skipped: ${route}`);
    }
  }
}

export function evaluateRouteBudgets(stats, config, chunkCache = new Map()) {
  const routeMetrics = collectRouteMetrics(stats, chunkCache);
  const routeResults = [];
  const skippedRoutes = [];

  for (const routeMetricsItem of routeMetrics) {
    if (routeIsIgnored(routeMetricsItem.route, config.ignoreRoutePatterns)) {
      continue;
    }

    const result = evaluateRouteBudget(routeMetricsItem, config.routeGroups);
    if (result) {
      routeResults.push(result);
    } else {
      skippedRoutes.push(routeMetricsItem.route);
    }
  }

  routeResults.sort((left, right) => {
    const order = { FAIL: 0, WARN: 1, OK: 2, HEALTHY: 3 };
    return order[left.level] - order[right.level] || left.route.localeCompare(right.route);
  });

  const sharedChunkResult = evaluateSharedChunkBudget(
    collectSharedChunkMetrics(stats, chunkCache),
    config.sharedChunkBudget,
  );

  return {
    routeResults,
    skippedRoutes,
    sharedChunkResult,
  };
}

export function runBudgetCheck({
  configPath = path.join(repoRoot, 'perf-budgets.json'),
  statsPath = path.join(repoRoot, '.next', 'diagnostics', 'route-bundle-stats.json'),
} = {}) {
  ensureFile(configPath, 'Create the budget config before running this check.');
  ensureFile(statsPath, 'Run `npm run build` first so route diagnostics exist.');

  const config = readJson(configPath);
  const stats = readJson(statsPath);
  const { routeResults, skippedRoutes, sharedChunkResult } = evaluateRouteBudgets(stats, config);

  printSummary(routeResults, skippedRoutes, sharedChunkResult);

  return {
    routeResults,
    skippedRoutes,
    sharedChunkResult,
    hasBlockingFailure: routeResults.some((result) => result.blocking && result.level === 'FAIL'),
  };
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === __filename;
}

if (isMainModule()) {
  try {
    const result = runBudgetCheck();
    process.exitCode = result.hasBlockingFailure ? 1 : 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
