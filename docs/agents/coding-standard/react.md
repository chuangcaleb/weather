# React

- Function components only.
- Type props inline or as a local `Props` type, destructured in the signature.
- Rules of Hooks hold everywhere — `eslint-plugin-react-hooks` runs error-level, never disabled inline.
- Derive state from props. Reach for `useEffect` only for subscriptions and imperative escape hatches — not to mirror a prop into state, and not for fetching (see `coding-standard/data-fetching.md`) or event responses.
- Split a component once it both fetches and renders complex markup — keep each one small and single-purpose.
- Accessible markup: semantic elements, labelled controls, keyboard-reachable interactions. `jsx-a11y` errors are real bugs.
- Pick one styling approach and stay in it across the repo; inline `style` only for genuinely dynamic values.
