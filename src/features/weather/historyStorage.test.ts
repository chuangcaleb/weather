import { beforeEach, describe, expect, it } from 'vitest';
import { HISTORY_STORAGE_KEY, initHistoryState } from './historyStorage';
import type { HistoryState, Query, Reading } from './types';

const reading: Reading = {
  summary: 'Clouds',
  description: 'overcast clouds',
  temperatureC: 18,
  humidity: 70,
  place: 'Lisbon, PT',
};

function query(city: string, country = 'PT'): Query {
  return { city, country };
}

const emptyState: HistoryState = { schemaVersion: 1, entries: [] };

describe('initHistoryState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('reads persisted state synchronously on init', () => {
    const persisted: HistoryState = {
      schemaVersion: 1,
      entries: [
        {
          query: query('Lisbon'),
          reading,
          requestedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    };
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(persisted));

    expect(initHistoryState()).toEqual(persisted);
  });

  it('resets silently on malformed JSON instead of throwing', () => {
    localStorage.setItem(HISTORY_STORAGE_KEY, 'not json');
    expect(initHistoryState()).toEqual(emptyState);
  });

  it('resets silently on a schema version mismatch', () => {
    localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify({ schemaVersion: 2, entries: [] }),
    );
    expect(initHistoryState()).toEqual(emptyState);
  });

  it('returns empty state when nothing is persisted yet', () => {
    expect(initHistoryState()).toEqual(emptyState);
  });
});
