# Phase 2 — CSS architecture

Part of [Build Spec](../build-spec.md). Read this file only — no other phase needed to complete this one.

## 3. CSS architecture

```css
@layer reset, tokens, base, compositions, blocks, utilities, exceptions;

@import 'open-props/style' layer(tokens);
@import './reset.css' layer(reset);
@import './base.css' layer(base);
@import './compositions/index.css' layer(compositions);
```

- Open Props ships unlayered — must be imported `layer(tokens)` or it outranks every layered rule.
- `blocks` sits above `compositions` (deviates from the CUBE reference): once a composition declares a custom property, a block redeclaring it wins outright, no specificity trick needed.
- Five composition primitives, all in `compositions/`: `flow`, `cluster`, `grid`, `switcher`, `repel`. No `sidebar`, no `region` — no call site. `wrapper` is a **utility** (single job, no configurable knob), lives in `utilities/`.
- One shared, inheritable `--gutter` custom property — no per-primitive namespaced vars.
- Overrides go through a block class in the `blocks` layer, re-declaring the custom property (`.result-card { --gutter: var(--size-2); }`) — never inline `style`, never a data-attribute variant (none of the five primitives has more than one configuration). See [ADR-0001](../adr/0001-css-primitive-override-mechanism.md).
- Exact primitive CSS: [css.md](../agents/coding-standards/css.md).
- Stylelint enforcement of the layer order: configured (issue #12) — `stylelint.config.js` + local `weather/layer-order` rule + `defensive-css/require-at-layer`, run via `pnpm lint:css`. Not yet wired into a pre-commit hook (no Lefthook config exists yet).

## Done when

- `src/styles/` matches the layer order and primitive set above.
- `pnpm lint:css` passes with the `weather/layer-order` + `require-at-layer` rules active.
- No inline `style` custom-property overrides anywhere in `src/`.
