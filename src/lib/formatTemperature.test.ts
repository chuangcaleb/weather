import { describe, expect, it } from 'vitest';
import { formatTemperature } from './formatTemperature';

describe('formatTemperature', () => {
  it('rounds to a whole degree', () => {
    expect(formatTemperature(18.5)).toBe('19°');
    expect(formatTemperature(18.4)).toBe('18°');
  });

  it('keeps sub-zero readings signed', () => {
    expect(formatTemperature(-3.2)).toBe('-3°');
  });

  it('renders zero without a sign', () => {
    expect(formatTemperature(-0.2)).toBe('0°');
  });
});
