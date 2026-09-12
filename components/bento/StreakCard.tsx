"use client";

import { Flame } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { MiniBarChart } from "@/components/bento/MiniBarChart";
import { buildCompletionSeries } from "@/lib/game/activity";
import type { Task } from "@/lib/game/types";

export function StreakCard({
  streakCount,
  tasks,
}: {
  streakCount: number;
  tasks: Task[];
}) {
  const isActive = streakCount > 0;
  const prefersReducedMotion = useReducedMotion();
  const series = buildCompletionSeries(tasks);
  const totalThisWeek = series.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="glass glow-edge rounded-bento-lg p-5 h-full flex flex-col justify-between min-h-[100px] md:min-h-0">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">Streak</span>
        <motion.div
          animate={
            isActive && !prefersReducedMotion
              ? { scale: [1, 1.18, 1, 1.1, 1], opacity: [1, 0.85, 1, 0.9, 1] }
              : undefined
          }
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ filter: isActive ? "drop-shadow(0 0 6px rgba(251,113,133,0.6))" : undefined }}
        >
          <Flame
            className={isActive ? "h-4 w-4 text-rose-400" : "h-4 w-4 text-zinc-600"}
            strokeWidth={2}
            fill={isActive ? "currentColor" : "none"}
          />
        </motion.div>
      </div>

      {/* 7-day completion activity — fills the vertical space the
          grid gives this card once it's stretched to match the
          hero card's height, instead of leaving it empty. */}
      <div className="my-3 min-h-[52px] flex-1">
        <MiniBarChart
          data={series}
          barColorClass="bg-gradient-to-t from-rose-500 to-orange-300"
          emptyColorClass="bg-white/[0.06]"
          glowColor="rgba(251,113,133,0.65)"
          srSummary={`${totalThisWeek} ${
            totalThisWeek === 1 ? "task" : "tasks"
          } completed in the last 7 days`}
        />
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-3xl font-semibold text-zinc-50">
          {streakCount}
        </span>
        <span className="text-sm text-zinc-500">
          {streakCount === 1 ? "day" : "days"}
        </span>
      </div>
    </div>
  );
}
