import { Coins } from "lucide-react";

export function GoldCard({ gold }: { gold: number }) {
  return (
    <div className="glass rounded-bento-lg p-5 h-full flex flex-col justify-between min-h-[100px] md:min-h-0">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">Gold</span>
        <Coins className="h-4 w-4 text-gold" strokeWidth={2} />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-3xl font-semibold text-gold-bright">
          {gold.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
