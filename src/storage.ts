// Records and the last chosen character live in localStorage so they persist between visits.
// Every access is wrapped in try/catch: storage can be unavailable (private mode, blocked cookies,
// full quota) and the game must keep working without it.
const BEST_TIME_PREFIX = 'glyph-survivors.bestTime';
const LEGACY_BEST_KEY = 'glyph-survivors.bestTime'; // from before there were several characters
const CHARACTER_KEY = 'glyph-survivors.character';

function readSeconds(key: string): number {
  const raw = localStorage.getItem(key);
  const value = raw === null ? 0 : Number(raw);
  // Anything that isn't a positive number (corrupted or edited by hand) counts as "no record".
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** Best survival time in seconds for one character, or 0 if there is none (or it can't be read). */
export function loadBestTime(characterId: string): number {
  try {
    const own = readSeconds(`${BEST_TIME_PREFIX}.${characterId}`);
    // Records made before characters existed were all played with the first one.
    if (own === 0 && characterId === 'wanderer') return readSeconds(LEGACY_BEST_KEY);
    return own;
  } catch {
    return 0;
  }
}

export function saveBestTime(characterId: string, seconds: number): void {
  try {
    localStorage.setItem(`${BEST_TIME_PREFIX}.${characterId}`, String(seconds));
  } catch {
    // Storage is unavailable: the record simply won't persist this time.
  }
}

/** The id of the character picked last time, or null. */
export function loadLastCharacter(): string | null {
  try {
    return localStorage.getItem(CHARACTER_KEY);
  } catch {
    return null;
  }
}

export function saveLastCharacter(characterId: string): void {
  try {
    localStorage.setItem(CHARACTER_KEY, characterId);
  } catch {
    // Not remembering the choice is harmless.
  }
}
