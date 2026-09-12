"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ATTRIBUTE_ORDER, type Attribute } from "@/lib/game/types";
import { attributeTokens } from "@/lib/game/attribute-tokens";
import { getLevelProgress } from "@/lib/game/leveling";

type RecentAward = { id: number; name: string; amount: number } | null;

type AttributeRowProps = {
  attributes: Attribute[];
  /**
   * The most recent task-completion's XP award, if it happened
   * within the last ~900ms. Drives a brief glow + floating "+N XP"
   * chip on the matching card so the (required) category system
   * visibly connects "this task" to "this attribute" instead of
   * only updating numbers silently in the background.
   */
  award?: RecentAward;
};

export function AttributeRow({ attributes, award }: AttributeRowProps) {
  const byName = new Map(attributes.map((a) => [a.name, a]));

  return (
    <div className="glass rounded-bento-lg p-5 md:p-6">
      <p className="mb-4 text-xs text-zinc-500">Attributes</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {ATTRIBUTE_ORDER.map((name) => {
          const attr = byName.get(name);
          const level = attr?.level ?? 1;
          const xp = attr?.xp ?? 0;
          const { progress, xpToNext } = getLevelProgress(level, xp);
          const tokens = attributeTokens(name);
          const isAwarded = award?.name === name;

          return (
            <div
              key={name}
              className={`relative overflow-visible rounded-bento-sm border bg-white/[0.02] p-3.5 transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 ${
                tokens.border
              } ${tokens.hoverBorder} ${tokens.hoverGlow} ${isAwarded ? tokens.glow : ""}`}
            >
              <AnimatePresence>
                {isAwarded && award && (
                  <motion.span
                    key={award.id}
                    aria-hidden
                    initial={{ opacity: 0, y: 2, scale: 0.9 }}
                    animate={{ opacity: 1, y: -16, scale: 1 }}
                    exit={{ opacity: 0, y: -26 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className={`pointer-events-none absolute -top-2.5 right-2 z-10 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-semibold ${tokens.text}`}
                  >
                    +{award.amount} XP
                  </motion.span>
                )}
              </AnimatePresence>
              <div className="flex items-baseline justify-between">
                <span className={`text-sm font-medium ${tokens.text}`}>
                  {name}
                </span>
                <span className="font-display text-lg font-semibold text-zinc-100">
                  {level}
                </span>
              </div>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full rounded-full ${tokens.bar} transition-[width] duration-500 ease-out`}
                  style={{ width: `${Math.round(progress * 100)}%` }}
                  role="progressbar"
                  aria-valuenow={Math.round(progress * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuetext={`${xp} of ${xpToNext} XP toward ${name} level ${level + 1}`}
                  aria-label={`${name} progress to next level`}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-zinc-600">
                {xp}/{xpToNext} XP
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
