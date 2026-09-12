/**
 * The bento layout is expressed as CSS grid-template-areas, not
 * fixed column/row spans. That's what makes the mobile collapse a
 * real reflow rather than a shrink: at the `md` breakpoint every
 * card is reassigned into a single stacked column via a second
 * grid-template-areas declaration, so cards genuinely change
 * position and order (hero first, then streak+gold, then
 * attributes, then tasks) rather than keeping their desktop
 * grid position at a smaller size.
 */
export function BentoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={[
        "grid gap-4 md:gap-5",
        // Mobile: one column, natural DOM order.
        "grid-cols-1",
        // Desktop: 4-column grid with named areas.
        "md:grid-cols-4",
        "md:[grid-template-areas:'hero_hero_streak_gold'_'attrs_attrs_attrs_attrs'_'tasks_tasks_tasks_tasks']",
        "md:auto-rows-min",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function BentoHeroArea({ children }: { children: React.ReactNode }) {
  return <div className="md:[grid-area:hero]">{children}</div>;
}

export function BentoStreakArea({ children }: { children: React.ReactNode }) {
  return <div className="md:[grid-area:streak]">{children}</div>;
}

export function BentoGoldArea({ children }: { children: React.ReactNode }) {
  return <div className="md:[grid-area:gold]">{children}</div>;
}

export function BentoAttrsArea({ children }: { children: React.ReactNode }) {
  return <div className="md:[grid-area:attrs]">{children}</div>;
}

export function BentoTasksArea({ children }: { children: React.ReactNode }) {
  return <div className="md:[grid-area:tasks]">{children}</div>;
}
