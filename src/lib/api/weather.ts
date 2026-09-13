import { z } from 'zod';
import type { Query, Reading } from '@/features/weather/types';

// The AJAX call: the browser fetches weather data asynchronously from the same-origin
// proxy, which returns OpenWeather's JSON verbatim — so the schema below is
// OpenWeather's own response shape, validated here at the boundary.

const weatherResponseSchema = z.object({
  weather: z
    .array(
      z.object({
        main: z.string(),
        description: z.string(),
      }),
    )
    .min(1),
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

/**
 * The proxy answered, but not with a shape this app can read. Distinct from
 * WeatherApiError because retrying is pointless — the same bytes come back.
 */
export class WeatherPayloadError extends Error {
  constructor(options?: ErrorOptions) {
    super('Weather API returned an unreadable payload', options);
    this.name = 'WeatherPayloadError';
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

  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    throw new WeatherPayloadError({ cause: error });
  }

  const parsed = weatherResponseSchema.safeParse(body);
  if (!parsed.success) throw new WeatherPayloadError({ cause: parsed.error });

  const data = parsed.data;
  const [weather] = data.weather;
  if (!weather) throw new WeatherPayloadError();

  return {
    summary: weather.main,
    description: weather.description,
    temperatureC: data.main.temp,
    humidity: data.main.humidity,
    place: `${data.name}, ${data.sys.country}`,
  };
}
