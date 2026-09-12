# Every Layout composition primitives: correct implementation, override mechanism, and layer placement

Research note resolving [issue #2](https://github.com/chuangcaleb/weather/issues/2). Sources are primary throughout: the Every Layout chapters that are publicly readable, the CUBE CSS site, Set Studio's own CUBE boilerplate source on GitHub, Open Props' source, and MDN for cascade and custom-property semantics. Where a claim comes from a secondary write-up it is marked as such.

## 1. Scope and source availability

Every Layout publishes only part of its catalogue for free. At the time of writing, **Stack**, **Sidebar** and **Switcher** render their full CSS on the public page; **Cluster**, **Grid**, **Center**, **Cover**, **Frame**, **Reel** and **Imposter** are behind the paywall and return only a purchase prompt ([every-layout.dev/layouts/cluster](https://every-layout.dev/layouts/cluster/), [.../grid](https://every-layout.dev/layouts/grid/), [.../center](https://every-layout.dev/layouts/center/)).

For the paywalled primitives the closest thing to an authoritative open implementation is **Set Creative Studio's `cube-boilerplate`**, written and maintained by Andy Bell's studio, which cites the corresponding Every Layout chapter in each file's header comment. That repository is treated here as the reference CUBE implementation: <https://github.com/Set-Creative-Studio/cube-boilerplate> (`src/css/compositions/*.css`, `src/css/utilities/region.css`).

## 2. How the idiomatic versions parameterise a primitive

### 2.1 Every Layout (public chapters)

Stack, from <https://every-layout.dev/layouts/stack/>:

```css
.stack {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.stack > * + * {
  margin-block-start: var(--space, 1.5rem);
}
```

Size variants are **separate classes that set the property directly**, not classes that set the custom property:

```css
[class^='stack'] > * {
  margin-block: 0;
}

.stack-large > * + * {
  margin-block-start: 3rem;
}

.stack-small > * + * {
  margin-block-start: 0.5rem;
}
```

Sidebar, from <https://every-layout.dev/layouts/sidebar/>:

```css
.with-sidebar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.sidebar {
  flex-basis: 20rem;
  flex-grow: 1;
}

.not-sidebar {
  flex-basis: 0;
  flex-grow: 999;
  min-inline-size: 50%;
}
```

Switcher, from <https://every-layout.dev/layouts/switcher/>:

```css
.switcher {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  --threshold: 30rem;
}

.switcher > * {
  flex-grow: 1;
  flex-basis: calc((var(--threshold) - 100%) * 999);
}

.switcher > :nth-last-child(n + 5),
.switcher > :nth-last-child(n + 5) ~ * {
  flex-basis: 100%;
}
```

Two patterns to note. First, Every Layout mixes both styles of default: `var(--space, 1.5rem)` puts the default in a `var()` fallback, while `--threshold: 30rem` **declares** the property on the primitive class itself. Second, the quantity query is written as `:nth-last-child(n + N), :nth-last-child(n + N) ~ *` — counting from the end and also selecting the following siblings, so that *every* child goes full-width once the limit is exceeded.

### 2.2 CUBE CSS

CUBE's Composition layer is described as a "high level macro view" that provides "flexible, component-agnostic layout systems", and it explicitly prescribes the custom-property configuration API ([cube.fyi/composition.html](https://cube.fyi/composition.html)):

```css
.flow > * + * {
  margin-top: var(--flow-space, 1em);
}
```

with the override shown as **a declaration inside the consuming block's own CSS class**, not inline:

```css
.card__content {
  --flow-space: 1.4rem;
}
```

CUBE also states what a composition must *not* do: no colour, fonts, shadows or decoration, and no "pixel-perfect layout instead of a flexible, progressive layout".

Separately, CUBE defines a utility as "a CSS class that does one job and does that one job well", and gives `.wrapper` — `margin-inline: auto; padding-inline: 1rem; max-width: 60rem;` — as an example of a utility, not a composition ([cube.fyi/utility.html](https://cube.fyi/utility.html)).

### 2.3 Set Studio's cube-boilerplate

The reference implementation, verbatim from the repository:

```css
/* compositions/cluster.css */
.cluster {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gutter, var(--space-s-m));
  justify-content: var(--cluster-horizontal-alignment, flex-start);
  align-items: var(--cluster-vertical-alignment, center);
}

/* compositions/flow.css */
.flow > * + * {
  margin-top: var(--flow-space, 1em);
}

/* compositions/grid.css */
.grid {
  display: grid;
  grid-template-columns: repeat(
    var(--grid-placement, auto-fill),
    minmax(var(--grid-min-item-size, 16rem), 1fr)
  );
  gap: var(--gutter, var(--space-s-l));
}

.grid[data-layout='halves'] {
  --grid-placement: auto-fit;
  --grid-min-item-size: clamp(16rem, 50vw, 33rem);
}

/* compositions/repel.css */
.repel {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: var(--repel-vertical-alignment, center);
  gap: var(--gutter, var(--space-s-m));
}

.repel[data-nowrap] {
  flex-wrap: nowrap;
}

/* compositions/sidebar.css */
.sidebar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gutter, var(--space-s-l));
}

.sidebar > :first-child {
  flex-basis: var(--sidebar-target-width, 20rem);
  flex-grow: 1;
}

.sidebar > :last-child {
  flex-basis: 0;
  flex-grow: 999;
  min-width: var(--sidebar-content-min-width, 50%);
}

/* compositions/switcher.css */
.switcher > * {
  flex-grow: 1;
  flex-basis: calc((var(--switcher-target-container-width, 40rem) - 100%) * 999);
}

.switcher > :nth-child(n + 3) {
  flex-basis: 100%;
}

/* utilities/region.css */
.region {
  padding-block: var(--region-space, var(--space-xl-2xl));
}
```

Four conventions fall out of this:

1. **Defaults live in the `var()` fallback, in the primitive's own file.** Every knob is `var(--name, <default>)`. There is no separate defaults file and no `:root` block declaring composition defaults.
2. **Spacing is a single shared, deliberately inheritable `--gutter`.** Cluster, grid, repel, sidebar, switcher and wrapper all read `--gutter`. Setting it once on an ancestor retunes every nested composition, because custom properties inherit (MDN: "A custom property defined using two dashes `--` … always inherits the value of its parent", [Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties)).
3. **Non-spacing knobs are namespaced per primitive** (`--cluster-vertical-alignment`, `--sidebar-target-width`, `--switcher-target-container-width`).
4. **Closed-set variants use a data attribute, not extra classes or inline styles** — `.grid[data-layout='halves']`, `.repel[data-nowrap]`. The attribute selector sets the custom properties; the consumer writes one attribute.

Note also that in the reference implementation **`region` is a utility, not a composition**, matching CUBE's own classification of single-job classes, and `.sidebar` is the *parent* class with `:first-child` / `:last-child` doing the work — there is no `:has()`.

## 3. Override mechanism: inline style vs class vs data attribute vs `@container`

### 3.1 The cascade facts that decide this

- **Normal inline styles beat every normal author declaration, in any layer, at any specificity.** MDN: "Normal inline styles take precedence over any other normal author styles, no matter the specificity of the selector." Only animations, transitions, and `!important` declarations from other origins can displace them ([MDN Cascade](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Cascade)).
- **Unlayered styles beat layered ones.** MDN: "Styles that are not defined in a layer always override styles declared in named and anonymous layers" ([MDN `@layer`](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)).
- **Custom properties inherit**, so any override applies to the element *and its whole subtree*, not just the element you targeted (MDN, as above).
- **An invalid `var()` substitution falls back to the property's initial or inherited value**, not to the declaration you wrote — a silent failure mode for hand-written custom property values (MDN, as above).

### 3.2 Trade-offs

| Mechanism | Wins against | Can express | Cost |
| --- | --- | --- | --- |
| Inline `style` custom property | Everything normal, unconditionally | One static value per element | Nothing in CSS can take it back without `!important`; no media/container query, no `:hover`, no `:nth-child`; inherits into the subtree; duplicated in markup per instance |
| Block/component CSS class | Whatever its layer and specificity allow | Anything CSS can express, including queries and states | One file hop from the call site; needs a class name |
| Data attribute + attribute selector | Same as a class | Same as a class, plus a legible closed enum in markup | A CSS rule per allowed value; two lookup surfaces |
| `@container` / media query | Same as a class | Responsive retuning without JS | Needs a containment context; cannot be expressed inline at all |

The decisive point is asymmetry: a class or data-attribute override can later be *refined* by a container query, a state selector, or a higher layer. An inline override cannot — it is the ceiling of the normal author cascade. That makes inline the right channel for genuinely dynamic, runtime-computed values and the wrong default for static design decisions.

Both primary sources agree with that reading: CUBE's documented override is `.card__content { --flow-space: 1.4rem; }` in a stylesheet, and the reference boilerplate's variants are `[data-layout='halves']` attribute selectors. Neither publishes an inline-style override pattern.

## 4. Assessment of the powerkids `primitiveVars` pattern

Reviewed: `/Users/chuangcaleb/Documents/dev/web/powerkids-site/src/styles/compositions/*.css`, `src/lib/primitive-vars.ts`, `docs/adr/0007-primitive-override-convention.md`, `docs/design/layout-primitives.md`.

### 4.1 What is sound

- **The parameterisation itself is correct and idiomatic.** Every knob is `var(--name, <default>)` with the default in the primitive's own file, defaults documented as living in code, and no colour or decoration in the composition layer. This matches CUBE's Composition rules and the reference boilerplate exactly.
- **Per-primitive namespacing (`--cluster-gap`, `--switcher-gap`, …) instead of a shared `--gutter` is a defensible deviation, not an error.** Because custom properties inherit, the shared `--gutter` in the reference implementation propagates into every nested composition; namespacing trades away "retune a subtree in one declaration" for isolation between nested primitives. For a codebase with deep composition nesting, the isolation is worth more.
- **`.switcher > :nth-child(n + 3) { flex-basis: 100% }` matches the reference implementation**, not Every Layout. Worth stating plainly because it looks like a mistake and isn't: Every Layout's `:nth-last-child(n + 5), :nth-last-child(n + 5) ~ *` makes *all* children full-width once the limit is exceeded, while the `nth-child(n + 3)` form leaves children one and two side by side and stacks only the third onward. Set Studio ships the latter. The documented "don't put more than two direct children in `.switcher`" rule is what keeps the difference from mattering.
- **The typed helper does catch a real class of bug.** A typo'd custom property name is silently ignored by CSS; `primitiveVars()` turns it into a compile error, and the drift test keeps the TypeScript arrays honest against the CSS files.
- **The two documented exceptions are correctly reasoned.** The ADR identifies precisely the capability gap — "media queries, pseudo-classes (`:hover`), and structural/combinator selectors … can only be expressed in CSS, never through the `style` prop".

### 4.2 Genuine flaws

1. **Inline is the wrong default direction for the cascade.** The ADR frames the choice as "inline unless CSS is needed", but the underlying asymmetry runs the other way. A class-based override can always be escalated later; an inline override is already at the ceiling of the normal author cascade and can only be beaten by `!important`. Every "exception 1" case is therefore not an exception but a migration: the value must move out of JSX into CSS, and every call site passing it must be edited. Defaulting to a class and escalating to inline only for runtime-computed values has the same ergonomics and none of the one-way-door cost.

2. **Inline custom properties inherit into the whole subtree, and the codebase relies on that unnoticed.** `card.tsx` sets `style={primitiveVars({ '--flow-space': '0' })}`. That declaration lands on the card element and is inherited by every descendant, so any nested `.flow` inside the card silently collapses to zero spacing rather than falling back to its own default. This is invisible at the call site and has no type-level guard.

3. **`.flow-[size]` sets the custom property on the wrong element, reintroducing the same leak.** The rule is `.flow-s > :not([hidden]) + :not([hidden]) { --flow-space: var(--space-s); }`. It declares `--flow-space` **on each child**, where it is then inherited by that child's own descendants — so a nested default `.flow` inside a `.flow-s` renders at the small step instead of its own `--space-l` default. Every Layout's equivalent variants deliberately avoid this by setting the property directly: `.stack-small > * + * { margin-block-start: 0.5rem; }`. Setting `margin-block-start` rather than `--flow-space` in the size classes fixes it with no other change.

4. **Substring attribute selectors over-match.** `[class*='flow']` matches any class containing the substring anywhere — `overflow-hidden`, `flow-root`, `card__overflow` — and `[class*='region']` likewise matches `subregion` or `region-header`. Every Layout uses the anchored `[class^='stack']`; the reference boilerplate uses a plain `.flow` class. An anchored or exact selector removes the hazard for free.

5. **`:has(> .sidebar)` has unbounded blast radius.** The selector has no anchoring class, so *any* element in the document with a `.sidebar` child — including a grid container, a `<main>`, or `<body>` — is retargeted to `display: flex; flex-wrap: wrap`. The reference implementation instead puts the class on the parent (`.sidebar > :first-child` / `> :last-child`), which is explicit and cheap. The project docs already have to warn "don't use `.sidebar` without its `:has(> .sidebar)` parent", which is a symptom of the inversion.

6. **The helper buys name-safety only, and at a maintenance price.** It validates property *names*, never values — `primitiveVars({ '--cluster-gap': 'flex-start' })` type-checks and then fails silently at computed-value time. The guarantee costs a duplicated var list per primitive plus a drift test, and rules out the two cheapest override channels the primary sources actually use (block class, data attribute). In a large codebase with many primitives and many call sites, that trade may pay for itself. In a four-component app it does not.

### 4.3 Verdict

The **parameterisation half is sound** and worth copying: `var(--knob, default)` with defaults in the primitive's own file, namespaced per primitive, no decoration in the composition layer. The **override half is not the pattern to carry over**: inline-by-default puts every layout decision at the top of the normal author cascade where no stylesheet can refine it, leaks into descendant subtrees by inheritance, and diverges from both primary sources, which override from a block class or a data attribute. The named flaws in `flow`'s size classes, the substring selectors, and the `:has()` sidebar are independent defects that should not be ported regardless of the override decision.

## 5. Recommended minimal primitive set for this app

The surface is one page: a header with a title and theme toggle, a search form with two fields and a submit button, a result card, and a history list of up to 25 rows each with re-search and delete actions. Five primitives cover all of it.

| Primitive | Used for | Notes |
| --- | --- | --- |
| `.flow` | Page sections, form field stacks, card body, list-row internals | The workhorse. `> * + * { margin-block-start: var(--flow-space, 1em) }` |
| `.cluster` | Form actions, the per-row icon button pair, header items | Wraps when narrow, no media query |
| `.repel` | Header (title left, theme toggle right), history row (label left, actions right) | Degenerate case of cluster; keep it, both shapes appear twice |
| `.wrapper` | Single page container, max-width plus gutters | Classified as a utility in CUBE; keep it in the utilities layer |
| `.region` | Vertical padding on each page section | Also a utility in the reference boilerplate, not a composition |

Add **`.switcher`** only if the city and country fields should sit side by side and stack when narrow — that is exactly the primitive's job and the form is a core surface, so it is a likely sixth. Add **`.grid`** (auto-fill) only if the result card renders its readings as tiles rather than a stacked list.

Skip: Sidebar, Cover, Frame, Reel, Imposter, Icon, Box, Center, and any recursive Stack variant. None has a call site in this app, and an unused primitive is a maintenance liability and a temptation to invent a use.

On overrides, given the sizes above: put the composition knobs on the consuming block's class in the blocks layer, as CUBE documents, and use a data attribute for anything with a genuinely closed set of values. There is no runtime-computed layout value anywhere in this app, so there is no reason to introduce an inline-style helper at all.

## 6. Placement in `@layer` ordering alongside Open Props

### 6.1 The Open Props constraint

Open Props ships **unlayered**. Its source declares tokens on `:where(html)` with no `@layer` anywhere in the package (`src/props.sizes.css`, `src/index.css`), and the documentation at <https://open-props.style/> never mentions cascade layers; the recommended import is a bare `@import "open-props/style"`.

That matters because unlayered normal declarations outrank every layered one regardless of specificity (MDN `@layer`). Imported bare, an Open Props value would beat a same-named override written inside any of your layers, and the `:where()` zero specificity does not save you. So import it *into* a layer:

```css
/* src/styles/index.css */
@layer reset, tokens, base, compositions, blocks, utilities, exceptions;

@import 'open-props/style' layer(tokens);
@import './reset.css' layer(reset);
@import './base.css' layer(base);
@import './compositions/index.css' layer(compositions);
/* … */
```

Two mechanics to respect. MDN: `@import` "must precede all other types of rules, except `@charset` and `@layer` statements (not `@layer` blocks)" — so the bare `@layer a, b, c;` ordering statement is legal above the imports and is the right place to fix the order once. And Vite resolves CSS `@import` through `postcss-import` ([Vite features docs](https://vite.dev/guide/features.html)), which supports the `layer()` form ([postcss/postcss-import#496](https://github.com/postcss/postcss-import/pull/496)), so the bare package specifier and the layer assignment both survive the build.

### 6.2 Recommended order, and where it deviates from the reference

```css
@layer reset, tokens, base, compositions, blocks, utilities, exceptions;
```

The reference boilerplate has no `@layer` at all — it manages precedence by source order in `src/css/global.css`, which reads reset → variables → global styles → **blocks → compositions → utilities**. Its blocks sit *below* compositions.

This recommendation deliberately swaps those two, for a concrete reason: once a composition declares a custom property rather than only reading it — which is exactly what a `.flow-s`-style variant or a `--threshold: 30rem` declaration does — a block that redeclares the same property on the same element is a real cascade conflict, and the block must win. Putting `blocks` above `compositions` makes that work without specificity tricks. Utilities sit above blocks because a single-job class is an explicit, local intent; `exceptions` sits last so `[data-state]` overrides win without `!important`.

The rest of the order is unremarkable: reset first so everything overrides it, tokens next so Open Props' custom properties are visible to all later layers while remaining overridable, base for element-level typography and theme wiring.

## 7. Sources

- Every Layout — [Stack](https://every-layout.dev/layouts/stack/), [Sidebar](https://every-layout.dev/layouts/sidebar/), [Switcher](https://every-layout.dev/layouts/switcher/), [Composition rudiment](https://every-layout.dev/rudiments/composition/). Cluster, Grid and Center pages confirmed paywalled.
- CUBE CSS — [Composition](https://cube.fyi/composition.html), [Utility](https://cube.fyi/utility.html).
- Set Creative Studio — [cube-boilerplate](https://github.com/Set-Creative-Studio/cube-boilerplate), `src/css/compositions/*.css`, `src/css/utilities/region.css`, `src/css/global.css`.
- Piccalilli — [The flow utility](https://piccalil.li/quick-tip/flow-utility/), [A CSS project boilerplate](https://piccalil.li/blog/a-css-project-boilerplate/).
- MDN — [`@layer`](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer), [Cascade](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Cascade), [Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties).
- Open Props — [open-props.style](https://open-props.style/), [source](https://github.com/argyleink/open-props) (`src/index.css`, `src/props.sizes.css`).
- Vite — [Features: CSS](https://vite.dev/guide/features.html). postcss-import layer support — [PR #496](https://github.com/postcss/postcss-import/pull/496).
- Local reference under review — `/Users/chuangcaleb/Documents/dev/web/powerkids-site/src/styles/compositions/`, `src/lib/primitive-vars.ts`, `docs/adr/0007-primitive-override-convention.md`.
