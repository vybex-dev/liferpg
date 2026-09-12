"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { LogIn, AlertCircle } from "lucide-react";
import { login, type AuthActionState } from "@/app/actions/auth";

const initialState: AuthActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative w-full overflow-hidden rounded-bento-sm bg-xp-glow px-4 py-3 font-display text-sm font-semibold text-zinc-950 transition-opacity disabled:opacity-60"
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {pending ? (
          "Checking credentials…"
        ) : (
          <>
            <LogIn className="h-4 w-4" strokeWidth={2.5} />
            Log in
          </>
        )}
      </span>
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <div className="glass-strong rounded-bento-lg p-8">
      <div className="mb-6">
        <h2 className="font-display text-xl font-semibold text-zinc-100">
          Welcome back
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Log in to keep your streak alive.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-bento-sm border border-glass-border bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-xp-violet/60 focus:bg-white/[0.07]"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="w-full rounded-bento-sm border border-glass-border bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-xp-violet/60 focus:bg-white/[0.07]"
          />
        </div>

        {state.error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-bento-sm border border-attr-strength/30 bg-attr-strength/10 px-3 py-2.5 text-sm text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            <span>{state.error}</span>
          </div>
        )}

        <SubmitButton />
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        New here?{" "}
        <Link
          href="/signup"
          className="font-medium text-xp-cyan hover:text-xp-cyan/80 transition-colors"
        >
          Create a character
        </Link>
      </p>
    </div>
  );
}
