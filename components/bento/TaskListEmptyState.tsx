import { Sparkles } from "lucide-react";

export function TaskListEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-bento-md border border-dashed border-glass-border-strong px-6 py-12 text-center">
      <Sparkles className="h-6 w-6 text-xp-violet" strokeWidth={1.75} />
      <p className="mt-3 font-display text-base font-medium text-zinc-200">
        Your quest log is empty
      </p>
      <p className="mt-1.5 max-w-xs text-sm text-zinc-500">
        Add the first task above — a workout, a chapter, a chore, anything
        real — and it starts earning XP the moment you complete it.
      </p>
    </div>
  );
}
