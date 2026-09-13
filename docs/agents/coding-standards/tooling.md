# Tooling

Vite + pnpm. TypeScript `strict: true`. ESLint flat config: typescript-eslint recommended-type-checked + `eslint-plugin-react-hooks` + `eslint-plugin-jsx-a11y`. Prettier owns formatting — `eslint-config-prettier` stays last in the flat config, no ESLint stylistic rules, no style bikeshedding in review. Vitest + Testing Library + MSW.

Stylelint enforces the CSS `@layer` order (issue #12): `stylelint.config.js` at repo root, run via `pnpm lint:css`. Two rules, no single plugin covers both:

- `weather/layer-order` — local rule (`stylelint/rules/layer-order.mjs`) checking the bare `@layer reset, tokens, base, compositions, blocks, utilities, exceptions;` statement matches that exact order. No maintained plugin (`stylelint-order` included) understands `@layer` order.
- `defensive-css/require-at-layer` (`stylelint-plugin-defensive-css`) — every rule must sit inside a top-level `@layer` block, restricted to those seven names. Catches unlayered rules and typo'd layer names.

Gap: neither rule enforces where a *named* `@layer name { ... }` block sits relative to other blocks — only the bare statement's order and each rule's layer membership.

Commands live in `package.json` scripts once the repo is scaffolded — look there, not here.

## Lefthook split

- **Pre-commit**: Prettier + ESLint `--fix` on staged files only. Stays fast so it never gets skipped.
- **Pre-push**: typecheck + full test run. Slow checks belong here, not pre-commit.
- CI runs the same checks as pre-push — hooks are a fast path, not the source of truth.
- A hook that misfires gets fixed, not bypassed with `--no-verify`.
- Not yet scaffolded (no `lefthook.yml` in the repo). When it lands, `pnpm lint:css` belongs in pre-commit alongside Prettier/ESLint — stylelint is fast enough for staged-file linting.
