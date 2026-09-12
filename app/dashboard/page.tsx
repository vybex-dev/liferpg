import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";
import { LogOut } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt and suspenders — middleware already guards this route,
  // but a Server Component should never trust that alone.
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen p-8">
      <div className="glass rounded-bento-lg p-8 max-w-lg mx-auto">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-zinc-100">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Logged in as {user.email}
            </p>
          </div>

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

        <p className="mt-6 text-sm text-zinc-500">
          Bento grid, XP bars, quests, and the rest of the game loop land in
          later phases.
        </p>
      </div>
    </main>
  );
}
