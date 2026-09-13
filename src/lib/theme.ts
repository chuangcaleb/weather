export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'weather:theme';

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

/** The user's explicit override, or `null` while they are still following the system. */
export function readStoredTheme(): Theme | null {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(raw) ? raw : null;
  } catch (error) {
    console.error(
      'Failed to read the stored theme, following the system.',
      error,
    );
    return null;
  }
}

export function readSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * Mirrors the blocking script in index.html: an explicit override wins, otherwise
 * the system decides. Both must agree or the first paint flashes the wrong theme.
 */
export function resolveTheme(): Theme {
  return readStoredTheme() ?? readSystemTheme();
}

/** The single writer of the attribute the stylesheet selects on. */
export function setThemeAttribute(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

export function applyTheme(theme: Theme): void {
  setThemeAttribute(theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error('Failed to persist the theme choice.', error);
  }
}
