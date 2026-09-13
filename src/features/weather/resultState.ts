import { WeatherApiError, WeatherPayloadError } from '@/lib/api/weather';
import type { Query, Reading } from './types';

/**
 * What the result card shows right now. One closed set, derived — never stored —
 * so the card can never render two states at once. Source: the state-to-UI table
 * in docs/build-spec/04-components.md.
 */
export type ResultState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'success'; reading: Reading }
  | { status: 'error'; message: string; canRetry: boolean };

/** The slice of TanStack Query's result the card actually reads. */
export type ReadingQueryState = {
  isFetching: boolean;
  data: Reading | undefined;
  error: Error | null;
};

const GENERIC_MESSAGE = 'Something went wrong.';
const UNAVAILABLE_MESSAGE = 'Weather service unavailable. Try again shortly.';

function describeError(
  error: Error,
  query: Query,
): { message: string; canRetry: boolean } {
  // The proxy answered with bytes this app cannot read: a bug, not a blip.
  if (error instanceof WeatherPayloadError) {
    return { message: GENERIC_MESSAGE, canRetry: false };
  }

  if (error instanceof WeatherApiError) {
    if (error.status === 404) {
      return {
        message: `No city matching ${query.city} in ${query.country}.`,
        canRetry: true,
      };
    }
    if (error.status === 429) {
      return {
        message: 'Too many searches. Try again shortly.',
        canRetry: true,
      };
    }
    // 400 is a bug signal, 401 an operator fault — neither is the user's to fix.
    if (error.status < 500) {
      return { message: GENERIC_MESSAGE, canRetry: false };
    }
  }

  // 5xx, network failure, timeout: the only class worth trying again.
  return { message: UNAVAILABLE_MESSAGE, canRetry: true };
}

export function toResultState(
  query: Query | null,
  readingQuery: ReadingQueryState,
): ResultState {
  if (!query) return { status: 'idle' };
  if (readingQuery.isFetching) return { status: 'pending' };

  if (readingQuery.error) {
    // A superseded search aborts; the search that superseded it owns the UI.
    if (readingQuery.error.name === 'AbortError') return { status: 'pending' };
    return { status: 'error', ...describeError(readingQuery.error, query) };
  }

  if (readingQuery.data)
    return { status: 'success', reading: readingQuery.data };

  return { status: 'idle' };
}
