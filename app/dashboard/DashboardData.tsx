import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type { Attribute, Profile, Task } from "@/lib/game/types";

export async function DashboardData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profileRes, attributesRes, tasksRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, username, level, current_xp, gold, streak_count, last_active_date, equipped_title, equipped_aura"
      )
      .eq("id", user.id)
      .single(),
    supabase
      .from("attributes")
      .select("id, name, level, xp")
      .eq("user_id", user.id),
    supabase
      .from("tasks")
      .select("id, title, category, xp_reward, is_completed, completed_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (profileRes.error || !profileRes.data) {
    // The signup trigger (see supabase/phase2_auth_trigger.sql) always
    // creates a profile row, so this only happens if that failed —
    // surface it plainly rather than rendering a broken dashboard.
    throw new Error(
      profileRes.error?.message ?? "Couldn't load your profile."
    );
  }

  const profile = profileRes.data as Profile;
  const attributes = (attributesRes.data ?? []) as Attribute[];
  const tasks = (tasksRes.data ?? []) as Task[];

  return (
    <DashboardShell
      username={profile.username}
      initialProfile={profile}
      initialAttributes={attributes}
      initialTasks={tasks}
    />
  );
}
