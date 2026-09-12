import { ATTRIBUTE_ORDER, type Attribute } from "@/lib/game/types";
import { attributeTokens } from "@/lib/game/attribute-tokens";
import { getLevelProgress } from "@/lib/game/leveling";

export function AttributeRow({ attributes }: { attributes: Attribute[] }) {
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

          return (
            <div
              key={name}
              className={`rounded-bento-sm border ${tokens.border} bg-white/[0.02] p-3.5`}
            >
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
