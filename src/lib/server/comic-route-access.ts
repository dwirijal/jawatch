import { readComicOriginSharedToken } from './comic-origin';

function readBooleanParam(value: string | null): boolean | null {
  if (value == null) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes') {
    return true;
  }
  if (normalized === '0' || normalized === 'false' || normalized === 'no') {
    return false;
  }
  return null;
}

export function isTrustedComicOriginRequest(request: Request): boolean {
  const configured = readComicOriginSharedToken();
  if (!configured) {
    return false;
  }

  const provided = request.headers.get('x-comic-origin-token')?.trim() || '';
  return provided !== '' && provided === configured;
}

export async function resolveComicRouteIncludeNsfw(request: Request): Promise<boolean> {
  if (isTrustedComicOriginRequest(request)) {
    const forwarded = readBooleanParam(new URL(request.url).searchParams.get('includeNsfw'));
    if (forwarded != null) {
      return forwarded;
    }
  }

  const { resolveViewerNsfwAccess } = await import('./viewer-nsfw-access.ts');
  return resolveViewerNsfwAccess();
}

export function resolveComicRouteRecordAccess(request: Request): boolean {
  if (!isTrustedComicOriginRequest(request)) {
    return false;
  }

  return readBooleanParam(new URL(request.url).searchParams.get('recordAccess')) === true;
}
