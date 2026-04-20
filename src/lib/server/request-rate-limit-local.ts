type LocalRateLimitEntry = {
  count: number;
  expiresAt: number;
};

const localRateLimitCounters = new Map<string, LocalRateLimitEntry>();

export function incrementLocalRateLimitCounter(key: string, ttlSeconds: number, nowMs = Date.now()): number {
  const existingEntry = localRateLimitCounters.get(key);
  if (!existingEntry || existingEntry.expiresAt <= nowMs) {
    localRateLimitCounters.set(key, {
      count: 1,
      expiresAt: nowMs + (ttlSeconds * 1000),
    });
    return 1;
  }

  const nextCount = existingEntry.count + 1;
  localRateLimitCounters.set(key, {
    count: nextCount,
    expiresAt: existingEntry.expiresAt,
  });
  return nextCount;
}

export function resetLocalRateLimitMemoryForTests(): void {
  localRateLimitCounters.clear();
}
