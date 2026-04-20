import 'server-only';

import { createHash } from 'node:crypto';
import { buildComicCacheKey, incrementComicCacheCounter } from './comic-cache.ts';
import { buildPrivateNoStoreCacheControl } from '../cloudflare-cache.ts';

function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const cfIp = request.headers.get('cf-connecting-ip')?.trim();
  const realIp = request.headers.get('x-real-ip')?.trim();

  return forwardedFor || cfIp || realIp || null;
}

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 24);
}

type RateLimitOptions = {
  bucket: string;
  limit: number;
  windowSeconds: number;
};

type LegacyRateLimitInput = RateLimitOptions & { request: Request };

function normalizeRateLimitInput(
  requestOrOptions: Request | LegacyRateLimitInput,
  maybeOptions?: RateLimitOptions,
): { request: Request; options: RateLimitOptions } {
  if (requestOrOptions instanceof Request) {
    if (!maybeOptions) {
      throw new Error('Rate limit options are required');
    }

    return { request: requestOrOptions, options: maybeOptions };
  }

  return { request: requestOrOptions.request, options: requestOrOptions };
}

export async function allowRequestWithinRateLimit(
  requestOrOptions: Request | LegacyRateLimitInput,
  maybeOptions?: RateLimitOptions,
): Promise<boolean> {
  const { request, options } = normalizeRateLimitInput(requestOrOptions, maybeOptions);
  const clientIp = getClientIp(request);
  if (!clientIp) {
    return true;
  }

  const limit = Math.max(1, options.limit);
  const windowSeconds = Math.max(1, options.windowSeconds);
  const bucketWindow = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = buildComicCacheKey('ratelimit', options.bucket, bucketWindow, hashIp(clientIp));
  const count = await incrementComicCacheCounter(key, windowSeconds + 5);

  if (count === null || count <= limit) {
    return true;
  }

  return false;
}

export async function enforcePublicApiRateLimit(
  requestOrOptions: Request | LegacyRateLimitInput,
  maybeOptions?: RateLimitOptions,
): Promise<Response | null> {
  const { request, options } = normalizeRateLimitInput(requestOrOptions, maybeOptions);
  const limit = Math.max(1, options.limit);
  const windowSeconds = Math.max(1, options.windowSeconds);
  const allowed = await allowRequestWithinRateLimit(request, options);

  if (allowed) {
    return null;
  }

  return Response.json(
    { message: 'Too many requests' },
    {
      status: 429,
      headers: {
        'Cache-Control': buildPrivateNoStoreCacheControl(),
        'Retry-After': String(windowSeconds),
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
      },
    },
  );
}
