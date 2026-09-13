# Phase 5 — Tests

Part of [Build Spec](../build-spec.md). Needs phases 3-4 built (asserts against their behavior) — otherwise self-contained.

## 9. Test bar

Per [testing.md](../agents/coding-standards/testing.md), plus depth decided in [issue #13](https://github.com/chuangcaleb/weather/issues/13):

- Vitest + Testing Library, query by role/accessible name.
- MSW mocks the network at the HTTP layer (mocks `/api/weather`, not the OpenWeather API directly) — real client code runs. Handlers live in a shared `mocks/handlers.ts`: one factory per response shape (success, 404, 429, 400, 401, 5xx), composed per test via `server.use(...)` rather than redefined inline.
- Coverage bar: every pure helper in `lib/` (`normalizeQuery`, `formatTemperature`, history reducer logic), every component's loading/error/success branches, a regression test for every bug fix.
- Above the floor:
  - One `App`-level MSW-backed test for the full search→history round trip (submit succeeds, current reading updates, matching history row appears/bumps to top) — the floor's per-component branches never prove the wire-up between `ResultCard` and `HistoryList`.
  - One reducer test for storage-full degradation: mock `localStorage.setItem` to throw, assert the reducer still updates in-memory state and doesn't crash.
  - One direct unit test of the `api/weather.ts` proxy handler itself (plain function call, mock request) asserting it reconstructs the upstream URL from parsed params (never forwards the raw query string) and appends `units=metric` + the key. MSW intercepts before this function runs in every other test, so this is the only place that logic is exercised.
- Not tested: cross-tab last-write-wins (issue #8) is a deliberate absence of a `storage`-event listener, not a behaviour — asserting "nothing happens" is low-signal and stays a documented decision, not a test.
- No snapshot tests. No coverage percentage gate — the branches above are the bar.

## Done when

- Coverage bar met for every helper/component branch.
- The three above-floor tests exist and pass.
- CI (phase 1) green on `pnpm test`.
