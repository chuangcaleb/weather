# Phase 3 — API, domain types, state model

Part of [Build Spec](../build-spec.md). Read this file only — no other phase needed to complete this one. Blocks phase 4 (components wire to this state).

## 4. API access path

- Upstream: OpenWeather **Current Weather Data**, `GET https://api.openweathermap.org/data/2.5/weather?q={city},{alpha2}&units=metric&appid={key}`. Full findings: [openweather-api.md](../research/openweather-api.md).
- Client never calls OpenWeather directly. It calls a same-origin **serverless proxy**: `GET /api/weather?city={city}&country={alpha2}`. The Vercel Function (`api/weather.ts`) reconstructs the upstream URL server-side (does not forward the raw query string — mitigates quota abuse) and appends `units=metric` and the key. Sets `Cache-Control: s-maxage=600` so Vercel's CDN absorbs repeat lookups — decided, not optional (issue #18). No per-IP rate limit: would need external state (Upstash/Vercel KV) that contradicts the no-card Hobby-plan constraint, for a low-likelihood threat at this app's scale (personal/demo, unlisted). Full findings: [vercel-serverless-proxy.md](../research/vercel-serverless-proxy.md).
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
- Country field is a constrained control (ISO 3166-1 alpha-2 only, see [stated-assumptions.md](../stated-assumptions.md)); the app owns code-to-name display via `Intl.DisplayNames` — the API never supplies a readable country name.
- A 401 always means the key, never bad user input (auth checked before query parsing) — map it to the operator-facing message in phase 4's §7, never to "city not found". A fresh deploy may 401 for up to 2 hours after key creation; that's expected, not a bug (README note).

## 5. Domain types

Glossary source: [CONTEXT.md](../../CONTEXT.md).

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

## Done when

- `api/weather.ts` proxy live, reconstructs URL server-side, sets `s-maxage=600`.
- `Query`/`Reading`/`HistoryEntry`/`HistoryState` types in place, response validated at boundary.
- History reducer + current-reading state wired per the flow above, `localStorage` degrade path handled.
