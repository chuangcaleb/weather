import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
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
  vi,
} from 'vitest';
import {
  weatherBadRequest,
  weatherMalformedPayload,
  weatherNotFound,
  weatherSuccess,
  weatherUnauthorized,
} from '@/mocks/handlers';
import { useWeatherSearch } from './useWeatherSearch';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const lisbonReading = { city: 'Lisbon', country: 'PT', tempC: 18.5 };

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
    server.use(weatherSuccess(lisbonReading));

    const { result } = renderHook(() => useWeatherSearch(), { wrapper });

    act(() => result.current.search({ city: 'Lisbon', country: 'PT' }));

    await waitFor(() =>
      expect(result.current.currentReading.isSuccess).toBe(true),
    );
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0]?.reading.place).toBe('Lisbon, PT');
  });

  it('leaves history untouched when the search fails', async () => {
    server.use(weatherNotFound());

    const { result } = renderHook(() => useWeatherSearch(), { wrapper });

    act(() => result.current.search({ city: 'Nowhere', country: 'ZZ' }));

    await waitFor(() =>
      expect(result.current.currentReading.isError).toBe(true),
    );
    expect(result.current.history).toHaveLength(0);
  });

  it('keeps the current reading independent of deleting its matching history entry', async () => {
    server.use(weatherSuccess(lisbonReading));

    const { result } = renderHook(() => useWeatherSearch(), { wrapper });

    act(() => result.current.search({ city: 'Lisbon', country: 'PT' }));
    await waitFor(() =>
      expect(result.current.currentReading.isSuccess).toBe(true),
    );

    act(() => result.current.deleteEntry({ city: 'Lisbon', country: 'PT' }));

    expect(result.current.history).toHaveLength(0);
    expect(result.current.currentReading.data?.place).toBe('Lisbon, PT');
  });

  it('re-runs the last submitted query on retry', async () => {
    server.use(weatherNotFound());
    const { result } = renderHook(() => useWeatherSearch(), { wrapper });

    act(() => result.current.search({ city: 'Nowhere', country: 'ZZ' }));
    await waitFor(() =>
      expect(result.current.currentReading.isError).toBe(true),
    );

    server.resetHandlers();
    server.use(weatherSuccess({ city: 'Nowhere', country: 'ZZ', tempC: 10 }));
    act(() => result.current.retry());

    await waitFor(() =>
      expect(result.current.currentReading.isSuccess).toBe(true),
    );
    expect(result.current.currentReading.data?.place).toBe('Nowhere, ZZ');
  });

  it('does nothing on retry before any search has been submitted', () => {
    const { result } = renderHook(() => useWeatherSearch(), { wrapper });

    expect(() => act(() => result.current.retry())).not.toThrow();
    expect(result.current.currentReading.isFetched).toBe(false);
  });

  it('logs an operator fault for an unreadable payload, never surfacing it to history', async () => {
    server.use(weatherMalformedPayload());
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useWeatherSearch(), { wrapper });
    act(() => result.current.search({ city: 'Lisbon', country: 'PT' }));

    await waitFor(() =>
      expect(result.current.currentReading.isError).toBe(true),
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      'Weather API returned a payload this app cannot read.',
      expect.anything(),
    );
    consoleSpy.mockRestore();
  });

  it('logs an operator fault for a 400, this app’s own request being malformed', async () => {
    server.use(weatherBadRequest());
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useWeatherSearch(), { wrapper });
    act(() => result.current.search({ city: 'Lisbon', country: 'PT' }));

    await waitFor(() =>
      expect(result.current.currentReading.isError).toBe(true),
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      'Weather API rejected the request (400).',
      expect.anything(),
    );
    consoleSpy.mockRestore();
  });

  it('logs an operator fault for a 401, the deployment key being wrong', async () => {
    server.use(weatherUnauthorized());
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useWeatherSearch(), { wrapper });
    act(() => result.current.search({ city: 'Lisbon', country: 'PT' }));

    await waitFor(() =>
      expect(result.current.currentReading.isError).toBe(true),
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      'Weather API rejected the request (401).',
      expect.anything(),
    );
    consoleSpy.mockRestore();
  });

  it('stays silent for a user-facing 404, not an operator fault', async () => {
    server.use(weatherNotFound());
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useWeatherSearch(), { wrapper });
    act(() => result.current.search({ city: 'Nowhere', country: 'ZZ' }));

    await waitFor(() =>
      expect(result.current.currentReading.isError).toBe(true),
    );
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
