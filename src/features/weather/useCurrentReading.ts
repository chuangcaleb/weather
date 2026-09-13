import { skipToken, useQuery } from '@tanstack/react-query';
import { fetchWeather, WeatherApiError } from '@/lib/api/weather';
import { normalizeQuery } from './normalizeQuery';
import type { Query } from './types';

export function useCurrentReading(query: Query | null) {
  return useQuery({
    queryKey: ['weather', query ? normalizeQuery(query) : null],
    queryFn: query ? ({ signal }) => fetchWeather(query, signal) : skipToken,
    retry: (failureCount, error) => {
      if (error instanceof WeatherApiError && error.status < 500) return false;
      return failureCount < 2;
    },
  });
}
