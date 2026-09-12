import Link from "next/link";
import { Compass } from "lucide-react";

/**
 * Next.js renders this automatically for any route that doesn't
 * match a page (or wherever `notFound()` is called explicitly). A
 * server component is enough here — there's no interactivity to
 * recover, just a themed landing spot instead of Next's default
 * unstyled 404.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="glass glow-edge w-full max-w-md rounded-bento-lg p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-xp-violet/15">
          <Compass className="h-6 w-6 text-xp-violet" strokeWidth={2} />
        </div>
        <h1 className="mt-5 font-display text-xl font-semibold text-zinc-100">
          404 — Uncharted territory
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          There&apos;s no quest at this location. Let&apos;s get you back on
          the map.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-bento-sm bg-xp-glow px-4 py-2.5 text-sm font-medium text-space-950 transition-opacity hover:opacity-90"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
