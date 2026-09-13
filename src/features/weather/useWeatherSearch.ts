import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { WeatherApiError, WeatherPayloadError } from '@/lib/api/weather';
import { useCurrentReading, weatherQueryOptions } from './useCurrentReading';
import { useHistory } from './useHistory';
import type { Query } from './types';

/**
 * The user never sees these two, so the console is the only place they surface:
 * a 400 means this app built a bad request, a 401 means the deployment's key is
 * wrong, and an unreadable payload means the upstream shape moved.
 */
function logOperatorFault(error: unknown) {
  if (error instanceof WeatherPayloadError) {
    console.error(
      'Weather API returned a payload this app cannot read.',
      error,
    );
    return;
  }
  if (
    error instanceof WeatherApiError &&
    (error.status === 400 || error.status === 401)
  ) {
    console.error(`Weather API rejected the request (${error.status}).`, error);
  }
}

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
      .catch((error: unknown) => {
        // The current reading surfaces its own error state via useQuery, and
        // history stays untouched; only operator-facing faults are logged.
        logOperatorFault(error);
      });
  }

  /** Re-runs the search already on screen — the "Try again" affordance. */
  function retry() {
    if (submittedQuery) search(submittedQuery);
  }

  return {
    search,
    retry,
    submittedQuery,
    currentReading,
    history: entries,
    deleteEntry,
  };
}
