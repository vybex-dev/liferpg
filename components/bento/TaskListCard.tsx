"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2 } from "lucide-react";
import {
  createTask,
  completeTask,
  deleteTask,
  type CompleteTaskResult,
} from "@/app/actions/tasks";
import { TASK_CATEGORIES, type Task } from "@/lib/game/types";
import { attributeTokens } from "@/lib/game/attribute-tokens";
import { TaskListEmptyState } from "./TaskListEmptyState";
import { X } from "lucide-react";

const CATEGORY_LABEL = new Map<string, string>(
  TASK_CATEGORIES.map((c) => [c.value, c.label])
);

type TaskListCardProps = {
  initialTasks: Task[];
};

export function TaskListCard({ initialTasks }: TaskListCardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("");
  const [xpReward, setXpReward] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [levelUpNote, setLevelUpNote] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);

  const openTasks = tasks.filter((t) => !t.is_completed);
  const completedTasks = tasks
    .filter((t) => t.is_completed)
    .sort((a, b) =>
      (b.completed_at ?? "").localeCompare(a.completed_at ?? "")
    );

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = title.trim();
    if (!trimmed) return;

    startTransition(async () => {
      const result = await createTask({
        title: trimmed,
        category: category || null,
        xpReward,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setTasks((prev) => [
        {
          id: result.data.id,
          title: trimmed,
          category: category || null,
          xp_reward: xpReward,
          is_completed: false,
          completed_at: null,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setTitle("");
      setCategory("");
      setXpReward(10);
    });
  }

  function handleComplete(task: Task) {
    setError(null);
    setPendingTaskId(task.id);

    startTransition(async () => {
      const result = await completeTask(task.id);
      setPendingTaskId(null);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, is_completed: true, completed_at: new Date().toISOString() }
            : t
        )
      );

      announceReward(result.data);
    });
  }

  function announceReward(reward: CompleteTaskResult) {
    setLevelUpNote(
      `+${reward.attributeName} XP · Level ${reward.newLevel} · ${reward.newGold} gold`
    );
    window.setTimeout(() => setLevelUpNote(null), 4000);
  }

  function handleDelete(taskId: string) {
    setError(null);
    const snapshot = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    startTransition(async () => {
      const result = await deleteTask(taskId);
      if (!result.success) {
        setError(result.error);
        setTasks(snapshot);
      }
    });
  }

  return (
    <div className="glass rounded-bento-lg p-5 md:p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">Quest log</p>
        {levelUpNote && (
          <p className="font-display text-xs font-medium text-xp-cyan animate-pulse">
            {levelUpNote}
          </p>
        )}
      </div>

      <form
        onSubmit={handleAdd}
        className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center"
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task — read 20 pages, go for a run..."
          maxLength={200}
          className="min-w-0 flex-1 rounded-bento-sm border border-glass-border bg-white/[0.03] px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-xp-violet/50"
        />
        <select
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
        <input
          type="number"
          min={1}
          max={500}
          value={xpReward}
          onChange={(e) => setXpReward(Number(e.target.value) || 1)}
          aria-label="XP reward"
          className="w-20 rounded-bento-sm border border-glass-border bg-white/[0.03] px-3 py-2.5 text-sm text-zinc-300 outline-none transition-colors focus:border-xp-violet/50"
        />
        <button
          type="submit"
          disabled={isPending || !title.trim()}
          className="flex items-center justify-center gap-1.5 rounded-bento-sm bg-xp-glow px-4 py-2.5 text-sm font-medium text-space-950 transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Add
        </button>
      </form>

      {error && (
        <p className="mt-3 text-xs text-attr-strength">{error}</p>
      )}

      <div className="mt-5">
        {tasks.length === 0 ? (
          <TaskListEmptyState />
        ) : (
          <ul className="space-y-2">
            {openTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                isPending={pendingTaskId === task.id}
                onComplete={() => handleComplete(task)}
                onDelete={() => handleDelete(task.id)}
              />
            ))}
            {completedTasks.length > 0 && (
              <>
                {openTasks.length > 0 && (
                  <li className="pt-1 text-[11px] uppercase tracking-wide text-zinc-700" aria-hidden />
                )}
                {completedTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    isPending={false}
                    onComplete={() => {}}
                    onDelete={() => handleDelete(task.id)}
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
  onComplete,
  onDelete,
}: {
  task: Task;
  isPending: boolean;
  onComplete: () => void;
  onDelete: () => void;
}) {
  const tokens = task.category ? attributeTokens(categoryToAttrName(task.category)) : null;

  return (
    <li
      className={`group flex items-center gap-3 rounded-bento-sm border border-glass-border bg-white/[0.02] px-3.5 py-3 transition-colors ${
        task.is_completed ? "opacity-50" : "hover:bg-white/[0.04]"
      }`}
    >
      <button
        type="button"
        onClick={onComplete}
        disabled={task.is_completed || isPending}
        aria-label={
          task.is_completed ? "Task completed" : `Complete "${task.title}"`
        }
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
          task.is_completed
            ? "border-xp-cyan bg-xp-cyan/20"
            : "border-zinc-600 hover:border-xp-cyan"
        }`}
      >
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />
        ) : task.is_completed ? (
          <svg viewBox="0 0 16 16" className="h-3 w-3 fill-xp-cyan">
            <path d="M6.5 11.5 3 8l1.1-1.1 2.4 2.4 5.4-5.4L13 5z" />
          </svg>
        ) : null}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm ${
            task.is_completed ? "text-zinc-500 line-through" : "text-zinc-200"
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
        className="shrink-0 text-zinc-700 opacity-0 transition-opacity hover:text-attr-strength group-hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

function categoryToAttrName(category: string): string {
  const map: Record<string, string> = {
    strength: "Strength",
    intellect: "Intellect",
    discipline: "Discipline",
    charisma: "Charisma",
    vitality: "Vitality",
  };
  return map[category] ?? "Discipline";
}
