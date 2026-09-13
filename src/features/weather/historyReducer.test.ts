import { describe, expect, it, vi } from 'vitest';
import {
  HISTORY_CAP,
  historyReducer,
  selectSortedEntries,
} from './historyReducer';
import type { HistoryState, Query, Reading } from './types';

const reading: Reading = {
  summary: 'Clouds',
  temperatureC: 18,
  highC: 20,
  lowC: 15,
  humidity: 70,
  place: 'Lisbon, PT',
};

function query(city: string, country = 'PT'): Query {
  return { city, country };
}

const emptyState: HistoryState = { schemaVersion: 1, entries: [] };

describe('historyReducer', () => {
  it('prepends a new entry on search:succeeded', () => {
    const next = historyReducer(emptyState, {
      type: 'search:succeeded',
      query: query('Lisbon'),
      reading,
      requestedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(next.entries).toHaveLength(1);
    expect(next.entries[0]?.query).toEqual(query('Lisbon'));
  });

  it('upserts in place by normalized query identity instead of duplicating', () => {
    const withFirst = historyReducer(emptyState, {
      type: 'search:succeeded',
      query: query('Lisbon', 'pt'),
      reading,
      requestedAt: '2026-01-01T00:00:00.000Z',
    });
    const bumped = historyReducer(withFirst, {
      type: 'search:succeeded',
      query: query('lisbon', 'PT'),
      reading: { ...reading, temperatureC: 25 },
      requestedAt: '2026-01-02T00:00:00.000Z',
    });

    expect(bumped.entries).toHaveLength(1);
    expect(bumped.entries[0]?.reading.temperatureC).toBe(25);
    expect(bumped.entries[0]?.requestedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  it('removes an entry on entry:deleted', () => {
    const withEntry = historyReducer(emptyState, {
      type: 'search:succeeded',
      query: query('Lisbon'),
      reading,
      requestedAt: '2026-01-01T00:00:00.000Z',
    });
    const next = historyReducer(withEntry, {
      type: 'entry:deleted',
      query: query('Lisbon'),
    });

    expect(next.entries).toHaveLength(0);
  });

  it('evicts the oldest entry silently past the cap', () => {
    let state = emptyState;
    for (let i = 0; i < HISTORY_CAP; i++) {
      state = historyReducer(state, {
        type: 'search:succeeded',
        query: query(`City${i}`),
        reading,
        requestedAt: `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`,
      });
    }
    expect(state.entries).toHaveLength(HISTORY_CAP);

    const overCap = historyReducer(state, {
      type: 'search:succeeded',
      query: query('Newest'),
      reading,
      requestedAt: '2026-02-01T00:00:00.000Z',
    });

    expect(overCap.entries).toHaveLength(HISTORY_CAP);
    expect(overCap.entries.some((e) => e.query.city === 'City0')).toBe(false);
    expect(overCap.entries.some((e) => e.query.city === 'Newest')).toBe(true);
  });

  it('degrades to memory-only when localStorage throws on write, without surfacing an error to the caller', () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('quota exceeded');
      });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const next = historyReducer(emptyState, {
      type: 'search:succeeded',
      query: query('Lisbon'),
      reading,
      requestedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(next.entries).toHaveLength(1);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
    setItemSpy.mockRestore();
  });
});

describe('selectSortedEntries', () => {
  it('derives order from requestedAt descending, never a stored position', () => {
    const state: HistoryState = {
      schemaVersion: 1,
      entries: [
        {
          query: query('Older'),
          reading,
          requestedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          query: query('Newer'),
          reading,
          requestedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
    };

    expect(selectSortedEntries(state).map((e) => e.query.city)).toEqual([
      'Newer',
      'Older',
    ]);
  });
});
