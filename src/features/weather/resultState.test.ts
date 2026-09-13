import { describe, expect, it } from 'vitest';
import { WeatherApiError, WeatherPayloadError } from '@/lib/api/weather';
import { toResultState } from './resultState';
import type { Query, Reading } from './types';

const query: Query = { city: 'Lisbon', country: 'PT' };

const reading: Reading = {
  summary: 'Clouds',
  description: 'overcast clouds',
  temperatureC: 18.5,
  humidity: 72,
  place: 'Lisbon, PT',
};

const settled = { isFetching: false, data: undefined, error: null };

describe('toResultState', () => {
  it('is idle before any search', () => {
    expect(toResultState(null, settled)).toEqual({ status: 'idle' });
  });

  it('is pending while the query is in flight', () => {
    expect(toResultState(query, { ...settled, isFetching: true })).toEqual({
      status: 'pending',
    });
  });

  it('is pending while a superseded search settles its abort', () => {
    const aborted = Object.assign(new Error('aborted'), {
      name: 'AbortError',
    });
    expect(toResultState(query, { ...settled, error: aborted })).toEqual({
      status: 'pending',
    });
  });

  it('renders the reading on success', () => {
    expect(toResultState(query, { ...settled, data: reading })).toEqual({
      status: 'success',
      reading,
    });
  });

  it('names the missing city on 404, and invites a retype', () => {
    expect(
      toResultState(query, { ...settled, error: new WeatherApiError(404) }),
    ).toEqual({
      status: 'error',
      message: 'No city matching Lisbon in PT.',
      canRetry: true,
    });
  });

  it('asks the user to wait on 429', () => {
    expect(
      toResultState(query, { ...settled, error: new WeatherApiError(429) }),
    ).toEqual({
      status: 'error',
      message: 'Too many searches. Try again shortly.',
      canRetry: true,
    });
  });

  it.each([400, 401])('stays generic and unretryable on %i', (status) => {
    expect(
      toResultState(query, { ...settled, error: new WeatherApiError(status) }),
    ).toEqual({
      status: 'error',
      message: 'Something went wrong.',
      canRetry: false,
    });
  });

  it('reports the service as unavailable on 5xx', () => {
    expect(
      toResultState(query, { ...settled, error: new WeatherApiError(503) }),
    ).toEqual({
      status: 'error',
      message: 'Weather service unavailable. Try again shortly.',
      canRetry: true,
    });
  });

  it('reports the service as unavailable on a network failure', () => {
    expect(
      toResultState(query, {
        ...settled,
        error: new TypeError('Failed to fetch'),
      }),
    ).toEqual({
      status: 'error',
      message: 'Weather service unavailable. Try again shortly.',
      canRetry: true,
    });
  });

  it('stays generic and unretryable on an unreadable payload', () => {
    expect(
      toResultState(query, { ...settled, error: new WeatherPayloadError() }),
    ).toEqual({
      status: 'error',
      message: 'Something went wrong.',
      canRetry: false,
    });
  });

  it('prefers the in-flight spinner over a stale error', () => {
    expect(
      toResultState(query, {
        isFetching: true,
        data: undefined,
        error: new WeatherApiError(404),
      }),
    ).toEqual({ status: 'pending' });
  });
});
