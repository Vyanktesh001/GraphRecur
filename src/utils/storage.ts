/** Thin, failure-tolerant wrapper around localStorage (it can throw: private mode, quota, disabled). */
export const STORAGE_KEYS = {
  workingGraph: 'graphrecur.workingGraph.v1',
  savedGraphs: 'graphrecur.savedGraphs.v1',
  recurrenceForm: 'graphrecur.recurrenceForm.v1',
  lastRecurrence: 'graphrecur.lastRecurrence.v1',
  savedRecurrences: 'graphrecur.savedRecurrences.v1',
  recentSequences: 'graphrecur.recentSequences.v1',
} as const;

export function readStorage<T>(key: string, parse: (raw: unknown) => T | null, fallback: T): T {
  try {
    const text = window.localStorage.getItem(key);
    if (text === null) return fallback;
    const parsed = parse(JSON.parse(text));
    return parsed === null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

/** Returns false if the value could not be stored. */
export function writeStorage(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
