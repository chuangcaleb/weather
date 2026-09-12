---
status: accepted
---

# CSS primitive overrides go through a block class, not inline style or data attribute

Composition primitives (`flow`, `cluster`, `grid`, `switcher`, `repel`) expose config as `var(--name, default)`. A consuming component needs to override that default

We should not override with an inline `style` custom property, escalating to a CSS class only for media queries, pseudo-classes, or structural selectors. We reject that default direction.

Normal inline styles beat every normal author declaration regardless of specificity or layer — an inline override is already at the ceiling of the cascade, so nothing later (a container query, a state selector, a higher layer) can refine it without `!important`. It also inherits into the whole subtree, so `style={{ '--flow-space': 0 }}` on a card silently zeroes any nested `.flow` too. A class-based override has neither failure mode and can still be escalated to a query or state selector later — the asymmetry runs the opposite direction from powerkids' default.

**Decision:** overrides are a block-class declaration in the `blocks` layer (`.result-card { --gutter: var(--size-2); }`), per CUBE's own documented pattern. Data-attribute variants (`[data-layout='halves']`) are reserved for a primitive with more than one closed-set configuration — none of the five primitives in this app currently has one. No inline-style override helper: this app has no runtime-computed layout value to justify the one-way-door cost.

See [every-layout-primitives.md §3–4](../research/every-layout-primitives.md) for the full cascade analysis and the powerkids review this decision responds to.
