// Stylelint config: enforces the CSS layer order decided in issue #6
// (docs/agents/coding-standards/css.md) and catches rules declared outside
// any `@layer` block.
//
// Two mechanisms, because no single maintained plugin covers both:
// - `weather/layer-order` (local, ./stylelint/rules/layer-order.mjs): the
//   bare `@layer reset, tokens, ...;` statement must match the decided order
//   exactly. stylelint-order's `order/order` does not understand `@layer`
//   at all (checked against its README/source as of the plugin picked here).
// - `defensive-css/require-at-layer` (stylelint-plugin-defensive-css):
//   every style rule must sit inside a top-level `@layer` block, restricted
//   to the seven canonical names — catches unlayered rules AND typo'd/rogue
//   layer names.
//
// Gap: neither rule enforces where a *named* `@layer name { ... }` block
// appears relative to others (only the bare statement's order, and whether
// each rule is in a known layer). That's an acceptable gap for now — the
// bare statement is what fixes cascade order in CSS; block placement is
// cosmetic once the statement exists.
import defensiveCss from 'stylelint-plugin-defensive-css';

export default {
  plugins: ['./stylelint/rules/layer-order.mjs', defensiveCss],
  rules: {
    'weather/layer-order': true,
    'defensive-css/require-at-layer': [
      true,
      {
        supportedLayerNames: [
          'reset',
          'tokens',
          'base',
          'compositions',
          'blocks',
          'utilities',
          'exceptions',
        ],
      },
    ],
  },
};
