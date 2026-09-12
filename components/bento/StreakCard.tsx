"use client";

import { Flame } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export function StreakCard({ streakCount }: { streakCount: number }) {
  const isActive = streakCount > 0;
  const prefersReducedMotion = useReducedMotion();

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
