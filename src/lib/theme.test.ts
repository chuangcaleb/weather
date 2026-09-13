import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyTheme,
  readStoredTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
} from './theme';

function stubSystemTheme(prefersDark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: prefersDark })),
  );
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('readStoredTheme', () => {
  it('returns null while the user has not overridden the system', () => {
    expect(readStoredTheme()).toBeNull();
  });

  it('ignores a stored value that is not a theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'aubergine');
    expect(readStoredTheme()).toBeNull();
  });

  it('follows the system when storage refuses to be read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(readStoredTheme()).toBeNull();
    vi.restoreAllMocks();
  });
});

describe('resolveTheme', () => {
  it('follows the system preference by default', () => {
    stubSystemTheme(true);
    expect(resolveTheme()).toBe('dark');

    stubSystemTheme(false);
    expect(resolveTheme()).toBe('light');
  });

  it('lets an explicit override beat the system preference', () => {
    stubSystemTheme(true);
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    expect(resolveTheme()).toBe('light');
  });
});

describe('applyTheme', () => {
  it('writes the attribute the stylesheet reads, and persists the choice', () => {
    applyTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('still applies the theme when storage refuses the write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    applyTheme('light');

    expect(document.documentElement.dataset.theme).toBe('light');
    vi.restoreAllMocks();
  });
});
