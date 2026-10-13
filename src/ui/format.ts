/** Seconds as `mm:ss`, e.g. 83.9 -> "01:23". Minutes keep growing past 99 rather than wrapping. */
export function formatTime(seconds: number): string {
  const total = Math.floor(seconds);
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}
