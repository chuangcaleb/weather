# Tooling

Vite + pnpm. TypeScript `strict: true`. ESLint flat config: typescript-eslint recommended-type-checked + `eslint-plugin-react-hooks` + `eslint-plugin-jsx-a11y`. Prettier owns formatting — `eslint-config-prettier` stays last in the flat config, no ESLint stylistic rules, no style bikeshedding in review. Vitest + Testing Library + MSW.

Commands live in `package.json` scripts once the repo is scaffolded — look there, not here.

## Lefthook split

- **Pre-commit**: Prettier + ESLint `--fix` on staged files only. Stays fast so it never gets skipped.
- **Pre-push**: typecheck + full test run. Slow checks belong here, not pre-commit.
- CI runs the same checks as pre-push — hooks are a fast path, not the source of truth.
- A hook that misfires gets fixed, not bypassed with `--no-verify`.
