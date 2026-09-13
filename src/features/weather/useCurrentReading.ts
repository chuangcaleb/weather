import { useQuery } from '@tanstack/react-query';
import { fetchWeather, WeatherApiError } from '@/lib/api/weather';
import { normalizeQuery } from '@/features/weather/normalizeQuery';
import type { Query } from '@/features/weather/types';

export function useCurrentReading(query: Query | null) {
  return useQuery({
    queryKey: ['weather', query ? normalizeQuery(query) : null],
    queryFn: ({ signal }) => fetchWeather(query as Query, signal),
    enabled: query !== null,
    retry: (failureCount, error) => {
      if (error instanceof WeatherApiError && error.status < 500) return false;
      return failureCount < 2;
    },
  });
}
