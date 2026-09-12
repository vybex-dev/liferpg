"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Root error boundary. Next.js renders this in place of the
 * segment's children whenever a render or runtime error escapes
 * (must be a Client Component for that reason). Without this file
 * the same error takes down the whole route to Next's default,
 * unstyled crash screen — worth having even though `reset()` can't
 * undo anything server-side; the safe recovery paths are "try
 * again" (re-render) or a link back to a known-good page.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Logged for debugging only — never rendered to the user, since
    // `error.message` can carry raw internals (stack traces, raw
    // Postgres error text) that aren't safe or meaningful to show.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="glass glow-edge w-full max-w-md rounded-bento-lg p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-attr-strength/15">
          <AlertTriangle className="h-6 w-6 text-attr-strength" strokeWidth={2} />
        </div>
        <h1 className="mt-5 font-display text-xl font-semibold text-zinc-100">
          Something went sideways
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          An unexpected error interrupted this quest. Your progress up to
          your last completed task is safe.
        </p>
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-1.5 rounded-bento-sm bg-xp-glow px-4 py-2.5 text-sm font-medium text-space-950 transition-opacity hover:opacity-90"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={2} />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-bento-sm border border-glass-border px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-xp-violet/40 hover:text-xp-violet"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
