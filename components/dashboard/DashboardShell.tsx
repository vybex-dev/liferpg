"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BentoAttrsArea,
  BentoGoldArea,
  BentoGrid,
  BentoHeroArea,
  BentoStreakArea,
  BentoTasksArea,
} from "@/components/bento/BentoGrid";
import { HeroCard } from "@/components/bento/HeroCard";
import { StreakCard } from "@/components/bento/StreakCard";
import { GoldCard } from "@/components/bento/GoldCard";
import { AttributeRow } from "@/components/bento/AttributeRow";
import { TaskListCard } from "@/components/bento/TaskListCard";
import { LevelUpModal } from "@/components/game/LevelUpModal";
import { ErrorToast } from "@/components/ui/ErrorToast";
import {
  completeTask,
  createTask,
  deleteTask,
  type CreateTaskInput,
} from "@/app/actions/tasks";
import {
  previewGoldReward,
  previewStreak,
  previewXpGain,
} from "@/lib/game/leveling";
import { categoryToAttributeName } from "@/lib/game/category-map";
import type { Attribute, Profile, Task } from "@/lib/game/types";

type LiveProfile = {
  level: number;
  current_xp: number;
  gold: number;
  streak_count: number;
  last_active_date: string | null;
};

type DashboardShellProps = {
  username: string;
  initialProfile: Profile;
  initialAttributes: Attribute[];
  initialTasks: Task[];
};

const TOAST_DURATION_MS = 5000;

export function DashboardShell({
  username,
  initialProfile,
  initialAttributes,
  initialTasks,
}: DashboardShellProps) {
  const [profile, setProfile] = useState<LiveProfile>({
    level: initialProfile.level,
    current_xp: initialProfile.current_xp,
    gold: initialProfile.gold,
    streak_count: initialProfile.streak_count,
    last_active_date: initialProfile.last_active_date,
  });
  const [attributes, setAttributes] = useState<Attribute[]>(initialAttributes);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  async function handleCreateTask(input: CreateTaskInput) {
    const result = await createTask(input);

    if (result.success) {
      setTasks((prev) => [
        {
          id: result.data.id,
          title: input.title.trim(),
          category: input.category ?? null,
          xp_reward: input.xpReward ?? 10,
          is_completed: false,
          completed_at: null,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    }

    return result;
  }

  async function handleDeleteTask(taskId: string) {
    const snapshot = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    const result = await deleteTask(taskId);
    if (!result.success) {
      setTasks(snapshot);
      showToast(result.error);
    }
  }

  async function handleCompleteTask(task: Task) {
    if (task.is_completed || pendingTaskId) return;

    setPendingTaskId(task.id);

    // Snapshot everything up front so a failed request can roll
    // the task, profile, AND attribute state back together — no
    // partially-applied optimistic state left behind.
    const prevTasks = tasks;
    const prevProfile = profile;
    const prevAttributes = attributes;
    const levelBeforeThisAction = profile.level;

    const attrName = categoryToAttributeName(task.category);
    const currentAttr = attributes.find((a) => a.name === attrName);
    const attrLevel = currentAttr?.level ?? 1;
    const attrXp = currentAttr?.xp ?? 0;

    const profilePreview = previewXpGain(
      profile.level,
      profile.current_xp,
      task.xp_reward
    );
    const attrPreview = previewXpGain(attrLevel, attrXp, task.xp_reward);
    const goldPreview = previewGoldReward(task.xp_reward);
    const streakPreview = previewStreak(
      profile.last_active_date,
      profile.streak_count
    );

    // ---- Optimistic update ----
    // This is what makes the checkbox, the hero XP bar, the gold
    // counter, and the attribute bar all move the instant the
    // person clicks — well before complete_task's round trip.
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, is_completed: true, completed_at: new Date().toISOString() }
          : t
      )
    );
    setProfile((p) => ({
      ...p,
      level: profilePreview.level,
      current_xp: profilePreview.currentXp,
      gold: p.gold + goldPreview,
      streak_count: streakPreview,
    }));
    setAttributes((prev) => {
      const exists = prev.some((a) => a.name === attrName);
      if (exists) {
        return prev.map((a) =>
          a.name === attrName
            ? { ...a, level: attrPreview.level, xp: attrPreview.currentXp }
            : a
        );
      }
      return [
        ...prev,
        {
          id: `optimistic-${attrName}`,
          name: attrName,
          level: attrPreview.level,
          xp: attrPreview.currentXp,
        },
      ];
    });

    const result = await completeTask(task.id);

    if (!result.success) {
      // ---- Rollback ----
      setTasks(prevTasks);
      setProfile(prevProfile);
      setAttributes(prevAttributes);
      showToast(result.error);
      setPendingTaskId(null);
      return;
    }

    const reward = result.data;

    // ---- Reconcile with the server's authoritative numbers ----
    // These are the only values that were actually written to the
    // database, so they win over the optimistic guess above.
    setProfile((p) => ({
      ...p,
      level: reward.newLevel,
      current_xp: reward.newCurrentXp,
      gold: reward.newGold,
      streak_count: reward.newStreakCount,
      last_active_date: new Date().toISOString().slice(0, 10),
    }));
    setAttributes((prev) => {
      const exists = prev.some((a) => a.name === reward.attributeName);
      if (exists) {
        return prev.map((a) =>
          a.name === reward.attributeName
            ? { ...a, level: reward.attributeNewLevel, xp: reward.attributeNewXp }
            : a
        );
      }
      return [
        ...prev,
        {
          id: `srv-${reward.attributeName}`,
          name: reward.attributeName,
          level: reward.attributeNewLevel,
          xp: reward.attributeNewXp,
        },
      ];
    });

    setPendingTaskId(null);

    if (reward.newLevel > levelBeforeThisAction) {
      setLevelUpLevel(reward.newLevel);
    }
  }

  return (
    <>
      <BentoGrid>
        <BentoHeroArea>
          <HeroCard
            username={username}
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
          <TaskListCard
            tasks={tasks}
            pendingTaskId={pendingTaskId}
            isBusy={pendingTaskId !== null}
            onCreateTask={handleCreateTask}
            onCompleteTask={handleCompleteTask}
            onDeleteTask={handleDeleteTask}
          />
        </BentoTasksArea>
      </BentoGrid>

      <LevelUpModal level={levelUpLevel} onClose={() => setLevelUpLevel(null)} />
      <ErrorToast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
