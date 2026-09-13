import type { VercelRequest, VercelResponse } from '@vercel/node';

const UPSTREAM = 'https://api.openweathermap.org/data/2.5/weather';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const city =
    typeof request.query.city === 'string' ? request.query.city : undefined;
  const country =
    typeof request.query.country === 'string'
      ? request.query.country
      : undefined;

  if (!city) {
    response.status(400).json({ error: "Missing 'city' query parameter." });
    return;
  }

  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    response.status(500).json({ error: 'Weather API key is not configured.' });
    return;
  }

  const upstream = new URL(UPSTREAM);
  upstream.searchParams.set('q', country ? `${city},${country}` : city);
  upstream.searchParams.set('units', 'metric');
  upstream.searchParams.set('appid', apiKey);

  const upstreamResponse = await fetch(upstream);
  const data: unknown = await upstreamResponse.json();

  if (!upstreamResponse.ok) {
    response.status(upstreamResponse.status).json(data);
    return;
  }

  response.setHeader(
    'Cache-Control',
    'public, s-maxage=600, stale-while-revalidate=600',
  );
  response.status(200).json(data);
}
