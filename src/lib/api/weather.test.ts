import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { WeatherApiError, WeatherPayloadError, fetchWeather } from './weather';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const validUpstreamBody = {
  weather: [{ main: 'Clouds', description: 'overcast clouds' }],
  main: { temp: 18.5, humidity: 72 },
  name: 'Lisbon',
  sys: { country: 'PT' },
};

describe('fetchWeather', () => {
  it('resolves a Reading from a valid proxy response', async () => {
    server.use(
      http.get('/api/weather', () => HttpResponse.json(validUpstreamBody)),
    );

    const reading = await fetchWeather({ city: 'Lisbon', country: 'PT' });

    expect(reading).toEqual({
      summary: 'Clouds',
      description: 'overcast clouds',
      temperatureC: 18.5,
      humidity: 72,
      place: 'Lisbon, PT',
    });
  });

  it('throws WeatherApiError carrying the status on a non-2xx response', async () => {
    server.use(
      http.get('/api/weather', () =>
        HttpResponse.json({ error: 'city not found' }, { status: 404 }),
      ),
    );

    await expect(
      fetchWeather({ city: 'Nowhere', country: 'ZZ' }),
    ).rejects.toMatchObject(new WeatherApiError(404));
  });

  it('throws WeatherPayloadError on a shape that fails boundary validation', async () => {
    server.use(
      http.get('/api/weather', () => HttpResponse.json({ unexpected: true })),
    );

    await expect(
      fetchWeather({ city: 'Lisbon', country: 'PT' }),
    ).rejects.toBeInstanceOf(WeatherPayloadError);
  });

  it('throws WeatherPayloadError when the conditions array is empty', async () => {
    server.use(
      http.get('/api/weather', () =>
        HttpResponse.json({ ...validUpstreamBody, weather: [] }),
      ),
    );

    await expect(
      fetchWeather({ city: 'Lisbon', country: 'PT' }),
    ).rejects.toBeInstanceOf(WeatherPayloadError);
  });
});
