"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

const DASHBOARD_PATH = "/dashboard";

const VALID_CATEGORIES = [
  "strength",
  "fitness",
  "exercise",
  "workout",
  "physical",
  "intellect",
  "intelligence",
  "learning",
  "study",
  "reading",
  "work",
  "discipline",
  "habit",
  "chore",
  "chores",
  "finance",
  "charisma",
  "social",
  "relationships",
  "networking",
  "vitality",
  "health",
  "sleep",
  "nutrition",
  "wellness",
] as const;

/**
 * Maps a raw Postgres/PostgREST error to user-facing copy.
 * Mirrors the tone of mapAuthError in app/actions/auth.ts.
 */
function mapTaskError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes("already completed")) {
    return "That task is already marked complete.";
  }
  if (m.includes("task not found")) {
    return "That task doesn't exist or isn't yours.";
  }
  if (m.includes("not authenticated")) {
    return "Your session expired. Please log in again.";
  }
  if (m.includes("item already owned")) {
    return "You already own that item.";
  }
  if (m.includes("not enough gold")) {
    return "You don't have enough gold for that.";
  }
  if (m.includes("item not found")) {
    return "That item doesn't exist.";
  }
  if (m.includes("item not owned")) {
    return "You need to own that item before you can equip it.";
  }
  if (m.includes("not equippable")) {
    return "That item can't be equipped.";
  }

  return message;
}

// ------------------------------------------------------------
// createTask
// ------------------------------------------------------------
export type CreateTaskInput = {
  title: string;
  category?: string | null;
  xpReward?: number;
};

export async function createTask(
  input: CreateTaskInput
): Promise<ActionResult<{ id: string }>> {
  const title = input.title?.trim();
  if (!title) {
    return { success: false, error: "Give the task a title." };
  }
  if (title.length > 200) {
    return { success: false, error: "Titles need to be under 200 characters." };
  }

  const xpReward = input.xpReward ?? 10;
  if (!Number.isInteger(xpReward) || xpReward < 1 || xpReward > 10000) {
    return { success: false, error: "XP reward must be a whole number between 1 and 10000." };
  }

  const category = input.category?.trim().toLowerCase() || null;
  if (category && !VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])) {
    return {
      success: false,
      error: `Category must be one of: ${VALID_CATEGORIES.join(", ")}.`,
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Your session expired. Please log in again." };
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title,
      category,
      xp_reward: xpReward,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: mapTaskError(error.message) };
  }

  revalidatePath(DASHBOARD_PATH);
  return { success: true, data: { id: data.id } };
}

// ------------------------------------------------------------
// updateTask
// ------------------------------------------------------------
export type UpdateTaskInput = {
  taskId: string;
  title?: string;
  category?: string | null;
  xpReward?: number;
};

export async function updateTask(input: UpdateTaskInput): Promise<ActionResult> {
  if (!input.taskId) {
    return { success: false, error: "Missing task id." };
  }

  const updates: Record<string, unknown> = {};

  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title) {
      return { success: false, error: "Title can't be empty." };
    }
    if (title.length > 200) {
      return { success: false, error: "Titles need to be under 200 characters." };
    }
    updates.title = title;
  }

  if (input.category !== undefined) {
    const category = input.category?.trim().toLowerCase() || null;
    if (category && !VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])) {
      return {
        success: false,
        error: `Category must be one of: ${VALID_CATEGORIES.join(", ")}.`,
      };
    }
    updates.category = category;
  }

  if (input.xpReward !== undefined) {
    if (!Number.isInteger(input.xpReward) || input.xpReward < 1 || input.xpReward > 10000) {
      return { success: false, error: "XP reward must be a whole number between 1 and 10000." };
    }
    updates.xp_reward = input.xpReward;
  }

  if (Object.keys(updates).length === 0) {
    return { success: false, error: "Nothing to update." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Your session expired. Please log in again." };
  }

  // Note: XP/level/gold/streak are NEVER touched here — only the
  // complete_task RPC can mutate those. This action only edits the
  // task's own descriptive fields, and RLS (auth.uid() = user_id)
  // guarantees a user can only ever update their own row.
  const { error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", input.taskId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: mapTaskError(error.message) };
  }

  revalidatePath(DASHBOARD_PATH);
  return { success: true, data: undefined };
}

