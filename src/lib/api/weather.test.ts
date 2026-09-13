import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  weatherEmptyConditions,
  weatherMalformedPayload,
  weatherNotFound,
  weatherSuccess,
  weatherUnparsableBody,
} from '@/mocks/handlers';
import { WeatherApiError, WeatherPayloadError, fetchWeather } from './weather';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('fetchWeather', () => {
  it('resolves a Reading from a valid proxy response', async () => {
    server.use(weatherSuccess({ city: 'Lisbon', country: 'PT', tempC: 18.5 }));

    const reading = await fetchWeather({ city: 'Lisbon', country: 'PT' });

    expect(reading).toEqual({
      summary: 'Clouds',
      temperatureC: 18.5,
      highC: 21.5,
      lowC: 15.5,
      humidity: 72,
      place: 'Lisbon, PT',
    });
  });

  it('throws WeatherApiError carrying the status on a non-2xx response', async () => {
    server.use(weatherNotFound());

    await expect(
      fetchWeather({ city: 'Nowhere', country: 'ZZ' }),
    ).rejects.toMatchObject(new WeatherApiError(404));
  });

  it('throws WeatherPayloadError on a shape that fails boundary validation', async () => {
    server.use(weatherMalformedPayload());

    await expect(
      fetchWeather({ city: 'Lisbon', country: 'PT' }),
    ).rejects.toBeInstanceOf(WeatherPayloadError);
  });

  it('throws WeatherPayloadError when the conditions array is empty', async () => {
    server.use(
      weatherEmptyConditions({ city: 'Lisbon', country: 'PT', tempC: 18.5 }),
    );

    await expect(
      fetchWeather({ city: 'Lisbon', country: 'PT' }),
    ).rejects.toBeInstanceOf(WeatherPayloadError);
  });

  it('throws WeatherPayloadError when the body is not valid JSON', async () => {
    server.use(weatherUnparsableBody());

    await expect(
      fetchWeather({ city: 'Lisbon', country: 'PT' }),
    ).rejects.toBeInstanceOf(WeatherPayloadError);
  });
});
