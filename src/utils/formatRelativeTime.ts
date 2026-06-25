const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function formatRelativeTime(isoDate: string, now = Date.now()): string {
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) return 'just now';

  const delta = Math.max(0, now - timestamp);

  if (delta < MINUTE_MS) return 'just now';
  if (delta < HOUR_MS) {
    const minutes = Math.floor(delta / MINUTE_MS);
    return `${minutes} min ago`;
  }
  if (delta < DAY_MS) {
    const hours = Math.floor(delta / HOUR_MS);
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }

  const days = Math.floor(delta / DAY_MS);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}
