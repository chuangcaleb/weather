import type { HistoryEntry, HistoryState } from './types';

export const HISTORY_STORAGE_KEY = 'weather:history';

const EMPTY_STATE: HistoryState = { schemaVersion: 1, entries: [] };

function isHistoryEntry(value: unknown): value is HistoryEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    'query' in value &&
    'reading' in value &&
    'requestedAt' in value &&
    typeof value.requestedAt === 'string'
  );
}

function isHistoryState(value: unknown): value is HistoryState {
  return (
    typeof value === 'object' &&
    value !== null &&
    'schemaVersion' in value &&
    value.schemaVersion === 1 &&
    'entries' in value &&
    Array.isArray(value.entries) &&
    value.entries.every(isHistoryEntry)
  );
}

export function persistHistory(state: HistoryState): HistoryState {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error(
      'Failed to persist search history, continuing in memory only.',
      error,
    );
  }
  return state;
}

export function initHistoryState(): HistoryState {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return EMPTY_STATE;

    const parsed: unknown = JSON.parse(raw);
    return isHistoryState(parsed) ? parsed : EMPTY_STATE;
  } catch (error) {
    console.error(
      'Failed to read persisted search history, starting empty.',
      error,
    );
    return EMPTY_STATE;
  }
}
