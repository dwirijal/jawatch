export function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function parseStoredJson(value: string | null): unknown {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function readStoredString(key: string): string | null {
  if (!canUseBrowserStorage()) {
    return null;
  }

  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStoredString(key: string, value: string): boolean {
  if (!canUseBrowserStorage()) {
    return false;
  }

  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStoredItem(key: string): boolean {
  if (!canUseBrowserStorage()) {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function readStoredJson(key: string): unknown {
  return parseStoredJson(readStoredString(key));
}

export function writeStoredJson(key: string, value: unknown): boolean {
  try {
    return writeStoredString(key, JSON.stringify(value));
  } catch {
    return false;
  }
}
