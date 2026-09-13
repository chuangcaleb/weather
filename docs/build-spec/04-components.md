# Phase 4 — Components and UI

Part of [Build Spec](../build-spec.md). Needs phase 3's types/state shape (`Query`, `Reading`, `HistoryEntry`, the reducer contract) — otherwise self-contained.

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
- `ThemeSwitcher` — see [stated-assumptions.md](../stated-assumptions.md).
- Icon buttons throughout: outlined, rounded-rect matching field radius, sizes vary by context, no circles.
- All layout via the five composition primitives (phase 2's §3) — no responsive breakpoints anywhere; wrapping is flex-wrap-driven.

## Done when

- Every component above exists, wired to phase 3's state, matching the state-to-UI table.
