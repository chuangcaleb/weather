# Coding Standard

How code in this repo should be written. Read before writing or reviewing code.

Stack: TypeScript + React on Vite, pnpm, single page route, data from a weather HTTP API.

**Tooling enforces most of this.** Skip anything ESLint, Prettier, or `tsc` already catches — review for what's below instead.

Reach for the file matching the branch you're on:

- **Tooling** — build chain, Lefthook split, what's fast vs slow to run. Reach when touching `lefthook.yml`, CI, or package scripts. See `coding-standard/tooling.md`.
- **Naming** — casing for components, hooks, files, booleans. Reach when naming anything. See `coding-standard/naming.md`.
- **File layout** — where a file belongs, co-location, imports, barrels. Reach when adding or moving a file. See `coding-standard/file-layout.md`.
- **TypeScript** — strictness, `as`, `type` vs `interface`, boundary validation. Reach when writing types. See `coding-standard/typescript.md`.
- **React** — component shape, hooks discipline, derived state, accessibility. Reach when writing a component. See `coding-standard/react.md`.
- **Data fetching** — TanStack Query, API client shape, loading/error/empty states. Reach when a component needs server data. See `coding-standard/data-fetching.md`.
- **Testing** — Vitest + Testing Library + MSW, coverage bar, banned patterns. Reach when writing or reviewing a test. See `coding-standard/testing.md`.

Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`), imperative subject, no trailing period, reference the issue when one exists.
