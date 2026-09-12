# TypeScript

- `strict: true` plus `noUncheckedIndexedAccess`. Use `unknown` and narrow it — reach for a real type over `any`.
- `as` assertions confined to tests. One needed in `src/` means the type itself is wrong — fix the type instead.
- `type` over `interface` unless declaration merging is needed.
- Infer return types; annotate parameters and public module boundaries.
- Validate API responses at the boundary (zod or a hand-written type guard). Everything past the boundary is trusted and typed.
