# Weather

Single-page weather lookup app: search form, result card, search history.

## Language

**Composition**:
A layout primitive that arranges children (spacing, wrapping, alignment) and carries no color, font, or decoration. One of CUBE CSS's four layers. Not to be confused with React "composing components" — this term is CSS-layer-specific.
_Avoid_: layout helper, primitive class (when the CUBE-layer meaning is intended, say "composition")

**Utility**:
A CSS class that does exactly one job (e.g. `.wrapper` sets max-width and inline padding) and nothing else. Distinct from a composition: a utility has no configurable knob, a composition does.
_Avoid_: helper class

**Gutter**:
The single shared, inheritable `--gutter` custom property that every composition primitive reads for its spacing. Setting it on an ancestor retunes every nested primitive beneath it.
_Avoid_: spacing var, gap variable

**Query**:
The user's submitted search input: `{ city, country }`, country an ISO 3166-1 alpha-2 code. Identity for bump-vs-duplicate comparison is normalized — city trimmed + casefolded, country uppercased — so `"Lisbon, PT"` and `"lisbon, pt"` are the same query.
_Avoid_: search term, search

**Reading**:
A snapshot of weather conditions at one moment for one place: summary, description, temperature (°C), humidity, plus the place name as echoed back by the API (not the user's raw input casing).
_Avoid_: result, weather data, conditions

**History entry**:
One row in the persisted Search History list: `{ query, reading, requestedAt }`. A snapshot tagged by the query that produced it, not a live query that re-runs on its own. Re-searching a query already present overwrites that entry's reading and `requestedAt` in place and moves it to the top of the list — it never creates a duplicate row. A failed search (city not found, network error) never creates or touches a history entry; history only records readings actually obtained.
_Avoid_: search history item, past search

**History list**:
The ordered set of History entries, capped at 25. Order is always derived — sorted by `requestedAt` descending, never a separately-tracked position — so a bump or delete can't desync order from recency. Past the cap, the entry with the oldest `requestedAt` is evicted silently: eviction is memory management, not a user-facing event.
_Avoid_: history, saved searches

**Current reading**:
The Reading shown in the result card right now, driven by its own state — independent of the history list, not a view onto `history[0]`. Session-only: does not persist across reload (only history persists to `localStorage`), and is unaffected by deleting the history entry that happens to match it.
_Avoid_: active result, displayed result
