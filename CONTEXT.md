# Weather

Single-page weather lookup app: search form, result card, search history.

## Language

**Composition**:
A layout primitive that arranges children (spacing, wrapping, alignment) and carries no color, font, or decoration. One of CUBE CSS's four layers. Not to be confused with React "composing components" — this term is CSS-layer-specific.
_Avoid_: layout helper, primitive class (when the CUBE-layer meaning is intended, say "composition")

**Utility**:
A CSS class that does exactly one job (e.g. `.wrapper` sets max-width and inline padding) and nothing else. Distinct from a composition: a utility has no configurable knob, a composition does.
_Avoid_: helper class

**Gutter**:
The single shared, inheritable `--gutter` custom property that every composition primitive reads for its spacing. Setting it on an ancestor retunes every nested primitive beneath it.
_Avoid_: spacing var, gap variable
