# Naming

- `PascalCase` — components, types, interfaces. One component per file, file named after it: `WeatherCard.tsx`.
- `camelCase` — variables, functions, hooks (`useForecast`), non-component files (`formatTemperature.ts`).
- `SCREAMING_SNAKE_CASE` — module-level constants only.
- Custom hooks start with `use`. Event handlers start with `handle` (`handleSubmit`); the prop they bind to starts with `on` (`onSubmit`).
- Booleans read as predicates: `isLoading`, `hasError`, `canRefresh`.
- Domain terms match `CONTEXT.md` exactly — same word every time, no local synonyms.
- Types describe the shape: `Forecast`, not `ForecastType` / `IForecast`.
- Spell names out in full; abbreviate only where the domain itself does.
