# Testing

- Vitest + `@testing-library/react`. Query by role and accessible name — test behaviour through the DOM; reach for `data-testid` only when no accessible handle exists.
- MSW mocks the network at the HTTP layer, so the real client code runs. `fetch` and the API module stay unmocked.
- Coverage bar: each pure helper in `lib/`, each component's loading/error/success branches, a regression test for every bug fix.
- Skip snapshot tests — they assert nothing meaningful and rot.
- No coverage percentage gate; the branches above are the bar.
