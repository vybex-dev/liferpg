import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// The root route has no content of its own — it just routes the
// visitor to the right place based on auth state. Signed-in users
// go straight to their dashboard; everyone else lands on login.
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/dashboard" : "/login");
}
