export function readLocalDraft(key: string, fallback: string): string {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function saveLocalDraft(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // The visible textarea remains the recovery source when storage is unavailable.
  }
}

export function clearLocalDraft(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // A failed cleanup must not affect the authoritative write result.
  }
}
