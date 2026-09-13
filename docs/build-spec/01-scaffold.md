# Phase 1 — Scaffold and tooling

Part of [Build Spec](../build-spec.md). Read this file only — no other phase needed to complete this one.

## 1. Stack and tooling

- Vite + React + TypeScript SPA, no router, one page (`App.tsx`).
- pnpm, latest stable Node LTS.
- TypeScript `strict: true` + `noUncheckedIndexedAccess`. ESLint flat config (typescript-eslint recommended-type-checked, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`), Prettier last in the chain. Vitest + Testing Library + MSW.
- Lefthook: pre-commit runs Prettier + ESLint `--fix` on staged files; pre-push runs typecheck + full test suite. CI mirrors pre-push, plus more (see below).
- Deploy target Vercel project `chuangcaleb/weather` (already linked, see phase 3's §4). Dev command is `pnpm dev:vercel` (`vercel dev`, runs Vite underneath, serves `api/` on the same origin) — needs a linked project and one prior deployment, both already done. Optional `pnpm dev` script running plain `vite` for styling work with no live API (`/api/weather` 404s under it; the error boundary already handles that).
- CI (issue #14): one GitHub Actions workflow, single job, steps in sequence — `pnpm lint` → `pnpm lint:css` → `pnpm typecheck` → `pnpm test` → `pnpm build`. All five required as a branch-protection status check on `main` (protection to be enabled once the workflow exists). Vercel's per-PR preview deploy (automatic on Hobby once linked) stays informational only, not a required check — it builds the same code the CI job already builds, so gating on both is redundant. Workflow file (`.github/workflows/ci.yml`) is created in this phase once `package.json` has real `lint`/`typecheck`/`test`/`build` scripts — writing it against scripts that don't exist yet would just fail on every push.
- Full detail per concern: [tooling](../agents/coding-standards/tooling.md), [naming](../agents/coding-standards/naming.md), [file layout](../agents/coding-standards/file-layout.md), [typescript](../agents/coding-standards/typescript.md), [react](../agents/coding-standards/react.md), [data fetching](../agents/coding-standards/data-fetching.md), [testing](../agents/coding-standards/testing.md), [css](../agents/coding-standards/css.md).
- Commits: Conventional Commits, imperative subject, no trailing period, reference the issue when one exists.

## 2. File layout

```
src/
├── main.tsx              # entry: mount + providers (TanStack Query client)
├── App.tsx                # the single route
├── components/            # presentational, reusable, no data fetching
├── features/weather/       # search form, result card, history list + their hooks/types
├── lib/
│   ├── api/                # fetch wrappers targeting /api/*, one file per resource
│   └── <util>.ts           # pure helpers (e.g. formatTemperature, normalizeQuery)
├── styles/
│   ├── index.css            # @layer order statement, imports
│   ├── reset.css
│   ├── base.css
│   ├── compositions/         # flow, cluster, grid, switcher, repel + index.css
│   └── utilities/             # wrapper + index.css
└── types/                  # shared types only; co-locate the rest
api/
└── weather.ts             # Vercel Function, the serverless proxy
```

Flat files, no barrels. `@/` alias across directories, relative paths within one. Co-locate tests beside their subject (`formatTemperature.test.ts`); promote a type/helper to `lib/`/`types/` on its second consumer.

## Done when

- `package.json` has real `lint`/`lint:css`/`typecheck`/`test`/`build` scripts.
- `.github/workflows/ci.yml` exists, all five steps wired, branch protection enabled on `main`.
- Empty directory skeleton above exists (files can be stubs).
