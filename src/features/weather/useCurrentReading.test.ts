import { describe, expect, it } from 'vitest';
import { WeatherApiError, WeatherPayloadError } from '@/lib/api/weather';
import { weatherQueryOptions } from './useCurrentReading';

describe('weatherQueryOptions', () => {
  const { retry } = weatherQueryOptions({ city: 'Lisbon', country: 'PT' });

  it('never retries an unreadable payload — it will repeat identically', () => {
    expect(retry(0, new WeatherPayloadError())).toBe(false);
  });

  it('never retries a 4xx — the request itself is wrong, not the network', () => {
    expect(retry(0, new WeatherApiError(404))).toBe(false);
  });

  it('retries a 5xx up to twice, treating it as network-shaped', () => {
    expect(retry(0, new WeatherApiError(500))).toBe(true);
    expect(retry(1, new WeatherApiError(500))).toBe(true);
    expect(retry(2, new WeatherApiError(500))).toBe(false);
  });
});
