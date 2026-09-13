// Custom stylelint rule: enforce the exact top-level `@layer` statement order.
//
// Decided in issue #6 / docs/agents/coding-standards/css.md — no maintained
// third-party plugin (stylelint-order, stylelint-plugin-defensive-css, etc.)
// checks *order* of a bare `@layer` statement, only property/selector order
// or "is a rule inside a layer at all". This rule closes that gap.
//
// It only looks at bare `@layer` statements (no `{ }` block) — the
// declaration form used once in src/styles/index.css to fix cascade order.
// `@layer name { ... }` blocks are untouched (that's what
// defensive-css/require-at-layer checks).
import stylelint from 'stylelint';

const { createPlugin, utils } = stylelint;

const ruleName = 'weather/layer-order';

const EXPECTED_ORDER = [
  'reset',
  'tokens',
  'base',
  'compositions',
  'blocks',
  'utilities',
  'exceptions',
];

const messages = utils.ruleMessages(ruleName, {
  rejected: (expected, actual) =>
    `Expected "@layer ${expected};" but found "@layer ${actual};" (see docs/agents/coding-standards/css.md for the fixed layer order)`,
});

const meta = {
  url: 'internal:stylelint/rules/layer-order',
};

/** @type {import('stylelint').Rule} */
const ruleFunction = (primary) => {
  return (root, result) => {
    const validOptions = utils.validateOptions(result, ruleName, {
      actual: primary,
      possible: [true],
    });

    if (!validOptions) return;

    root.walkAtRules('layer', (atRule) => {
      // A bare statement has no block. `@layer name { ... }` has `nodes`.
      if (atRule.nodes !== undefined) return;

      const actualNames = atRule.params
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);
      const expected = EXPECTED_ORDER.join(', ');
      const actual = actualNames.join(', ');

      if (actual !== expected) {
        utils.report({
          message: messages.rejected(expected, actual),
          node: atRule,
          result,
          ruleName,
        });
      }
    });
  };
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = meta;

export default createPlugin(ruleName, ruleFunction);
