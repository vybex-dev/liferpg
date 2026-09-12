export type Profile = {
  id: string;
  username: string;
  level: number;
  current_xp: number;
  gold: number;
  streak_count: number;
  last_active_date: string | null;
  /** Name of the currently equipped `title`-type item, or null. */
  equipped_title: string | null;
  /** Name of the currently equipped `aura`-type item, or null. */
  equipped_aura: string | null;
};

export type Attribute = {
  id: string;
  name: string;
  level: number;
  xp: number;
};

export type Task = {
  id: string;
  title: string;
  category: string | null;
  xp_reward: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
};

/**
 * The five attribute tracks the game awards XP into. Kept in this
 * fixed order and fixed set so the attribute row always renders in
 * the same layout regardless of which rows exist yet in the DB —
 * a brand-new profile has zero attribute rows until its first
 * completed task creates one (see complete_task in
 * supabase/phase3_game_logic.sql).
 */
export const ATTRIBUTE_ORDER = [
  "Strength",
  "Intellect",
  "Discipline",
  "Charisma",
  "Vitality",
] as const;

export type AttributeName = (typeof ATTRIBUTE_ORDER)[number];

/** A row from the global `items` catalog (see supabase/schema.sql). */
export type ShopItem = {
  id: string;
  name: string;
  cost: number;
  type: string;
};

export const TASK_CATEGORIES = [
  { value: "strength", label: "Strength" },
  { value: "intellect", label: "Intellect" },
  { value: "discipline", label: "Discipline" },
  { value: "charisma", label: "Charisma" },
  { value: "vitality", label: "Vitality" },
] as const;
