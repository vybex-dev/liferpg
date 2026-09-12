"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Plus, X } from "lucide-react";
import type { ActionResult, CreateTaskInput } from "@/app/actions/tasks";
import { TASK_CATEGORIES, type Task } from "@/lib/game/types";
import { attributeTokens } from "@/lib/game/attribute-tokens";
import { categoryToAttributeName } from "@/lib/game/category-map";
import { TaskListEmptyState } from "./TaskListEmptyState";

const CATEGORY_LABEL = new Map<string, string>(
  TASK_CATEGORIES.map((c) => [c.value, c.label])
);

type TaskListCardProps = {
  tasks: Task[];
  /** The task currently mid-flight through completeTask, if any. */
  pendingTaskId: string | null;
  /**
   * True while ANY task completion is in flight. Disables every
   * OTHER checkbox (not just the pending one) so two completions
   * can never overlap client-side — the optimistic XP/gold/streak
   * math in DashboardShell assumes it's only ever previewing one
   * award at a time.
   */
  isBusy: boolean;
  onCreateTask: (input: CreateTaskInput) => Promise<ActionResult<{ id: string }>>;
  onCompleteTask: (task: Task) => void | Promise<void>;
  onDeleteTask: (taskId: string) => void | Promise<void>;
};

export function TaskListCard({
  tasks,
  pendingTaskId,
  isBusy,
  onCreateTask,
  onCompleteTask,
  onDeleteTask,
}: TaskListCardProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("");
  const [xpReward, setXpReward] = useState(10);
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreating, startCreating] = useTransition();

  const openTasks = tasks.filter((t) => !t.is_completed);
  const completedTasks = tasks
    .filter((t) => t.is_completed)
    .sort((a, b) =>
      (b.completed_at ?? "").localeCompare(a.completed_at ?? "")
    );

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const trimmed = title.trim();
    if (!trimmed) {
      setFormError("Give the task a title.");
      return;
    }

    startCreating(async () => {
      const result = await onCreateTask({
        title: trimmed,
        category: category || null,
        xpReward,
      });

      if (!result.success) {
        setFormError(result.error);
        return;
      }

      setTitle("");
      setCategory("");
      setXpReward(10);
    });
  }

  const titleFieldId = "new-task-title";
  const errorId = "new-task-error";

  return (
    <div className="glass rounded-bento-lg p-5 md:p-6">
      <p className="text-xs text-zinc-500">Quest log</p>

      <form
        onSubmit={handleAdd}
        className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center"
        noValidate
      >
        <label htmlFor={titleFieldId} className="sr-only">
          Task title
        </label>
        <input
          id={titleFieldId}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task — read 20 pages, go for a run..."
          maxLength={200}
          aria-invalid={Boolean(formError)}
          aria-describedby={formError ? errorId : undefined}
          className="min-w-0 flex-1 rounded-bento-sm border border-glass-border bg-white/[0.03] px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-xp-violet/50"
        />
        <label htmlFor="new-task-category" className="sr-only">
          Category
        </label>
        <select
          id="new-task-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-bento-sm border border-glass-border bg-white/[0.03] px-3 py-2.5 text-sm text-zinc-300 outline-none transition-colors focus:border-xp-violet/50"
        >
          <option value="">No category</option>
          {TASK_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <label htmlFor="new-task-xp" className="sr-only">
          XP reward
        </label>
        <input
          id="new-task-xp"
          type="number"
          min={1}
          max={500}
          value={xpReward}
          onChange={(e) => setXpReward(Number(e.target.value) || 1)}
          aria-label="XP reward"
          className="w-20 rounded-bento-sm border border-glass-border bg-white/[0.03] px-3 py-2.5 text-sm text-zinc-300 outline-none transition-colors focus:border-xp-violet/50"
        />
        <motion.button
          type="submit"
          whileTap={{ scale: 0.95 }}
          disabled={isCreating || !title.trim()}
          className="flex items-center justify-center gap-1.5 rounded-bento-sm bg-xp-glow px-4 py-2.5 text-sm font-medium text-space-950 transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {isCreating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          )}
          Add
        </motion.button>
      </form>

      {formError && (
        <p id={errorId} role="alert" className="mt-3 text-xs text-attr-strength">
          {formError}
        </p>
      )}

      <div className="mt-5">
        {tasks.length === 0 ? (
          <TaskListEmptyState />
        ) : (
          <ul className="space-y-2" aria-label="Tasks">

            {openTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                isPending={pendingTaskId === task.id}
                isDisabled={isBusy && pendingTaskId !== task.id}
                onComplete={() => onCompleteTask(task)}
                onDelete={() => onDeleteTask(task.id)}
              />
            ))}
            {completedTasks.length > 0 && (
              <>
                {openTasks.length > 0 && (
                  <li
                    className="pt-1 text-[11px] uppercase tracking-wide text-zinc-700"
                    aria-hidden
                  />
                )}
                {completedTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    isPending={false}
                    isDisabled={false}
                    onComplete={() => {}}
                    onDelete={() => onDeleteTask(task.id)}
                  />
                ))}
              </>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

function TaskRow({
  task,
  isPending,
  isDisabled,
  onComplete,
  onDelete,
}: {
  task: Task;
  isPending: boolean;
  isDisabled: boolean;
  onComplete: () => void;
  onDelete: () => void;
}) {
  const tokens = task.category
    ? attributeTokens(categoryToAttributeName(task.category))
    : null;
  const prefersReducedMotion = useReducedMotion();

  // Tracks the is_completed transition (not just its current value)
  // so the particle burst fires exactly once, on the render where
  // optimistic state flips it true — never on mount for
  // already-completed tasks loaded from the server.
  const wasCompleted = useRef(task.is_completed);
  const [showBurst, setShowBurst] = useState(false);

  useEffect(() => {
    const justCompleted = !wasCompleted.current && task.is_completed;
    wasCompleted.current = task.is_completed;

    if (justCompleted && !prefersReducedMotion) {
      setShowBurst(true);
      const timer = setTimeout(() => setShowBurst(false), 650);
      return () => clearTimeout(timer);
    }
  }, [task.is_completed, prefersReducedMotion]);

  return (
    <li
      className={`group flex items-center gap-3 rounded-bento-sm border border-glass-border bg-white/[0.02] px-3.5 py-3 transition-colors ${
        task.is_completed ? "opacity-50" : "hover:bg-white/[0.04]"
      }`}
    >
      <motion.button
        type="button"
        onClick={onComplete}
        disabled={task.is_completed || isPending || isDisabled}
        whileTap={task.is_completed ? undefined : { scale: 0.85 }}
        aria-label={
          task.is_completed ? "Task completed" : `Complete "${task.title}"`
        }
        className={`relative flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-[background-color,border-color,box-shadow] duration-200 ${
          task.is_completed
            ? "border-xp-cyan bg-xp-cyan/20 shadow-glow-cyan"
            : "border-transparent bg-space-800 shadow-neu-pressed hover:enabled:ring-1 hover:enabled:ring-xp-cyan/50"
        }`}
      >
        {showBurst && (
          <CompletionBurst colorClass={tokens?.bar ?? "bg-xp-cyan"} />
        )}
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />
        ) : task.is_completed ? (
          // This only ever mounts the instant is_completed flips
          // true (optimistically, before the server confirms), so
          // the draw-in plays as the checkbox's own "just checked"
          // moment rather than replaying on every re-render.
          <svg viewBox="0 0 16 16" className="h-3 w-3">
            <motion.path
              d="M3 8.3 6.2 11.5 13 4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-xp-cyan"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            />
          </svg>
        ) : null}
      </motion.button>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm ${
            task.is_completed
              ? "text-zinc-400 line-through decoration-zinc-600"
              : "text-zinc-200"
          }`}
        >
          {task.title}
        </p>
        {task.category && (
          <span className={`text-[11px] ${tokens?.text ?? "text-zinc-500"}`}>
            {CATEGORY_LABEL.get(task.category) ?? task.category}
          </span>
        )}
      </div>

      <span className="shrink-0 rounded-full bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-zinc-400">
        +{task.xp_reward} XP
      </span>

      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete "${task.title}"`}
        className="shrink-0 text-zinc-700 opacity-0 transition-opacity hover:text-attr-strength focus-visible:opacity-100 group-hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

/**
 * A brief radial spray of dots in the task's own attribute color,
 * anchored to the checkbox. Purely decorative (aria-hidden) — the
 * real "task done" state is already conveyed by the checkmark draw-in
 * and the strikethrough, this is just the celebratory flourish the
 * brief asks for. Unmounts itself via the parent's setTimeout, so it
 * never lingers as dead DOM on a row that's since re-rendered.
 */
function CompletionBurst({ colorClass }: { colorClass: string }) {
  const particles = Array.from({ length: 8 });

  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 z-10">
      {particles.map((_, i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const distance = 14 + (i % 3) * 4;
        return (
          <motion.span
            key={i}
            className={`absolute left-1/2 top-1/2 h-1 w-1 rounded-full ${colorClass}`}
            initial={{ x: "-50%", y: "-50%", opacity: 1, scale: 1 }}
            animate={{
              x: `calc(-50% + ${Math.cos(angle) * distance}px)`,
              y: `calc(-50% + ${Math.sin(angle) * distance}px)`,
              opacity: 0,
              scale: 0.3,
            }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          />
        );
      })}
    </span>
  );
}
