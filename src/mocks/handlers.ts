import { HttpResponse, http } from 'msw';

/**
 * One factory per `/api/weather` response shape, composed per test via
 * `server.use(...)` — never redefined inline in the test files themselves.
 */

type UpstreamReading = {
  city: string;
  country: string;
  tempC: number;
  summary?: string;
};

function upstreamBody({
  city,
  country,
  tempC,
  summary = 'Clouds',
}: UpstreamReading) {
  return {
    weather: [{ main: summary }],
    main: {
      temp: tempC,
      temp_max: tempC + 3,
      temp_min: tempC - 3,
      humidity: 72,
    },
    name: city,
    sys: { country },
  };
}

function errorResponse(error: string, status: number) {
  return http.get('/api/weather', () =>
    HttpResponse.json({ error }, { status }),
  );
}

export function weatherSuccess(reading: UpstreamReading) {
  return http.get('/api/weather', () =>
    HttpResponse.json(upstreamBody(reading)),
  );
}

/** Reflects the requested `city`/`country` back into the upstream body — for tests asserting the wire-up between a search and what comes back, not a fixed fixture. */
export function weatherEchoesQuery(
  resolve: (city: string, country: string) => UpstreamReading,
) {
  return http.get('/api/weather', ({ request }) => {
    const url = new URL(request.url);
    const city = url.searchParams.get('city') ?? '';
    const country = url.searchParams.get('country') ?? '';
    return HttpResponse.json(upstreamBody(resolve(city, country)));
  });
}

export function weatherBadRequest() {
  return errorResponse("Missing or invalid 'city'.", 400);
}

export function weatherUnauthorized() {
  return errorResponse('Weather request failed.', 401);
}

export function weatherNotFound() {
  return errorResponse('not found', 404);
}

export function weatherTooManyRequests() {
  return errorResponse('Weather request failed.', 429);
}

export function weatherServerError() {
  return errorResponse('Weather service unavailable.', 503);
}

/** Well-formed JSON, wrong shape — the boundary schema rejects it. */
export function weatherMalformedPayload() {
  return http.get('/api/weather', () =>
    HttpResponse.json({ unexpected: true }),
  );
}

/** Passes the schema but carries no condition to read an icon/summary from. */
export function weatherEmptyConditions(
  reading: Omit<UpstreamReading, 'summary'>,
) {
  return http.get('/api/weather', () =>
    HttpResponse.json({ ...upstreamBody(reading), weather: [] }),
  );
}

/** Not valid JSON at all — the proxy's own body-parse step fails. */
export function weatherUnparsableBody() {
  return http.get(
    '/api/weather',
    () => new HttpResponse('not json', { status: 200 }),
  );
}
