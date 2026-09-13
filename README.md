# Weather

Single-page weather lookup: search a city, see current conditions, keep a local search history.

## Setup

```bash
pnpm install
pnpm vercel link   # one-time: link this directory to the Vercel project
pnpm vercel        # one-time: first deployment, required before `vercel dev` works
pnpm dev:vercel    # day-to-day dev command — runs Vite + the API proxy on one origin
```

Copy `.env.example` to `.env.local` and set `WEATHER_API_KEY` (OpenWeather key). `vercel dev` also pulls the Development environment variables automatically if the project is linked.

> **Fresh key 401s for up to 2 hours.** OpenWeather activates new keys asynchronously. A 401 right after creating a key is expected, not a bug — retry later.

## Scripts

| Script            | Purpose                                                        |
| ----------------- | -------------------------------------------------------------- |
| `pnpm dev:vercel` | Primary dev command — Vite + `/api` proxy, same origin         |
| `pnpm dev`        | Plain `vite`, no API (styling work only — `/api/weather` 404s) |
| `pnpm build`      | Typecheck + production build                                   |

## Docs map

- [`CONTEXT.md`](CONTEXT.md) — domain glossary (query, reading, history entry, composition, utility, gutter, ...).
- [`docs/build-spec.md`](docs/build-spec.md) — everything a build session needs: stack, file layout, CSS architecture, API path, domain types, state model, component inventory, test bar.
- [`docs/stated-assumptions.md`](docs/stated-assumptions.md) — calls made where requirements were silent (country field control, loading affordance, theme switcher mechanics).
- [`docs/adr/`](docs/adr/) — architecture decision records.
- [`docs/research/`](docs/research/) — background research the build spec draws on (OpenWeather API surface, Vercel serverless proxy, Every Layout primitives).
- [`docs/agents/coding-standards.md`](docs/agents/coding-standards.md) — naming, layout, TypeScript, React, data fetching, testing, tooling.

## Testing

Vitest + Testing Library + MSW. See [`docs/agents/coding-standards/testing.md`](docs/agents/coding-standards/testing.md) for the coverage bar.

## Deploy

Vercel project `chuangcaleb/weather`. Push to `main` deploys production; PRs get preview deployments. `WEATHER_API_KEY` is set for Production/Preview/Development in the Vercel dashboard.
