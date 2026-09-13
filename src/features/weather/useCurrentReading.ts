import { skipToken, useQuery } from '@tanstack/react-query';
import type { QueryFunctionContext } from '@tanstack/react-query';
import { fetchWeather, WeatherApiError } from '@/lib/api/weather';
import { normalizeQuery } from './normalizeQuery';
import type { Query, Reading } from './types';

export function weatherQueryOptions(query: Query) {
  return {
    queryKey: ['weather', normalizeQuery(query)],
    queryFn: ({ signal }: QueryFunctionContext) => fetchWeather(query, signal),
    retry: (failureCount: number, error: Error) => {
      if (error instanceof WeatherApiError && error.status < 500) return false;
      return failureCount < 2;
    },
  };
}

// Fetching is driven imperatively by useWeatherSearch's `search` (via
// queryClient.fetchQuery), not by this hook — it only observes the shared
// cache entry so the UI re-renders as that fetch settles.
export function useCurrentReading(query: Query | null) {
  return useQuery<Reading>({
    queryKey: ['weather', query ? normalizeQuery(query) : null],
    queryFn: skipToken,
    enabled: false,
  });
}
