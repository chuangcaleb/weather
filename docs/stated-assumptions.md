# Stated Assumptions

UI-behaviour calls the requirements left open. Each was reversible enough, and small enough, to decide as a stated assumption rather than open a wayfinder decision ticket — see [issue #10](https://github.com/chuangcaleb/weather/issues/10) and [issue #11](https://github.com/chuangcaleb/weather/issues/11) on the [map](https://github.com/chuangcaleb/weather/issues/1) for where each was flagged. Revisit any of these on user feedback without reopening the map.

## Country field control

Native `<select>` of ISO 3166-1 alpha-2 codes (`Intl.DisplayNames` for labels), styled via CSS to visually read as a plain input field.

**Why:** the mockup showed a plain input; the API requires alpha-2 codes only (no free-text country names, [issue #3](https://github.com/chuangcaleb/weather/issues/3)). A native `<select>` beats a `<datalist>` for a ~249-item list on mobile (inconsistent mobile `<datalist>` support), and a constrained control guarantees no invalid country ever reaches the API. Correctness and mobile UX won over matching the mockup's literal control type.

Source: [issue #9 resolution](https://github.com/chuangcaleb/weather/issues/9).

## Loading affordance

Single loading affordance: a spinner in the result-card slot, no separate pending state anywhere else. The history list does **not** get its own loading indicator during a re-search — the result card's spinner covers it, since a re-search from history goes through the exact same single in-flight query as a fresh search.

**Why:** the app has exactly one live query at a time (TanStack Query, keyed on the submitted `Query`); a second loading indicator on the history row would just repeat the same pending state and add a place for the two to fall out of sync. No `aria-live` announcement on pending (per [issue #9](https://github.com/chuangcaleb/weather/issues/9)) — only success/error transitions announce.

## Theme switcher mechanics

- **Default:** follows `prefers-color-scheme` (system preference), no light default.
- **Override:** explicit toggle button in the header; once the user has touched it, their choice wins over system preference until changed again.
- **Persistence:** `localStorage` key `weather:theme`, value `"light" | "dark"` (absent = follow system). Separate key from `weather:history` — theme and history are independent concerns with independent failure modes.
- **Applied via:** a `data-theme="light" | "dark"` attribute on `<html>`; CSS reads it to select the Open Props color set.
- **Flash-on-load prevention:** a small inline, blocking `<script>` in `index.html`'s `<head>` (before any stylesheet or React mounts) reads `localStorage['weather:theme']`, falls back to `matchMedia('(prefers-color-scheme: dark)')`, and sets `data-theme` synchronously — the standard no-FOUC pattern. Plain script, no React involved in the first paint.

**Why:** system-preference default matches user expectation and needs no onboarding; persisting the override (rather than re-deriving from system every load) is the least surprising once someone has explicitly chosen a side. The inline blocking script is the only way to avoid a flash given React mounts after first paint.

## Accessibility specifics not covered above

Focus management after search/delete and reduced-motion handling are **not** decided here — they're carried on the map's Not yet specified list as a separate concern from this ticket, not folded into this doc. Build session should treat them as open unless a future ticket settles them.
