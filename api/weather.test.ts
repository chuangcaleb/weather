import type { VercelRequest, VercelResponse } from '@vercel/node';
import { afterEach, describe, expect, it, vi } from 'vitest';
import handler from './weather';

function mockResponse() {
  const response = {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    status(code: number) {
      response.statusCode = code;
      return response;
    },
    setHeader(name: string, value: string) {
      response.headers[name] = value;
      return response;
    },
    json(payload: unknown) {
      response.body = payload;
      return response;
    },
  };
  return response as unknown as VercelResponse & typeof response;
}

function mockRequest(query: Record<string, string>): VercelRequest {
  return { method: 'GET', query } as unknown as VercelRequest;
}

describe('api/weather', () => {
  const originalKey = process.env.WEATHER_API_KEY;

  afterEach(() => {
    process.env.WEATHER_API_KEY = originalKey;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('rejects a request missing the city parameter', async () => {
    const response = mockResponse();
    await handler(mockRequest({ country: 'PT' }), response);

    expect(response.statusCode).toBe(400);
  });

  it('rejects a request whose country is not an alpha-2 code', async () => {
    process.env.WEATHER_API_KEY = 'test-key';
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);

    const response = mockResponse();
    await handler(
      mockRequest({ city: 'Lisbon', country: 'Portugal' }),
      response,
    );

    expect(response.statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a non-GET request', async () => {
    const response = mockResponse();
    await handler(
      {
        method: 'POST',
        query: { city: 'Lisbon', country: 'PT' },
      } as unknown as VercelRequest,
      response,
    );

    expect(response.statusCode).toBe(405);
  });

  it('reports misconfiguration when no key is set, never as a client error', async () => {
    delete process.env.WEATHER_API_KEY;
    const response = mockResponse();
    await handler(mockRequest({ city: 'Lisbon', country: 'PT' }), response);

    expect(response.statusCode).toBe(500);
  });

  it('reconstructs the upstream URL server-side and sets the CDN cache header', async () => {
    process.env.WEATHER_API_KEY = 'test-key';
    const fetchMock = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        new Response(JSON.stringify({ weather: [] }), { status: 200 }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = mockResponse();
    await handler(mockRequest({ city: 'Lisbon', country: 'PT' }), response);

    const requestedInput = fetchMock.mock.calls[0]?.[0] ?? '';
    const requestedUrl = new URL(
      requestedInput instanceof Request ? requestedInput.url : requestedInput,
    );
    expect(requestedUrl.origin + requestedUrl.pathname).toBe(
      'https://api.openweathermap.org/data/2.5/weather',
    );
    expect(requestedUrl.searchParams.get('q')).toBe('Lisbon,PT');
    expect(requestedUrl.searchParams.get('units')).toBe('metric');
    expect(requestedUrl.searchParams.get('appid')).toBe('test-key');
    expect(response.statusCode).toBe(200);
    expect(response.headers['Cache-Control']).toBe(
      'public, s-maxage=600, stale-while-revalidate=600',
    );
  });

  it('passes upstream error status through without the cache header', async () => {
    process.env.WEATHER_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ cod: '404', message: 'city not found' }),
            {
              status: 404,
            },
          ),
        ),
      ),
    );

    const response = mockResponse();
    await handler(mockRequest({ city: 'Nowhere', country: 'ZZ' }), response);

    expect(response.statusCode).toBe(404);
    expect(response.headers['Cache-Control']).toBeUndefined();
  });

  it('never forwards the upstream error body to the client', async () => {
    process.env.WEATHER_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ cod: '404', message: 'city not found' }),
            {
              status: 404,
            },
          ),
        ),
      ),
    );

    const response = mockResponse();
    await handler(mockRequest({ city: 'Nowhere', country: 'ZZ' }), response);

    expect(response.body).not.toMatchObject({ message: 'city not found' });
  });

  it('collapses an unmapped upstream status to 502', async () => {
    process.env.WEATHER_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('{}', { status: 503 }))),
    );

    const response = mockResponse();
    await handler(mockRequest({ city: 'Lisbon', country: 'PT' }), response);

    expect(response.statusCode).toBe(502);
  });

  it('answers 502 when the upstream request itself fails', async () => {
    process.env.WEATHER_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('network down'))),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = mockResponse();
    await handler(mockRequest({ city: 'Lisbon', country: 'PT' }), response);

    expect(response.statusCode).toBe(502);
  });
});
