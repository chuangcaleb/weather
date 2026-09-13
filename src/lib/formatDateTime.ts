// Locale is pinned rather than left to the browser: the app has one language,
// and a day-first, 24-hour stamp reads the same for every user of it.
const formatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** Takes the ISO-8601 stamp every `requestedAt` in the app carries. */
export function formatDateTime(requestedAt: string): string {
  const date = new Date(requestedAt);
  if (Number.isNaN(date.getTime())) return '';
  return formatter.format(date);
}
