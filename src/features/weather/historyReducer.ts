import { normalizeQuery } from './normalizeQuery';
import type { HistoryEntry, HistoryState, Query, Reading } from './types';

export const HISTORY_STORAGE_KEY = 'weather:history';
export const HISTORY_CAP = 25;

const EMPTY_STATE: HistoryState = { schemaVersion: 1, entries: [] };

export type HistoryAction =
  | {
      type: 'search:succeeded';
      query: Query;
      reading: Reading;
      requestedAt: string;
    }
  | { type: 'entry:deleted'; query: Query };

function persist(state: HistoryState): HistoryState {
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

function evictOldestPastCap(entries: HistoryEntry[]): HistoryEntry[] {
  if (entries.length <= HISTORY_CAP) return entries;
  const oldest = entries.reduce((a, b) =>
    a.requestedAt < b.requestedAt ? a : b,
  );
  return entries.filter((e) => e !== oldest);
}

function removeByQuery(entries: HistoryEntry[], query: Query): HistoryEntry[] {
  const key = normalizeQuery(query);
  return entries.filter((e) => normalizeQuery(e.query) !== key);
}

export function historyReducer(
  state: HistoryState,
  action: HistoryAction,
): HistoryState {
  switch (action.type) {
    case 'search:succeeded': {
      const entry: HistoryEntry = {
        query: action.query,
        reading: action.reading,
        requestedAt: action.requestedAt,
      };
      const entries = evictOldestPastCap([
        entry,
        ...removeByQuery(state.entries, action.query),
      ]);
      return persist({ ...state, entries });
    }
    case 'entry:deleted': {
      const entries = removeByQuery(state.entries, action.query);
      return persist({ ...state, entries });
    }
    default:
      return state;
  }
}

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

export function selectSortedEntries(state: HistoryState): HistoryEntry[] {
  return [...state.entries].sort((a, b) =>
    b.requestedAt.localeCompare(a.requestedAt),
  );
}
