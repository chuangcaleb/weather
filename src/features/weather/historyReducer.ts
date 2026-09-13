import { normalizeQuery } from './normalizeQuery';
import { persistHistory } from './historyStorage';
import type { HistoryEntry, HistoryState, Query, Reading } from './types';

export const HISTORY_CAP = 25;

export type HistoryAction =
  | {
      type: 'search:succeeded';
      query: Query;
      reading: Reading;
      requestedAt: string;
    }
  | { type: 'entry:deleted'; query: Query };

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
      return persistHistory({ ...state, entries });
    }
    case 'entry:deleted': {
      const entries = removeByQuery(state.entries, action.query);
      return persistHistory({ ...state, entries });
    }
    default:
      return state;
  }
}

export function selectSortedEntries(state: HistoryState): HistoryEntry[] {
  return [...state.entries].sort((a, b) =>
    b.requestedAt.localeCompare(a.requestedAt),
  );
}
