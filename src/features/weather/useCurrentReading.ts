import { skipToken, useQuery } from '@tanstack/react-query';
import type { QueryFunctionContext } from '@tanstack/react-query';
import {
  fetchWeather,
  WeatherApiError,
  WeatherPayloadError,
} from '@/lib/api/weather';
import { normalizeQuery } from './normalizeQuery';
import type { Query, Reading } from './types';

export function weatherQueryOptions(query: Query) {
  return {
    queryKey: ['weather', normalizeQuery(query)],
    queryFn: ({ signal }: QueryFunctionContext) => fetchWeather(query, signal),
    retry: (failureCount: number, error: Error) => {
      // A 4xx and an unreadable payload both repeat identically; only network-shaped
      // failures are worth a backoff.
      if (error instanceof WeatherPayloadError) return false;
      if (error instanceof WeatherApiError && error.status < 500) return false;
      return failureCount < 2;
    },
  };
}

// Fetching is driven imperatively by useWeatherSearch's `search`, not by this hook — it only observes the shared cache entry so the UI re-renders as that fetch settles.
export function useCurrentReading(query: Query | null) {
  return useQuery<Reading>({
    queryKey: ['weather', query ? normalizeQuery(query) : null],
    queryFn: skipToken,
    enabled: false,
  });
}
