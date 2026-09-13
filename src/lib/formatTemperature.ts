/** Readings are metric-only (the proxy pins `units=metric`), so the unit is fixed. */
export function formatTemperature(temperatureC: number): string {
  // `Math.round(-0.2)` is `-0`, which stringifies as "-0" — normalise it away.
  const degrees = Math.round(temperatureC) + 0;
  return `${degrees}°C`;
}
