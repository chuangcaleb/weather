/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    // Git worktrees live under .claude/; their copies of these files are not this
    // checkout's tests and resolve `@/` against the wrong tree.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.claude/**'],
    setupFiles: ['./src/vitest.setup.ts'],
    globals: false,
  },
});
