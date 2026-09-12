function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-bento-sm bg-white/[0.06] ${className}`}
    />
  );
}

export function HeroCardSkeleton() {
  return (
    <div className="glass rounded-bento-lg p-6 md:p-8 h-full min-h-[220px] flex flex-col justify-between">
      <div className="flex items-center gap-4">
        <Shimmer className="h-14 w-14 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2.5">
          <Shimmer className="h-3 w-24" />
          <Shimmer className="h-10 w-20" />
        </div>
      </div>
      <div className="mt-6 space-y-2">
        <Shimmer className="h-3 w-full max-w-[220px]" />
        <Shimmer className="h-2.5 w-full rounded-full" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass rounded-bento-lg p-5 h-full min-h-[100px] md:min-h-0 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <Shimmer className="h-3 w-12" />
        <Shimmer className="h-4 w-4 rounded-full" />
      </div>
      <Shimmer className="h-8 w-16" />
    </div>
  );
}

export function AttributeRowSkeleton() {
  return (
    <div className="glass rounded-bento-lg p-5 md:p-6">
      <Shimmer className="mb-4 h-3 w-20" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-bento-sm border border-glass-border bg-white/[0.02] p-3.5"
          >
            <div className="flex items-baseline justify-between">
              <Shimmer className="h-4 w-14" />
              <Shimmer className="h-5 w-4" />
            </div>
            <Shimmer className="mt-2.5 h-1.5 w-full rounded-full" />
            <Shimmer className="mt-1.5 h-2.5 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TaskListCardSkeleton() {
  return (
    <div className="glass rounded-bento-lg p-5 md:p-6">
      <Shimmer className="h-3 w-16" />
      <Shimmer className="mt-4 h-11 w-full" />
      <div className="mt-5 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-bento-sm border border-glass-border bg-white/[0.02] px-3.5 py-3"
          >
            <Shimmer className="h-5 w-5 shrink-0 rounded-md" />
            <Shimmer className="h-4 flex-1" />
            <Shimmer className="h-5 w-14 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-5 md:auto-rows-min md:[grid-template-areas:'hero_hero_streak_gold'_'attrs_attrs_attrs_attrs'_'tasks_tasks_tasks_tasks']">
      <div className="md:[grid-area:hero]">
        <HeroCardSkeleton />
      </div>
      <div className="md:[grid-area:streak]">
        <StatCardSkeleton />
      </div>
      <div className="md:[grid-area:gold]">
        <StatCardSkeleton />
      </div>
      <div className="md:[grid-area:attrs]">
        <AttributeRowSkeleton />
      </div>
      <div className="md:[grid-area:tasks]">
        <TaskListCardSkeleton />
      </div>
    </div>
  );
}
