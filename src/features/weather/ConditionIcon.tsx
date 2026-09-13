type Props = {
  /** OpenWeather's condition group, e.g. `Clouds`, `Rain`, `Clear`. */
  summary: string;
};

/**
 * Labelled by summary.
 * `Clear` gets the sun and every other condition group reads as cloud.
 */
export function ConditionIcon({ summary }: Props) {
  const src = summary === 'Clear' ? '/icons/sun.png' : '/icons/cloud.png';
  return <img className="condition-icon" src={src} alt={summary} />;
}
