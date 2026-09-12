"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { DailyPoint } from "@/lib/game/activity";

type MiniBarChartProps = {
  data: DailyPoint[];
  /** Tailwind class for a filled/active bar, e.g. "bg-rose-400". */
  barColorClass: string;
  /** Tailwind class for a zero-value bar's faint baseline pip. */
  emptyColorClass: string;
  /** Drop-shadow color used on today's bar to make it pop. */
  glowColor: string;
  /** Screen-reader summary of what this chart shows (visible chart itself is aria-hidden). */
  srSummary: string;
};

/**
 * Seven vertical bars, one per day, bars anchored to a shared
 * baseline so the whole thing reads as a real (if tiny) chart
 * rather than a decorative sparkle. Designed to live in the
 * flexible middle space of a bento card between its header and its
 * headline number — exactly the area that was otherwise just empty
 * air once the grid stretched short cards to match the hero card's
 * height.
 *
 * Bars are real percentages of the max value in the series (with a
 * floor so a "0 tasks that day" bar still renders as a visible dim
 * baseline pip instead of disappearing), animated in on mount/update
 * via height transitions. Skips the height animation under
 * prefers-reduced-motion — bars simply appear at final height.
 */
export function MiniBarChart({
  data,
  barColorClass,
  emptyColorClass,
  glowColor,
  srSummary,
}: MiniBarChartProps) {
  const prefersReducedMotion = useReducedMotion();
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="flex h-full w-full flex-col justify-end">
      <div
        aria-hidden="true"
        className="flex h-full items-end gap-1.5 sm:gap-2"
      >
        {data.map((point) => {
          const heightPct = point.value > 0 ? (point.value / max) * 100 : 6;

          return (
            <div
              key={point.key}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1"
            >
              <div className="relative flex h-full w-full items-end overflow-hidden rounded-full bg-white/[0.03]">
                <motion.div
                  initial={prefersReducedMotion ? undefined : { height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  style={
                    point.isToday
                      ? { filter: `drop-shadow(0 0 5px ${glowColor})` }
                      : undefined
                  }
                  className={`w-full rounded-full ${
                    point.value > 0 ? barColorClass : emptyColorClass
                  } ${point.isToday ? "opacity-100" : "opacity-70"}`}
                />
              </div>
              <span
                className={`text-[9px] leading-none ${
                  point.isToday ? "font-semibold text-zinc-300" : "text-zinc-600"
                }`}
              >
                {point.label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="sr-only">{srSummary}</p>
    </div>
  );
}
