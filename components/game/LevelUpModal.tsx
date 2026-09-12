"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";

type LevelUpModalProps = {
  /** The new level to celebrate, or null when no modal should show. */
  level: number | null;
  onClose: () => void;
};

const AUTO_DISMISS_MS = 3200;

/**
 * This is the app's ONE big orchestrated animation moment (see the
 * "Motion rule" in the design system) — everything else in the app
 * only animates in direct response to a user action. Screen dims,
 * a radial violet-to-cyan glow bursts outward, the level number
 * counts up, and "Level Up" fades in above it. Dismisses on click,
 * Escape, or automatically after a few seconds.
 *
 * Respects prefers-reduced-motion: the burst and count-up are
 * skipped and the final level is shown immediately, with only a
 * plain opacity fade for the overlay itself.
 */
export function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const [displayLevel, setDisplayLevel] = useState(level ?? 1);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (level == null) return;

    if (prefersReducedMotion) {
      setDisplayLevel(level);
    } else {
      const startFrom = Math.max(1, level - 1);
      setDisplayLevel(startFrom);
      const controls = animate(startFrom, level, {
        duration: 0.9,
        delay: 0.25,
        ease: "easeOut",
        onUpdate: (latest) => setDisplayLevel(Math.round(latest)),
      });

      dismissTimer.current = setTimeout(onClose, AUTO_DISMISS_MS);
      return () => {
        controls.stop();
        if (dismissTimer.current) clearTimeout(dismissTimer.current);
      };
    }

    dismissTimer.current = setTimeout(onClose, AUTO_DISMISS_MS);
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, prefersReducedMotion]);

  useEffect(() => {
    if (level == null) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [level, onClose]);

  return (
    <AnimatePresence>
      {level != null && (
        <motion.div
          role="status"
          aria-live="polite"
          aria-label={`Level up! You are now level ${level}.`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-space-950/80 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.15 : 0.35 }}
          onClick={onClose}
        >
          <motion.div
            className="relative flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.85, y: 12 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.9 }
            }
            transition={{
              duration: prefersReducedMotion ? 0.15 : 0.5,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {!prefersReducedMotion && (
              <motion.div
                aria-hidden
                className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-xp-glow blur-3xl"
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: [0, 0.55, 0.35], scale: [0.3, 1.6, 1.3] }}
                transition={{ duration: 1.1, ease: "easeOut" }}
              />
            )}

            <motion.p
              className="relative font-display text-sm font-semibold uppercase tracking-[0.3em] text-xp-cyan"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: prefersReducedMotion ? 0 : 0.15,
                duration: 0.4,
              }}
            >
              Level Up
            </motion.p>

            <span className="relative bg-xp-glow bg-clip-text font-display text-8xl font-bold leading-none text-transparent drop-shadow-[0_0_30px_rgba(139,92,246,0.55)] sm:text-9xl">
              {displayLevel}
            </span>

            <motion.p
              className="relative mt-3 text-sm text-zinc-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: prefersReducedMotion ? 0 : 0.5,
                duration: 0.4,
              }}
            >
              Tap anywhere to continue
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
