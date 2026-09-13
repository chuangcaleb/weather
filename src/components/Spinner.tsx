/**
 * The app's single loading affordance. Decorative on purpose: pending states are
 * never announced, only success and error transitions are.
 */
export function Spinner() {
  return (
    <div className="spinner" data-testid="spinner" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <circle cx="12" cy="12" r="9" opacity="0.25" />
        <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
      </svg>
    </div>
  );
}
