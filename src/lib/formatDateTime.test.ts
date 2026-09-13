import { describe, expect, it } from 'vitest';
import { formatDateTime } from './formatDateTime';

// Built in local time so the assertion holds in any machine's timezone.
const localMoment = new Date(2022, 8, 1, 9, 41);

describe('formatDateTime', () => {
  it('renders an ISO timestamp as a day-first date and 24-hour time', () => {
    expect(formatDateTime(localMoment.toISOString())).toBe('01/09/2022, 09:41');
  });

  it('returns an empty string for an unparseable value', () => {
    expect(formatDateTime('not a date')).toBe('');
  });
});
