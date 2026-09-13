# Build Spec

Everything a fresh session needs to build the weather app end to end, without reopening a decision. Every claim traces to a closed ticket on [Map: Weather app — from blank repo to build-ready spec](https://github.com/chuangcaleb/weather/issues/1) or its linked research/coding-standard doc. See [stated-assumptions.md](stated-assumptions.md) for the calls made where the requirements were silent.

Split into phases so a build session reads only its own file, not this whole spec. Read one phase file at a time.

| Phase | File | Covers | Blocked by |
| --- | --- | --- | --- |
| 1 | [Scaffold and tooling](build-spec/01-scaffold.md) | stack, file layout, CI | — |
| 2 | [CSS architecture](build-spec/02-css.md) | layers, primitives | — |
| 3 | [API, domain, state](build-spec/03-api-domain-state.md) | proxy, types, reducer | — |
| 4 | [Components and UI](build-spec/04-components.md) | state-to-UI, component inventory | phase 3 |
| 5 | [Tests](build-spec/05-tests.md) | coverage bar, above-floor tests | phases 3, 4 |

Phases 1 and 2 have no cross-dependency, run in either order.