// ------------------------------------------------------------
// deleteTask
// ------------------------------------------------------------
export async function deleteTask(taskId: string): Promise<ActionResult> {
  if (!taskId) {
    return { success: false, error: "Missing task id." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Your session expired. Please log in again." };
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: mapTaskError(error.message) };
  }

  revalidatePath(DASHBOARD_PATH);
  return { success: true, data: undefined };
}

// ------------------------------------------------------------
// completeTask
//
// This is the ONLY path by which a task can be marked complete
// and XP/level/gold/streak can change. It does nothing but call
// the server-side `complete_task` RPC — all game math happens in
// Postgres (supabase/phase3_game_logic.sql), inside one atomic
// transaction with row locking, so there is no client-trusted
// input here and no way to double-award via a double-click or a
// forged client request.
// ------------------------------------------------------------
export type CompleteTaskResult = {
  newLevel: number;
  newCurrentXp: number;
  newGold: number;
  newStreakCount: number;
  attributeName: string;
  attributeNewLevel: number;
  attributeNewXp: number;
};

export async function completeTask(
  taskId: string
): Promise<ActionResult<CompleteTaskResult>> {
  if (!taskId) {
    return { success: false, error: "Missing task id." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Your session expired. Please log in again." };
  }

  const { data, error } = await supabase
    .rpc("complete_task", { task_id: taskId })
    .single();

  if (error) {
    return { success: false, error: mapTaskError(error.message) };
  }

  const row = data as {
    new_level: number;
    new_current_xp: number;
    new_gold: number;
    new_streak_count: number;
    attribute_name: string;
    attribute_new_level: number;
    attribute_new_xp: number;
  };

  revalidatePath(DASHBOARD_PATH);

  return {
    success: true,
    data: {
      newLevel: row.new_level,
      newCurrentXp: row.new_current_xp,
      newGold: row.new_gold,
      newStreakCount: row.new_streak_count,
      attributeName: row.attribute_name,
      attributeNewLevel: row.attribute_new_level,
      attributeNewXp: row.attribute_new_xp,
    },
  };
}

// ------------------------------------------------------------
// purchaseItem
//
// Like completeTask, this only calls the server-side
// `purchase_item` RPC — gold balance is checked and decremented
// entirely in Postgres, inside one atomic transaction with a row
// lock on the profile, so a double-click (or two tabs open at
// once) can't spend gold the user doesn't have.
// ------------------------------------------------------------
export type PurchaseItemResult = {
  newGold: number;
  purchasedItemId: string;
};

export async function purchaseItem(
  itemId: string
): Promise<ActionResult<PurchaseItemResult>> {
  if (!itemId) {
    return { success: false, error: "Missing item id." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Your session expired. Please log in again." };
  }

  const { data, error } = await supabase
    .rpc("purchase_item", { item_id: itemId })
    .single();

  if (error) {
    return { success: false, error: mapTaskError(error.message) };
  }

  const row = data as { new_gold: number; purchased_item_id: string };

  revalidatePath(DASHBOARD_PATH);

  return {
    success: true,
    data: {
      newGold: row.new_gold,
      purchasedItemId: row.purchased_item_id,
    },
  };
}

// ------------------------------------------------------------
// equipItem
//
// Toggles an owned `title` or `aura` item into (or out of) its
// slot on the caller's profile. Like completeTask/purchaseItem,
// this only calls the server-side `equip_item` RPC — ownership and
// item-type checks happen entirely in Postgres (see
// supabase/phase6_equip_items.sql), so there's no client-trusted
// input here.
// ------------------------------------------------------------
export type EquipItemResult = {
  equippedTitle: string | null;
  equippedAura: string | null;
};

export async function equipItem(
  itemId: string
): Promise<ActionResult<EquipItemResult>> {
  if (!itemId) {
    return { success: false, error: "Missing item id." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Your session expired. Please log in again." };
  }

  const { data, error } = await supabase
    .rpc("equip_item", { item_id: itemId })
    .single();

  if (error) {
    return { success: false, error: mapTaskError(error.message) };
  }

  const row = data as { equipped_title: string | null; equipped_aura: string | null };

  revalidatePath(DASHBOARD_PATH);

  return {
    success: true,
    data: {
      equippedTitle: row.equipped_title,
      equippedAura: row.equipped_aura,
    },
  };
}
