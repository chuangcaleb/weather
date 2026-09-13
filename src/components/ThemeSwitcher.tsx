import { useState } from 'react';
import { applyTheme, resolveTheme, type Theme } from '@/lib/theme';
import { IconButton } from './IconButton';
import { MoonIcon } from './icons/MoonIcon';
import { SunIcon } from './icons/SunIcon';

/**
 * The attribute is set before first paint by the blocking script in index.html;
 * this component owns changes after mount. The system preference is read once,
 * at mount — the app does not re-sync to an OS theme change mid-session.
 */
export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>(resolveTheme);

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
