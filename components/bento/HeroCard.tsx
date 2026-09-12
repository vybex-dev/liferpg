import { getLevelProgress } from "@/lib/game/leveling";
import { auraGradientClass } from "@/lib/game/aura";

type HeroCardProps = {
  username: string;
  level: number;
  currentXp: number;
  /** Name of the equipped `title`-type shop item, if any. */
  equippedTitle?: string | null;
  /** Name of the equipped `aura`-type shop item, if any. */
  equippedAura?: string | null;
};

export function HeroCard({
  username,
  level,
  currentXp,
  equippedTitle,
  equippedAura,
}: HeroCardProps) {
  const { xpToNext, progress } = getLevelProgress(level, currentXp);
  const initial = username.trim().charAt(0).toUpperCase() || "?";
  const auraClass = auraGradientClass(equippedAura);

  return (
    <div className="glass glow-edge rounded-bento-lg p-6 md:p-8 h-full flex flex-col justify-between min-h-[220px]">
      <div className="flex items-center gap-4">
        <div
          aria-hidden
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${auraClass} font-display text-xl font-semibold text-space-950 shadow-[0_0_24px_0_rgba(139,92,246,0.35),0_0_0_3px_rgba(255,255,255,0.06),5px_5px_12px_rgba(0,0,0,0.5)] transition-[background-image,background-color] duration-300`}
        >
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-zinc-400">{username}</p>
          {equippedTitle && (
            <p className="truncate text-xs font-medium text-xp-cyan">
              {equippedTitle}
            </p>
          )}
          <div className="flex items-baseline gap-2">
            <span className="font-display text-5xl font-semibold leading-none text-zinc-50 md:text-6xl">
              {level}
            </span>
            <span className="text-sm font-medium text-zinc-500">level</span>
          </div>
          {/* Visually hidden: announces the current level to screen
              readers whenever it changes, independent of the
              level-up modal (which only fires on the transition
              itself and is dismissible before it's fully read). */}
          <p className="sr-only" aria-live="polite">
            Level {level}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-baseline justify-between text-xs">
          <span className="text-zinc-500">Experience</span>
          <span className="font-medium text-zinc-400">
            {currentXp.toLocaleString()} / {xpToNext.toLocaleString()} XP
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5 shadow-neu-pressed">
          <div
            className="relative h-full overflow-hidden rounded-full bg-xp-glow shadow-glow-violet transition-[width] duration-500 ease-out"
            style={{ width: `${Math.round(progress * 100)}%` }}
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${currentXp.toLocaleString()} of ${xpToNext.toLocaleString()} XP to level ${level + 1}`}
            aria-label="Experience progress to next level"
          >
            {/* Looping light sweep across the filled portion only —
                ambient texture on the bar itself, not a page-level
                animated moment, so it's exempt from the "one big
                orchestrated moment" rule. Caught by the global
                prefers-reduced-motion reset in globals.css. */}
            <span
              aria-hidden
              className="absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/50 to-transparent"
              style={{ animation: "xp-shimmer 2.6s ease-in-out infinite" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
