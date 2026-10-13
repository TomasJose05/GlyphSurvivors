// The best survival time lives in localStorage so it persists between visits.
// Every access is wrapped in try/catch: storage can be unavailable (private mode, blocked cookies,
// full quota) and the game must keep working without it.
const BEST_TIME_KEY = 'glyph-survivors.bestTime';

/** Best survival time in seconds, or 0 if there is none (or it can't be read). */
export function loadBestTime(): number {
  try {
    const raw = localStorage.getItem(BEST_TIME_KEY);
    const value = raw === null ? 0 : Number(raw);
    // Anything that isn't a positive number (corrupted or edited by hand) counts as "no record".
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

export function saveBestTime(seconds: number): void {
  try {
    localStorage.setItem(BEST_TIME_KEY, String(seconds));
  } catch {
    // Storage is unavailable: the record simply won't persist this time.
  }
}
