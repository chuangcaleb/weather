import { z } from 'zod';
import type { Query, Reading } from '@/features/weather/types';

const weatherResponseSchema = z.object({
  weather: z.array(
    z.object({
      main: z.string(),
      description: z.string(),
    }),
  ),
  main: z.object({
    temp: z.number(),
    humidity: z.number(),
  }),
  name: z.string(),
  sys: z.object({
    country: z.string(),
  }),
});

export class WeatherApiError extends Error {
  status: number;

  constructor(status: number) {
    super(`Weather API request failed with status ${status}`);
    this.name = 'WeatherApiError';
    this.status = status;
  }
}

export async function fetchWeather(
  query: Query,
  signal?: AbortSignal,
): Promise<Reading> {
  const url = new URL('/api/weather', window.location.origin);
  url.searchParams.set('city', query.city);
  url.searchParams.set('country', query.country);

  const response = await fetch(url, { signal });
  if (!response.ok) throw new WeatherApiError(response.status);

  const body: unknown = await response.json();
  const data = weatherResponseSchema.parse(body);
  const [weather] = data.weather;
  if (!weather) throw new WeatherApiError(response.status);

  return {
    summary: weather.main,
    description: weather.description,
    temperatureC: data.main.temp,
    humidity: data.main.humidity,
    place: `${data.name}, ${data.sys.country}`,
  };
}
