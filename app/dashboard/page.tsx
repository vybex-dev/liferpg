import { Suspense } from "react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { DashboardData } from "./DashboardData";
import { DashboardSkeleton } from "@/components/bento/skeletons";
import { LogOut, Store } from "lucide-react";

export default function DashboardPage() {
  return (
    <main id="main-content" className="min-h-screen px-4 py-6 sm:px-6 md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between md:mb-8">
          <h1 className="neon-text font-display text-xl font-semibold md:text-2xl">
            Life RPG
          </h1>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/shop"
              className="flex items-center gap-1.5 rounded-bento-sm border border-glass-border px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-gold/40 hover:text-gold-bright"
            >
              <Store className="h-3.5 w-3.5" strokeWidth={2} />
              Shop
            </Link>

            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-bento-sm border border-glass-border px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-attr-strength/40 hover:text-attr-strength"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
                Log out
              </button>
            </form>
          </div>
        </div>

        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardData />
        </Suspense>
      </div>
    </main>
  );
}
