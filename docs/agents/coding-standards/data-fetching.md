# Data Fetching

- All HTTP calls live under `src/lib/api/`.
- Server state goes through TanStack Query (`useQuery`/`useMutation`) — loading, error, retry, and caching are its job, not `useState` + `useEffect`.
- Every request handles three states in the UI: loading, error, empty.
- Config comes from `import.meta.env.VITE_*`. `.env` is gitignored; `.env.example` is committed with empty values.
- Query aborts in-flight requests on unmount/param change on its own; a hand-rolled call carries its own `AbortSignal`.
