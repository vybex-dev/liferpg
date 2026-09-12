import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BentoGrid,
  BentoHeroArea,
  BentoStreakArea,
  BentoGoldArea,
  BentoAttrsArea,
  BentoTasksArea,
} from "@/components/bento/BentoGrid";
import { HeroCard } from "@/components/bento/HeroCard";
import { StreakCard } from "@/components/bento/StreakCard";
import { GoldCard } from "@/components/bento/GoldCard";
import { AttributeRow } from "@/components/bento/AttributeRow";
import { TaskListCard } from "@/components/bento/TaskListCard";
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
      .select("id, username, level, current_xp, gold, streak_count, last_active_date")
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
    <BentoGrid>
      <BentoHeroArea>
        <HeroCard
          username={profile.username}
          level={profile.level}
          currentXp={profile.current_xp}
        />
      </BentoHeroArea>

      <BentoStreakArea>
        <StreakCard streakCount={profile.streak_count} />
      </BentoStreakArea>

      <BentoGoldArea>
        <GoldCard gold={profile.gold} />
      </BentoGoldArea>

      <BentoAttrsArea>
        <AttributeRow attributes={attributes} />
      </BentoAttrsArea>

      <BentoTasksArea>
        <TaskListCard initialTasks={tasks} />
      </BentoTasksArea>
    </BentoGrid>
  );
}
