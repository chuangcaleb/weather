import { useReducer } from 'react';
import { historyReducer, selectSortedEntries } from './historyReducer';
import { initHistoryState } from './historyStorage';
import type { HistoryEntry, Query, Reading } from './types';

export function useHistory() {
  const [state, dispatch] = useReducer(
    historyReducer,
    undefined,
    initHistoryState,
  );

  const entries: HistoryEntry[] = selectSortedEntries(state);

  function recordSuccess(query: Query, reading: Reading, requestedAt: string) {
    dispatch({ type: 'search:succeeded', query, reading, requestedAt });
  }

  function deleteEntry(query: Query) {
    dispatch({ type: 'entry:deleted', query });
  }

  return { entries, recordSuccess, deleteEntry };
}
