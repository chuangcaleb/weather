import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library only auto-registers its cleanup when Vitest runs with
// `globals: true`; this suite does not, so the DOM would otherwise carry
// every previous render into the next test.
afterEach(cleanup);

// jsdom ships no `matchMedia`. Default to a light system preference; tests that
// care about the dark branch stub it themselves.
if (!window.matchMedia) {
  window.matchMedia = (media: string) =>
    ({
      matches: false,
      media,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
