# File Layout

```
src/
├── main.tsx              # entry: mount + providers
├── App.tsx               # the single route
├── components/           # presentational, reusable, no data fetching
├── features/weather/     # the one feature: its components, hooks, types
├── lib/
│   ├── api/              # HTTP client + endpoint wrappers, one file per resource
│   └── <util>.ts         # pure helpers, one concern per file
└── types/                # shared types only; co-locate the rest
```

- Co-locate by default: a type, helper, or test used by one module lives next to it. Promote to `lib/` or `types/` on the second consumer.
- Tests sit beside their subject: `formatTemperature.test.ts`.
- Assets: `public/` for served-as-is, `src/assets/` for Vite-hashed. Repo-root `reference/` is design reference, not shipped.
- Import with the `@/` alias across directories; relative paths within one.
- Flat files only: every module exports directly from its own file, no barrel `index.ts` — barrels break tree-shaking and hide the real import path.
