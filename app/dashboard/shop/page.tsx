import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ShopData } from "./ShopData";
import { ShopSkeleton } from "@/components/bento/skeletons";

export default function ShopPage() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center gap-3 md:mb-8">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-bento-sm border border-glass-border text-zinc-400 transition-colors hover:border-xp-violet/40 hover:text-xp-violet"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          </Link>
          <h1 className="font-display text-xl font-semibold text-zinc-100 md:text-2xl">
            Shop
          </h1>
        </div>

        <Suspense fallback={<ShopSkeleton />}>
          <ShopData />
        </Suspense>
      </div>
    </main>
  );
}
