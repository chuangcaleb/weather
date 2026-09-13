import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import type { ReactNode } from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { useWeatherSearch } from '@/features/weather/useWeatherSearch';

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

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(() => localStorage.clear());

describe('useWeatherSearch', () => {
  it('dispatches search:succeeded into history on a successful search, never on failure', async () => {
    server.use(
      http.get('/api/weather', () => HttpResponse.json(validUpstreamBody)),
    );

    const { result } = renderHook(() => useWeatherSearch(), { wrapper });

    act(() => result.current.search({ city: 'Lisbon', country: 'PT' }));

    await waitFor(() =>
      expect(result.current.currentReading.isSuccess).toBe(true),
    );
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0]?.reading.place).toBe('Lisbon, PT');
  });

  it('leaves history untouched when the search fails', async () => {
    server.use(
      http.get('/api/weather', () =>
        HttpResponse.json({ error: 'not found' }, { status: 404 }),
      ),
    );

    const { result } = renderHook(() => useWeatherSearch(), { wrapper });

    act(() => result.current.search({ city: 'Nowhere', country: 'ZZ' }));

    await waitFor(() =>
      expect(result.current.currentReading.isError).toBe(true),
    );
    expect(result.current.history).toHaveLength(0);
  });

  it('keeps the current reading independent of deleting its matching history entry', async () => {
    server.use(
      http.get('/api/weather', () => HttpResponse.json(validUpstreamBody)),
    );

    const { result } = renderHook(() => useWeatherSearch(), { wrapper });

    act(() => result.current.search({ city: 'Lisbon', country: 'PT' }));
    await waitFor(() =>
      expect(result.current.currentReading.isSuccess).toBe(true),
    );

    act(() => result.current.deleteEntry({ city: 'Lisbon', country: 'PT' }));

    expect(result.current.history).toHaveLength(0);
    expect(result.current.currentReading.data?.place).toBe('Lisbon, PT');
  });
});
