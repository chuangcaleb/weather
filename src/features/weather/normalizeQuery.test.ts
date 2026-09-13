import { describe, expect, it } from 'vitest';
import { normalizeQuery } from './normalizeQuery';

describe('normalizeQuery', () => {
  it('lowercases and trims city, uppercases country', () => {
    expect(normalizeQuery({ city: '  Lisbon  ', country: 'pt' })).toBe(
      'lisbon|PT',
    );
  });

  it('treats casing/whitespace variants as the same identity', () => {
    expect(normalizeQuery({ city: 'Lisbon', country: 'PT' })).toBe(
      normalizeQuery({ city: 'lisbon', country: 'pt' }),
    );
  });

  it('does not mutate what is displayed elsewhere', () => {
    const query = { city: 'Lisbon', country: 'PT' };
    normalizeQuery(query);
    expect(query).toEqual({ city: 'Lisbon', country: 'PT' });
  });
});
