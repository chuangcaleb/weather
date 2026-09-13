# Highlights

## 01 Project

See specific files for rules details.

- agentic framework: mattpocock/skills
- stack: Vite + React + Typescript
- package manager: pnpm
- lint: ESLint, stylelint
- formatter: prettier
- testing: vitest
- hook: lefthook
- ci: GitHub CI
- deploy
  - host: Vercel
  - proxied: through CNAME on my personal domain

## 02 CSS

- CUBE CSS methodology
- Every Layout reusable primitives
- Open Props for quick drop-in style tokens
- organised with css @layout
- regular ol' CSS Modules for block-level styles

## 03 API & Data

- Vercel Function for serverless proxy
  - prevents exposing our API key
  - reconstructs parameters, preventing raw query string quota abuse
- Cache control + Vercel CDN
- @tanstack/react-query for local cache, server state management, etc.
- hooks with simple interface for complex interactions
  - useWeatherSearch: fetch API
  - useCurrentReading: get active weather reading data item
  - useHistory: manage history state in localstorage

### Storage

- search query is used as key, after normalisation
- read/writes into localstorage
- two ops: upsert, delete
- decided an implicit limit of max 25 items, which saves thinking about how to handle large counts lol
- handles edge cases, e.g. malformed localstorage
- no cross-tab handling, just last-write-wins
- failed searches ommitted

### Current weather data reading

- separate state, so deleting a history record does not break reading
- managed by tanstack query

## 04 UI Render

- Error boundaries, localised errors should not break entire page
- Appropriate UI for all network fetching states, e.g. loading, error, etc.
- Handles edge cases, e.g. does not retry on 4xx, always appropriate messages
- Error message feedback
- a11y friendly
- prefer using web native tools rather than reaching for third-party libraries
- Listing handles empty list, exceeding row limit
- Everything is fluidly responsive, avoids media query breakpoints

### Inventory

- Search Form
  - Decided to use `<select>` for the fixed-set of countries, better UX and prevents user input error. Didn't implement dropdown for city, that would require a much larger fixed-set of cities, not worth it.
  - input validation, with error (though the red color doesn't contrast that great)
- Result Card
- History List
  - Decided to break off into its own card section, visual separation
  - Interaction buttons
- Light-dark mode theme switcher
- Buttons all have same shape, rounded corners, etc. (matches with form field)
