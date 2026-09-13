# Build Spec

Everything a fresh session needs to build the weather app end to end, without reopening a decision. Every claim here traces to a closed ticket on [Map: Weather app — from blank repo to build-ready spec](https://github.com/chuangcaleb/weather/issues/1) or its linked research/coding-standard doc. See [stated-assumptions.md](stated-assumptions.md) for the calls made where the requirements were silent.

## 1. Stack and tooling

- Vite + React + TypeScript SPA, no router, one page (`App.tsx`).
- pnpm, latest stable Node LTS.
- TypeScript `strict: true` + `noUncheckedIndexedAccess`. ESLint flat config (typescript-eslint recommended-type-checked, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`), Prettier last in the chain. Vitest + Testing Library + MSW.
- Lefthook: pre-commit runs Prettier + ESLint `--fix` on staged files; pre-push runs typecheck + full test suite. CI mirrors pre-push.
- Deploy target Vercel project `chuangcaleb/weather` (already linked, see §4). Dev command is `vercel dev` (runs Vite underneath, serves `api/` on the same origin) — needs a linked project and one prior deployment, both already done. Optional `dev:ui` script running plain `vite` for styling work with no live API (`/api/weather` 404s under it; the error boundary already handles that).
- Full detail per concern: [tooling](agents/coding-standards/tooling.md), [naming](agents/coding-standards/naming.md), [file layout](agents/coding-standards/file-layout.md), [typescript](agents/coding-standards/typescript.md), [react](agents/coding-standards/react.md), [data fetching](agents/coding-standards/data-fetching.md), [testing](agents/coding-standards/testing.md), [css](agents/coding-standards/css.md).
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

## 3. CSS architecture

```css
@layer reset, tokens, base, compositions, blocks, utilities, exceptions;

@import 'open-props/style' layer(tokens);
@import './reset.css' layer(reset);
@import './base.css' layer(base);
@import './compositions/index.css' layer(compositions);
```

- Open Props ships unlayered — must be imported `layer(tokens)` or it outranks every layered rule.
- `blocks` sits above `compositions` (deviates from the CUBE reference): once a composition declares a custom property, a block redeclaring it wins outright, no specificity trick needed.
- Five composition primitives, all in `compositions/`: `flow`, `cluster`, `grid`, `switcher`, `repel`. No `sidebar`, no `region` — no call site. `wrapper` is a **utility** (single job, no configurable knob), lives in `utilities/`.
- One shared, inheritable `--gutter` custom property — no per-primitive namespaced vars.
- Overrides go through a block class in the `blocks` layer, re-declaring the custom property (`.result-card { --gutter: var(--size-2); }`) — never inline `style`, never a data-attribute variant (none of the five primitives has more than one configuration). See [ADR-0001](adr/0001-css-primitive-override-mechanism.md).
- Exact primitive CSS: [css.md](agents/coding-standards/css.md).
- Stylelint enforcement of the layer order: not yet configured — out of this build's scope, tracked in the map's Not yet specified.

## 4. API access path

- Upstream: OpenWeather **Current Weather Data**, `GET https://api.openweathermap.org/data/2.5/weather?q={city},{alpha2}&units=metric&appid={key}`. Full findings: [openweather-api.md](research/openweather-api.md).
- Client never calls OpenWeather directly. It calls a same-origin **serverless proxy**: `GET /api/weather?city={city}&country={alpha2}`. The Vercel Function (`api/weather.ts`) reconstructs the upstream URL server-side (does not forward the raw query string — mitigates quota abuse) and appends `units=metric` and the key. Optionally sets `Cache-Control: s-maxage=600` so Vercel's CDN absorbs repeat lookups. Full findings: [vercel-serverless-proxy.md](research/vercel-serverless-proxy.md).
- Env: single unprefixed `WEATHER_API_KEY`, read via `process.env` inside the function. Already set in the Vercel dashboard (Production/Preview/Development) and in `.env.local` for `vercel dev`. Never `VITE_`-prefixed — that inlines into the client bundle.
- Field mapping (proxy passes these through as-is or the client reads them from the proxy's JSON):

| Rendered value | JSON path |
| --- | --- |
| Summary | `weather[0].main` |
| Description | `weather[0].description` |
| Temperature (°C) | `main.temp` |
| Humidity (%) | `main.humidity` |
| Observation time | `dt` (unix seconds, UTC) — this is OpenWeather's own observation time, **not** the datetime of submission the page renders; keep the two distinct, derive submission time client-side |
| Resolved city / country | `name`, `sys.country` — render these, never the user's raw input casing |

- Validate the proxy's response shape at the boundary (zod or a hand-written guard) before it crosses into typed domain code.
- Country field is a constrained control (ISO 3166-1 alpha-2 only, see [stated-assumptions.md](stated-assumptions.md)); the app owns code-to-name display via `Intl.DisplayNames` — the API never supplies a readable country name.
- A 401 always means the key, never bad user input (auth checked before query parsing) — map it to the operator-facing message in §6, never to "city not found". A fresh deploy may 401 for up to 2 hours after key creation; that's expected, not a bug (README note).

## 5. Domain types

Glossary source: [CONTEXT.md](../CONTEXT.md).

```ts
type Query = {
  city: string;      // raw user input, trimmed for normalization only at compare-time
  country: string;    // ISO 3166-1 alpha-2, e.g. "PT"
};

type Reading = {
  summary: string;       // weather[0].main
  description: string;    // weather[0].description
  temperatureC: number;    // main.temp
  humidity: number;         // main.humidity
  place: string;             // `${name}, ${sys.country}` — API-echoed, not user input
};

type HistoryEntry = {
  query: Query;
  reading: Reading;
  requestedAt: string;   // ISO 8601, submission time — not `dt`
};

type HistoryState = {
  schemaVersion: 1;
  entries: HistoryEntry[];
};
```

Normalization for identity/bump comparison: city trimmed + casefolded, country uppercased — applied only when comparing/keying, never mutates what's stored or displayed.

## 6. State model

### Search history (`useReducer`, per [issue #8](https://github.com/chuangcaleb/weather/issues/8))

- Single `useReducer`, lazy initializer synchronously reads `localStorage['weather:history']` on mount. Every dispatch writes synchronously inside the reducer — zero `useEffect`.
- Actions: `search:succeeded` (upsert — key by normalized query, replace `reading`+`requestedAt` in place if present else prepend), `entry:deleted`.
- Order is always derived: sort by `requestedAt` descending at read time, never a stored order field.
- Cap 25: past the cap, evict the entry with the oldest `requestedAt` silently, no user-facing notice.
- Persisted shape: `{ schemaVersion: 1, entries: HistoryEntry[] }` at key `weather:history`. Parse failure or version mismatch → silently reset to `{ schemaVersion: 1, entries: [] }`, no migration code, never white-screens.
- Every `localStorage` read/write wrapped in try/catch; a throw (quota exceeded, storage disabled) degrades to memory-only for the session (console log, no user-facing error) — in-memory history keeps working, just stops persisting.
- Cross-tab: last-write-wins, no `storage`-event reconciliation.
- Failed searches never dispatch into history — no entry created or touched.

### Current reading

- Separate, session-only state (component state or its own small reducer) — **not** a view onto `history[0]`. Deleting the history entry that matches the current reading does not affect it.
- Driven by TanStack Query (`useQuery`), keyed on the submitted `Query`. Loading/error/retry/caching are the query's job.

### Query submission → history flow

1. User submits `Query` via the search form.
2. `useQuery` fires against `/api/weather`.
3. On success: current reading updates; `search:succeeded` dispatches into the history reducer.
4. On failure: current reading shows its error state; history is untouched.
5. Re-search from a history row re-submits that row's `Query` through the same path — same bump-or-append semantics, same "failure never touches the existing entry" guarantee.

## 7. State-to-UI table

Source: [issue #9 resolution](https://github.com/chuangcaleb/weather/issues/9).

| Condition | User sees | Retry? |
| --- | --- | --- |
| idle / no search yet | "Search a city to see current conditions." | — |
| pending | spinner in result-card slot, no live-region text | — |
| success | reading rendered from the API's own `name`/`sys.country` | — |
| 404 city not found | "No city matching {city} in {country}." | Yes — retype |
| 429 rate limit | "Too many searches. Try again shortly." | Yes — wait |
| 400 malformed | Generic "Something went wrong." (bug signal, log) | No |
| 401 bad key | Generic "Something went wrong." (operator fault, log loudly) | No |
| 5xx / network / timeout | "Weather service unavailable. Try again shortly." | Yes — auto (backoff) + manual button |
| aborted (superseded search) | No UI | — |
| empty history | "No searches yet." — own slot, not result card | — |

- TanStack Query retry: `retry: false` for 4xx (400/401/404/429). Default exponential backoff (2 retries) for network/5xx/timeout only, via a custom `retry` predicate keyed on error type. Manual "Try again" button renders on every recoverable row regardless of auto-retry state.
- One error boundary at app root, catches only thrown render errors (malformed data past defensive parsing) — "Something broke. Reload the page.", no retry. Query errors never throw to it; they render inline per the table.
- One `aria-live="polite" aria-atomic="true"` region wrapping the result-card slot; text changes on success/error transitions only, silent on pending. Validation messages ride native `:user-invalid` + `aria-describedby`, not the live region.
- Native `required` + `:user-invalid` validation on the form; message surfaces on submit attempt, no JS mirroring into `useState`.

## 8. Component inventory

Per [UI direction, issue #10](https://github.com/chuangcaleb/weather/issues/10) (Variant B, prototype on `prototype/ui-direction-10`):

- `App` — mounts the two sibling regions (search + result, history), theme switcher, error boundary.
- `SearchForm` (`features/weather/`) — city text input + country `<select>` (alpha-2 values, full names via `Intl.DisplayNames`, styled to read as an input), submit button matching the fields' radius.
- `ResultCard` (`features/weather/`) — one of: idle message, spinner, reading (summary, description, temperature, humidity, place, submission datetime), or an error row from §7. Condition icon breaks through the card's top edge (`position: absolute`, negative offset, `overflow: visible`). Translucent glass edge. `aria-live` region wraps this component's slot.
- `HistoryList` (`features/weather/`) — sibling region to `ResultCard`, never nested inside it. Renders "No searches yet." when empty, else up to 25 rows sorted by `requestedAt` descending.
- `HistoryRow` — City/Country label + datetime + re-search icon button + delete icon button. Rows wrap to two lines as a unit (label vs. actions+date) via flex-wrap + matching flex-basis, no media queries. Action buttons grouped `nowrap`.
- `ThemeSwitcher` — see [stated-assumptions.md](stated-assumptions.md).
- Icon buttons throughout: outlined, rounded-rect matching field radius, sizes vary by context, no circles.
- All layout via the five composition primitives (§3) — no responsive breakpoints anywhere; wrapping is flex-wrap-driven.

## 9. Test bar

Per [testing.md](agents/coding-standards/testing.md):

- Vitest + Testing Library, query by role/accessible name.
- MSW mocks the network at the HTTP layer (mocks `/api/weather`, not the OpenWeather API directly) — real client code runs.
- Coverage bar: every pure helper in `lib/` (`normalizeQuery`, `formatTemperature`, history reducer logic), every component's loading/error/success branches, a regression test for every bug fix.
- No snapshot tests. No coverage percentage gate — the branches above are the bar.
