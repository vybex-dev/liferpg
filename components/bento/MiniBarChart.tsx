"use client";

import { useEffect, useRef, useState } from "react";
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

/** Floor so a "0 that day" bar still renders as a visible dim
 *  baseline pip instead of disappearing entirely. */
const MIN_BAR_PX = 4;

/**
 * Seven vertical bars, one per day, bars anchored to a shared
 * baseline so the whole thing reads as a real (if tiny) chart
 * rather than a decorative sparkle. Designed to live in the
 * flexible middle space of a bento card between its header and its
 * headline number — exactly the area that was otherwise just empty
 * air once the grid stretched short cards to match the hero card's
 * height.
 *
 * Bar heights are computed in real pixels against the track's own
 * measured height (via ResizeObserver) rather than a CSS
 * percentage chained through several nested flex containers —
 * percentage heights on a flex child with a sibling (the day-label
 * row below it) are notoriously unreliable across browsers, and
 * that's what was making every bar collapse to the same size
 * regardless of the underlying data. Measuring in JS sidesteps it
 * entirely: every bar's height is `value / max` of an actual pixel
 * number, so differences between days are always visible.
 */
export function MiniBarChart({
  data,
  barColorClass,
  emptyColorClass,
  glowColor,
  srSummary,
}: MiniBarChartProps) {
  const prefersReducedMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackHeight, setTrackHeight] = useState(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height;
      if (typeof height === "number") setTrackHeight(height);
    });
    observer.observe(el);
    // Also grab the initial size synchronously — ResizeObserver's
    // first callback is async, and without this the chart briefly
    // paints as an empty track (0px) before the observer fires.
    setTrackHeight(el.getBoundingClientRect().height);

    return () => observer.disconnect();
  }, []);

  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="flex h-full w-full flex-col justify-end">
      <div
        ref={trackRef}
        aria-hidden="true"
        className="flex h-full items-end gap-1.5 sm:gap-2"
      >
        {data.map((point) => {
          const barHeightPx =
            point.value > 0
              ? Math.max(MIN_BAR_PX, (point.value / max) * trackHeight)
              : MIN_BAR_PX;

          return (
            <div
              key={point.key}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1"
            >
              <div className="relative flex h-full w-full items-end overflow-hidden rounded-full bg-white/[0.03]">
                <motion.div
                  initial={prefersReducedMotion ? undefined : { height: 0 }}
                  animate={{ height: trackHeight ? barHeightPx : 0 }}
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
