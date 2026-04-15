const DEFAULT_RETURN_PATH = '/';
const VAULT_SAVED_PATH = '/vault/saved';

function sanitizeRelativePath(nextPath: string | null | undefined): string {
  const candidate = nextPath?.trim();
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return DEFAULT_RETURN_PATH;
  }

  return candidate;
}

function isLegacyCollectionPath(pathname: string): boolean {
  return pathname === '/collection' || pathname.startsWith('/collection?') || pathname.startsWith('/collection/');
}

export function normalizeVaultAwareNextPath(nextPath: string | null | undefined): string {
  const candidate = sanitizeRelativePath(nextPath);

  if (isLegacyCollectionPath(candidate)) {
    return VAULT_SAVED_PATH;
  }

  return candidate;
}

