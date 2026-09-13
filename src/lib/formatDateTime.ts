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

export function formatDateTime(value: string | number): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return formatter.format(date);
}
