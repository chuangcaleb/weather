import type { VercelRequest, VercelResponse } from '@vercel/node';

// Same-origin proxy for the browser's AJAX weather request. The client never calls
// OpenWeather directly — that would ship the API key in the bundle. This function
// rebuilds the upstream URL server-side (never forwarding the raw query string) and
// returns OpenWeather's response body verbatim on success.

const UPSTREAM = 'https://api.openweathermap.org/data/2.5/weather';
const CACHE_CONTROL = 'public, s-maxage=600, stale-while-revalidate=600';
const MAX_CITY_LENGTH = 100;
const ALPHA_2 = /^[A-Za-z]{2}$/;

// Upstream statuses the UI renders a specific message for; anything else is a fault
// the client can only treat as "service unavailable".
const CLIENT_FACING_STATUSES = new Set([400, 401, 404, 429]);

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const city =
    typeof request.query.city === 'string'
      ? request.query.city.trim()
      : undefined;
  const country =
    typeof request.query.country === 'string'
      ? request.query.country.trim()
      : undefined;

  if (!city || city.length > MAX_CITY_LENGTH) {
    response.status(400).json({ error: "Missing or invalid 'city'." });
    return;
  }

  // The country field is a constrained alpha-2 control; anything else reaching here is
  // a hand-crafted request, so it never becomes an upstream call against our quota.
  if (!country || !ALPHA_2.test(country)) {
    response
      .status(400)
      .json({ error: "Missing or invalid 'country' (ISO 3166-1 alpha-2)." });
    return;
  }

  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    response.status(500).json({ error: 'Weather API key is not configured.' });
    return;
  }

  const upstream = new URL(UPSTREAM);
  upstream.searchParams.set('q', `${city},${country.toUpperCase()}`);
  upstream.searchParams.set('units', 'metric');
  upstream.searchParams.set('appid', apiKey);

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstream);
  } catch (error) {
    console.error('OpenWeather request failed.', error);
    response.status(502).json({ error: 'Weather service unavailable.' });
    return;
  }

  if (!upstreamResponse.ok) {
    if (upstreamResponse.status === 401) {
      console.error(
        'OpenWeather rejected WEATHER_API_KEY (401). A newly created key stays inactive for up to 2 hours.',
      );
    }
    // Our own body, not the upstream one — the client maps on status alone, and
    // upstream prose has no place in this app's UI.
    const status = CLIENT_FACING_STATUSES.has(upstreamResponse.status)
      ? upstreamResponse.status
      : 502;
    response.status(status).json({ error: 'Weather request failed.' });
    return;
  }

  response.setHeader('Cache-Control', CACHE_CONTROL);
  response.status(200).json(await upstreamResponse.json());
}
