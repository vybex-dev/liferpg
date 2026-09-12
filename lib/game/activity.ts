import { previewGoldReward } from "@/lib/game/leveling";
import type { Task } from "@/lib/game/types";

export type DailyPoint = {
  /** "Y-M-D" local-date key, used only for grouping. */
  key: string;
  /** Single-letter weekday label (S M T W T F S) for the axis. */
  label: string;
  value: number;
  isToday: boolean;
};

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * Returns the last 7 calendar days (local time), oldest first,
 * today last — the fixed x-axis both mini charts below bucket
 * their values into.
 */
function lastSevenDays(): { key: string; label: string; isToday: boolean }[] {
  const days: { key: string; label: string; isToday: boolean }[] = [];
  const today = new Date();

  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(today);
    d.setDate(today.getDate() - offset);
    days.push({
      key: localDateKey(d),
      label: WEEKDAY_INITIALS[d.getDay()],
      isToday: offset === 0,
    });
  }

  return days;
}

/**
 * Buckets completed tasks into the last 7 days, summing whatever
 * `valueForTask` returns for each task completed on that day.
 * Tasks with no `completed_at` (never finished) or outside the
 * 7-day window are ignored. Purely a display aggregation — it
 * never reads or writes anything the game logic depends on.
 */
function buildDailySeries(
  tasks: Task[],
  valueForTask: (task: Task) => number
): DailyPoint[] {
  const days = lastSevenDays();
  const totals = new Map<string, number>(days.map((d) => [d.key, 0]));

  for (const task of tasks) {
    if (!task.is_completed || !task.completed_at) continue;
    const key = localDateKey(new Date(task.completed_at));
    if (!totals.has(key)) continue; // outside the 7-day window
    totals.set(key, (totals.get(key) ?? 0) + valueForTask(task));
  }

  return days.map((d) => ({
    ...d,
    value: totals.get(d.key) ?? 0,
  }));
}

/** Number of tasks completed per day, for the streak activity chart. */
export function buildCompletionSeries(tasks: Task[]): DailyPoint[] {
  return buildDailySeries(tasks, () => 1);
}

/** Gold earned per day (mirrors the server's gold formula), for the gold chart. */
export function buildGoldSeries(tasks: Task[]): DailyPoint[] {
  return buildDailySeries(tasks, (task) => previewGoldReward(task.xp_reward));
}
