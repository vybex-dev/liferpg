import { getLevelProgress } from "@/lib/game/leveling";

type HeroCardProps = {
  username: string;
  level: number;
  currentXp: number;
};

export function HeroCard({ username, level, currentXp }: HeroCardProps) {
  const { xpToNext, progress } = getLevelProgress(level, currentXp);
  const initial = username.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="glass rounded-bento-lg p-6 md:p-8 h-full flex flex-col justify-between min-h-[220px]">
      <div className="flex items-center gap-4">
        <div
          aria-hidden
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-xp-glow font-display text-xl font-semibold text-space-950 shadow-glow-violet"
        >
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-zinc-400">{username}</p>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-5xl font-semibold leading-none text-zinc-50 md:text-6xl">
              {level}
            </span>
            <span className="text-sm font-medium text-zinc-500">level</span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-baseline justify-between text-xs">
          <span className="text-zinc-500">Experience</span>
          <span className="font-medium text-zinc-400">
            {currentXp.toLocaleString()} / {xpToNext.toLocaleString()} XP
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-xp-glow shadow-glow-violet transition-[width] duration-500 ease-out"
            style={{ width: `${Math.round(progress * 100)}%` }}
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Experience progress to next level"
          />
        </div>
      </div>
    </div>
  );
}
