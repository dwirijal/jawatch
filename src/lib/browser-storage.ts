type BrowserStorageArea = 'local' | 'session';

function getBrowserStorage(area: BrowserStorageArea): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return area === 'session' ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

export function canUseBrowserStorage(area: BrowserStorageArea = 'local') {
  return getBrowserStorage(area) !== null;
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

export function readStoredString(key: string, area: BrowserStorageArea = 'local'): string | null {
  const storage = getBrowserStorage(area);
  if (!storage) {
    return null;
  }

  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStoredString(key: string, value: string, area: BrowserStorageArea = 'local'): boolean {
  const storage = getBrowserStorage(area);
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStoredItem(key: string, area: BrowserStorageArea = 'local'): boolean {
  const storage = getBrowserStorage(area);
  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function readStoredJson(key: string, area: BrowserStorageArea = 'local'): unknown {
  return parseStoredJson(readStoredString(key, area));
}

export function writeStoredJson(key: string, value: unknown, area: BrowserStorageArea = 'local'): boolean {
  try {
    return writeStoredString(key, JSON.stringify(value), area);
  } catch {
    return false;
  }
}
