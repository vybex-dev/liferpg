import type { AttributeName } from "./types";

/**
 * Mirrors the `case` mapping inside `complete_task` in
 * supabase/phase3_game_logic.sql EXACTLY. Kept here instead of
 * duplicated inline so the client-side optimistic preview (see
 * DashboardShell's handleCompleteTask) always predicts the same
 * attribute the server will actually award XP to. If this map and
 * the SQL `case` statement ever drift apart, the optimistic guess
 * would briefly highlight the wrong attribute card for a frame —
 * the numbers would still self-correct once the server responds,
 * but keeping them in sync avoids that flicker entirely.
 *
 * Any category not covered here (or a null/empty category) falls
 * back to "Discipline", exactly like the SQL's `else` branch.
 */
const CATEGORY_TO_ATTRIBUTE: Record<string, AttributeName> = {
  strength: "Strength",
  fitness: "Strength",
  exercise: "Strength",
  workout: "Strength",
  physical: "Strength",
  intellect: "Intellect",
  intelligence: "Intellect",
  learning: "Intellect",
  study: "Intellect",
  reading: "Intellect",
  work: "Intellect",
  discipline: "Discipline",
  habit: "Discipline",
  chore: "Discipline",
  chores: "Discipline",
  finance: "Discipline",
  charisma: "Charisma",
  social: "Charisma",
  relationships: "Charisma",
  networking: "Charisma",
  vitality: "Vitality",
  health: "Vitality",
  sleep: "Vitality",
  nutrition: "Vitality",
  wellness: "Vitality",
};

export function categoryToAttributeName(
  category: string | null | undefined
): AttributeName {
  if (!category) return "Discipline";
  return CATEGORY_TO_ATTRIBUTE[category.toLowerCase()] ?? "Discipline";
}
