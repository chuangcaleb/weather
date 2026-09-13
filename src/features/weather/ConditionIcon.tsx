type Props = {
  /** OpenWeather's condition group, e.g. `Clouds`, `Rain`, `Clear`. */
  summary: string;
};

function Sun() {
  return (
    <>
      <circle cx="34" cy="30" r="13" />
      <path d="M34 9v7M34 44v7M13 30h7M48 30h7M19 15l5 5M44 40l5 5M49 15l-5 5M24 40l-5 5" />
    </>
  );
}

function Cloud() {
  return (
    <path d="M28 62h34a13 13 0 0 0 1-26 19 19 0 0 0-36-5 12 12 0 0 0 1 31z" />
  );
}

function Drops() {
  return <path d="M30 70l-3 8M45 70l-3 8M60 70l-3 8" />;
}

function Bolt() {
  return <path d="M44 66l-9 12h10l-7 11" />;
}

function Flakes() {
  return (
    <path d="M30 70v9M26 73l8 4M34 73l-8 4M54 70v9M50 73l8 4M58 73l-8 4" />
  );
}

function Haze() {
  return <path d="M18 44h40M24 54h34M30 64h28" />;
}

function conditionShapes(summary: string) {
  switch (summary) {
    case 'Clear':
      return <Sun />;
    case 'Rain':
    case 'Drizzle':
      return (
        <>
          <Cloud />
          <Drops />
        </>
      );
    case 'Thunderstorm':
      return (
        <>
          <Cloud />
          <Bolt />
        </>
      );
    case 'Snow':
      return (
        <>
          <Cloud />
          <Flakes />
        </>
      );
    case 'Mist':
    case 'Fog':
    case 'Haze':
    case 'Smoke':
    case 'Dust':
    case 'Sand':
    case 'Ash':
      return <Haze />;
    case 'Clouds':
      return <Cloud />;
    default:
      // Squall, Tornado, and anything OpenWeather adds later: a cloud reads as
      // "weather happened" without claiming a condition the app cannot name.
      return <Cloud />;
  }
}

/**
 * Breaks through the card's top edge — see `blocks/result-card.css`. Labelled by
 * the summary, which the card also renders as text.
 */
export function ConditionIcon({ summary }: Props) {
  return (
    <svg
      className="condition-icon"
      viewBox="0 0 88 88"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={summary}
    >
      {conditionShapes(summary)}
    </svg>
  );
}
