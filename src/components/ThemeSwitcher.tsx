import { useEffect, useState } from 'react';
import {
  applyTheme,
  readStoredTheme,
  resolveTheme,
  type Theme,
} from '@/lib/theme';
import { IconButton } from './IconButton';
import { MoonIcon } from './icons/MoonIcon';
import { SunIcon } from './icons/SunIcon';

/**
 * The attribute itself is set before first paint by the blocking script in
 * index.html; this component only owns changes after mount.
 */
export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>(resolveTheme);

  useEffect(() => {
    // Only meaningful while the user is still following the system: an explicit
    // choice outranks the OS until they change it again.
    if (readStoredTheme()) return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      const next: Theme = event.matches ? 'dark' : 'light';
      setTheme(next);
      document.documentElement.dataset.theme = next;
    };

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [theme]);

  function handleToggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  }

  return (
    <IconButton
      label={
        theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
      }
      variant="ghost"
      onClick={handleToggle}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </IconButton>
  );
}
