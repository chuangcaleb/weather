import { useEffect, useRef, useState } from 'react';
import { useCurrentReading } from './useCurrentReading';
import { useHistory } from './useHistory';
import { normalizeQuery } from './normalizeQuery';
import type { Query } from './types';

export function useWeatherSearch() {
  const [submittedQuery, setSubmittedQuery] = useState<Query | null>(null);
  const currentReading = useCurrentReading(submittedQuery);
  const { entries, recordSuccess, deleteEntry } = useHistory();
  const recordedForKey = useRef<string | null>(null);

  useEffect(() => {
    if (!currentReading.isSuccess || !submittedQuery) return;

    const key = normalizeQuery(submittedQuery);
    if (recordedForKey.current === key) return;

    recordedForKey.current = key;
    recordSuccess(
      submittedQuery,
      currentReading.data,
      new Date().toISOString(),
    );
  }, [
    currentReading.isSuccess,
    currentReading.data,
    submittedQuery,
    recordSuccess,
  ]);

  function search(query: Query) {
    recordedForKey.current = null;
    setSubmittedQuery(query);
  }

  return { search, currentReading, history: entries, deleteEntry };
}
