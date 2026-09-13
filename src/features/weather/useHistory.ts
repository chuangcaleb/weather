import { useReducer } from 'react';
import {
  historyReducer,
  initHistoryState,
  selectSortedEntries,
} from '@/features/weather/historyReducer';
import type { HistoryEntry, Query, Reading } from '@/features/weather/types';

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
