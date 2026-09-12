"use client";

import { useEffect, useRef, useState } from "react";
import { Coins } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export function GoldCard({ gold }: { gold: number }) {
  const prefersReducedMotion = useReducedMotion();
  const prevGold = useRef(gold);
  const [delta, setDelta] = useState<number | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fires only on an actual increase (a purchase decreases gold and
  // shouldn't celebrate) — compares against the last render's value
  // rather than initial mount, so it never fires on first paint.
  useEffect(() => {
    if (gold > prevGold.current) {
      setDelta(gold - prevGold.current);
      if (clearTimer.current) clearTimeout(clearTimer.current);
      clearTimer.current = setTimeout(() => setDelta(null), 900);
    }
    prevGold.current = gold;
    return () => {
      if (clearTimer.current) clearTimeout(clearTimer.current);
    };
  }, [gold]);

  return (
    <div className="glass rounded-bento-lg p-5 h-full flex flex-col justify-between min-h-[100px] md:min-h-0">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">Gold</span>
        <motion.div
          animate={
            delta && !prefersReducedMotion
              ? { rotate: [0, -12, 10, 0], scale: [1, 1.25, 1] }
              : undefined
          }
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Coins className="h-4 w-4 text-gold" strokeWidth={2} />
        </motion.div>
      </div>
      <div className="relative flex items-baseline gap-1.5">
        <motion.span
          key={gold}
          initial={prefersReducedMotion ? undefined : { scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="font-display text-3xl font-semibold text-gold-bright"
        >
          {gold.toLocaleString()}
        </motion.span>
        <AnimatePresence>
          {delta && (
            <motion.span
              aria-hidden
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: -18 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="absolute -top-1 right-0 text-xs font-medium text-gold-bright"
            >
              +{delta}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
