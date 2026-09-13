import { normalizeQuery } from '@/features/weather/normalizeQuery';
import type {
  HistoryEntry,
  HistoryState,
  Query,
  Reading,
} from '@/features/weather/types';

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

export function historyReducer(
  state: HistoryState,
  action: HistoryAction,
): HistoryState {
  switch (action.type) {
    case 'search:succeeded': {
      const key = normalizeQuery(action.query);
      const entry: HistoryEntry = {
        query: action.query,
        reading: action.reading,
        requestedAt: action.requestedAt,
      };
      const withoutExisting = state.entries.filter(
        (e) => normalizeQuery(e.query) !== key,
      );
      const entries = evictOldestPastCap([entry, ...withoutExisting]);
      return persist({ ...state, entries });
    }
    case 'entry:deleted': {
      const key = normalizeQuery(action.query);
      const entries = state.entries.filter(
        (e) => normalizeQuery(e.query) !== key,
      );
      return persist({ ...state, entries });
    }
    default:
      return state;
  }
}

export function initHistoryState(): HistoryState {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return EMPTY_STATE;

    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'schemaVersion' in parsed &&
      parsed.schemaVersion === 1 &&
      'entries' in parsed &&
      Array.isArray(parsed.entries)
    ) {
      return parsed as HistoryState;
    }
    return EMPTY_STATE;
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
