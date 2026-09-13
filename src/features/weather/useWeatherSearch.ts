import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useCurrentReading, weatherQueryOptions } from './useCurrentReading';
import { useHistory } from './useHistory';
import type { Query } from './types';

export function useWeatherSearch() {
  const [submittedQuery, setSubmittedQuery] = useState<Query | null>(null);
  const currentReading = useCurrentReading(submittedQuery);
  const { entries, recordSuccess, deleteEntry } = useHistory();
  const queryClient = useQueryClient();

  function search(query: Query) {
    setSubmittedQuery(query);
    queryClient
      .fetchQuery(weatherQueryOptions(query))
      .then((reading) =>
        recordSuccess(query, reading, new Date().toISOString()),
      )
      .catch(() => {
        // current reading surfaces its own error state via useQuery; history stays untouched
      });
  }

  return { search, currentReading, history: entries, deleteEntry };
}
