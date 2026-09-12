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
 * Seven vertical bars, one per day, each bar's height a CSS
 * percentage of its track (`heightPct`), with a floor so a
 * "0 that day" bar still renders as a visible dim baseline pip.
 *
 * Deliberately NOT measured via ResizeObserver/getBoundingClientRect,
 * even though that looks like the "more robust" way to turn a
 * percentage into a real animation target. This card's chart
 * container sits inside a `md:auto-rows-min` grid row sized by its
 * own content (see BentoGrid) — so a JS-measured height here creates
 * a real feedback loop: measure height -> compute a pixel bar target
 * -> bar grows -> card's content height grows -> grid row grows ->
 * next measurement reads a taller container -> bigger target -> bar
 * grows again, unbounded, every render. Confirmed by reproducing it
 * (bars visibly ran away past the card in testing) and confirming
 * this plain CSS-percentage version settles and stops. A pure CSS
 * percentage has no such loop: the browser resolves `height: X%`
 * against the track's layout in one pass without feeding back into
 * a React state update, so growing the bar can never itself trigger
 * another "measure and grow" cycle.
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
      <div aria-hidden="true" className="flex h-full items-end gap-1.5 sm:gap-2">
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
                className={`shrink-0 text-[9px] leading-none ${
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
