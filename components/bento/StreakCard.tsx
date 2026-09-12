import { Flame } from "lucide-react";

export function StreakCard({ streakCount }: { streakCount: number }) {
  const isActive = streakCount > 0;

  return (
    <div className="glass rounded-bento-lg p-5 h-full flex flex-col justify-between min-h-[100px] md:min-h-0">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">Streak</span>
        <Flame
          className={isActive ? "h-4 w-4 text-rose-400" : "h-4 w-4 text-zinc-600"}
          strokeWidth={2}
          fill={isActive ? "currentColor" : "none"}
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
