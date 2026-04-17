const DEFAULT_RETURN_PATH = '/';

function sanitizeRelativePath(nextPath: string | null | undefined): string {
  const candidate = nextPath?.trim();
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return DEFAULT_RETURN_PATH;
  }

  return candidate;
}

export function normalizeVaultAwareNextPath(nextPath: string | null | undefined): string {
  return sanitizeRelativePath(nextPath);
}
