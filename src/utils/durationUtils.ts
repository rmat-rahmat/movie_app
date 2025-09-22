/**
 * Format duration value into human-readable string
 * @param duration - Duration value (could be in seconds or milliseconds)
 * @returns Formatted duration string like "1h 30m" or "45m" or "N/A"
 */
export function formatDuration(duration: number | string | undefined | null): string {
  const raw = Number(duration);
  if (!raw || isNaN(raw)) return 'N/A';

  // treat large values as milliseconds (e.g. 3600000). If it's small, assume seconds.
  const ms = raw > 10000 ? raw : raw * 1000;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}
