# CSS

CUBE CSS layering over Open Props. Source: [issue #6](https://github.com/chuangcaleb/weather/issues/6), [every-layout-primitives.md](../research/every-layout-primitives.md) research, [ADR-0001](../adr/0001-css-primitive-override-mechanism.md).

Code blocks below are illustrative, not synced to `src/styles/`. Once that directory exists it is the source of truth for exact values (fallback sizes, thresholds). Edit this file when a *decision* changes (layer order, primitive set, gutter strategy, override mechanism) — not to mirror a tuning change made in the actual stylesheet.

## Layers

```css
@layer reset, tokens, base, compositions, blocks, utilities, exceptions;

@import 'open-props/style' layer(tokens);
@import './reset.css' layer(reset);
@import './base.css' layer(base);
@import './compositions/index.css' layer(compositions);
```

Open Props ships unlayered — import it into `tokens` or it outranks every layered rule regardless of specificity. `blocks` sits above `compositions` (deviates from the CUBE reference, which has it the other way): once a composition declares a custom property rather than only reading it, a block redeclaring that property on the same element must win outright, no specificity trick needed.

## Composition primitives

Five, all in `compositions/`: `flow`, `cluster`, `grid`, `switcher`, `repel`. No `sidebar`, no `region` — no call site for either in this app.

`wrapper` is a **utility**, not a composition (CUBE classifies it as one — single job, no configurable knob) — lives in `utilities/`, not `compositions/`.

Every knob is `var(--name, <default>)`, default in the primitive's own file. No `:root` defaults block, no separate config file.

```css
/* compositions/flow.css */
.flow > * + * {
  margin-top: var(--gutter, 1em);
}

/* compositions/cluster.css */
.cluster {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gutter, var(--size-3));
  align-items: center;
}

/* compositions/grid.css */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: var(--gutter, var(--size-3));
}

/* compositions/switcher.css */
.switcher {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gutter, var(--size-3));
}

.switcher > * {
  flex-grow: 1;
  flex-basis: calc((var(--switcher-target-width, 30rem) - 100%) * 999);
}

.switcher > :nth-last-child(n + 5),
.switcher > :nth-last-child(n + 5) ~ * {
  flex-basis: 100%;
}

/* compositions/repel.css */
.repel {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--gutter, var(--size-3));
}
```

`grid` ships one variant only — auto-fill, no `data-layout` modifier. `switcher` uses Every Layout's universal quantity query (`:nth-last-child(n + 5)`, all children go full-width past the limit), not the reference boilerplate's `:nth-child(n + 3)` — the universal form holds for any child count, nothing to document as "don't exceed N children."

## Gutter

One shared `--gutter`, not per-primitive namespaced vars (`--cluster-gap`, `--switcher-gap`, …). Custom properties inherit — set `--gutter` once on an ancestor, every nested primitive retunes. This app is one page, five primitives, no deep nesting — no isolation problem to buy back with namespacing.

## Overrides

Block class in the `blocks` layer, reading and re-declaring the custom property:

```css
.result-card {
  --gutter: var(--size-2);
}
```

No inline `style` override, no data-attribute variant. Inline styles sit at the ceiling of the normal author cascade — nothing later can refine them, and the custom property inherits into the whole subtree whether you meant it to or not. Data-attribute variants exist for closed-set configurations (`[data-layout='halves']`); none of the five primitives here ships more than one configuration. See [ADR-0001](../adr/0001-css-primitive-override-mechanism.md) for the full reasoning.

## File layout

Not yet scaffolded — no `src/` in this repo yet. When the Vite app lands:

```
src/styles/
├── index.css           # @layer order statement, imports
├── reset.css
├── base.css
├── compositions/
│   ├── index.css
│   ├── flow.css
│   ├── cluster.css
│   ├── grid.css
│   ├── switcher.css
│   └── repel.css
└── utilities/
    ├── index.css
    └── wrapper.css
```
