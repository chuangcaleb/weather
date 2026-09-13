import { describe, expect, it } from 'vitest';
import { COUNTRY_OPTIONS } from './countries';

describe('COUNTRY_OPTIONS', () => {
  it('pairs every alpha-2 code with a resolved name', () => {
    expect(COUNTRY_OPTIONS.length).toBeGreaterThan(200);
    for (const option of COUNTRY_OPTIONS) {
      expect(option.code).toMatch(/^[A-Z]{2}$/);
      expect(option.name).not.toBe(option.code);
    }
  });

  it('holds no duplicate codes', () => {
    const codes = COUNTRY_OPTIONS.map((option) => option.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('is sorted by display name', () => {
    const names = COUNTRY_OPTIONS.map((option) => option.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});
