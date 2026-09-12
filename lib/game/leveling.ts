/**
 * Client-side mirror of the leveling formula used in
 * supabase/phase3_game_logic.sql (xp_to_next_level).
 *
 * DISPLAY PURPOSES ONLY. Nothing in this file ever awards XP,
 * gold, or levels — that only ever happens inside the
 * `complete_task` Postgres function, run server-side via RPC.
 * This exists so the UI can render progress bars, "X XP to next
 * level" copy, and optimistic previews without a round trip.
 *
 * If you change the exponent/multiplier here, change it in
 * xp_to_next_level() in the SQL file too — they must stay in sync
 * or the client's progress bar will drift from the server's truth.
 */

/** XP required to go from `level` to `level + 1`. */
export function xpToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export type LevelProgress = {
  level: number;
  currentXp: number;
  xpToNext: number;
  /** 0–1 progress through the current level, for a progress bar. */
  progress: number;
};

/**
 * Given a level and the XP banked *within* that level (i.e. what's
 * stored in profiles.current_xp / attributes.xp after the server's
 * loop has already rolled over any completed levels), returns the
 * numbers a progress UI needs.
 */
export function getLevelProgress(level: number, currentXp: number): LevelProgress {
  const xpToNext = xpToNextLevel(level);
  const clampedXp = Math.max(0, Math.min(currentXp, xpToNext));
  return {
    level,
    currentXp: clampedXp,
    xpToNext,
    progress: xpToNext === 0 ? 0 : clampedXp / xpToNext,
  };
}

/**
 * Preview-only helper: given a starting level/XP and an XP amount
 * about to be awarded, simulate how many levels it WOULD gain and
 * what the resulting level/XP WOULD be — for optimistic UI (e.g.
 * "this task will level you up!") before the server confirms it.
 *
 * This must never be used to actually set a user's level or XP.
 * The server's `complete_task` RPC is the only source of truth.
 */
export function previewXpGain(
  level: number,
  currentXp: number,
  xpGained: number
): { level: number; currentXp: number; leveledUp: boolean } {
  let simLevel = level;
  let simXp = currentXp + Math.max(0, xpGained);
  let leveledUp = false;

  while (simXp >= xpToNextLevel(simLevel)) {
    simXp -= xpToNextLevel(simLevel);
    simLevel += 1;
    leveledUp = true;
  }

  return { level: simLevel, currentXp: simXp, leveledUp };
}
