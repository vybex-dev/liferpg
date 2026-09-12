import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShopGrid } from "@/components/bento/ShopGrid";
import type { ShopItem } from "@/lib/game/types";

export async function ShopData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profileRes, itemsRes, ownedRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("gold, equipped_title, equipped_aura")
      .eq("id", user.id)
      .single(),
    supabase
      .from("items")
      .select("id, name, cost, type")
      .order("cost", { ascending: true }),
    supabase.from("user_items").select("item_id").eq("user_id", user.id),
  ]);

  if (profileRes.error || !profileRes.data) {
    throw new Error(
      profileRes.error?.message ?? "Couldn't load your profile."
    );
  }

  const items = (itemsRes.data ?? []) as ShopItem[];
  const ownedIds = (ownedRes.data ?? []).map(
    (row) => row.item_id as string
  );

  return (
    <ShopGrid
      initialGold={profileRes.data.gold as number}
      items={items}
      initialOwnedIds={ownedIds}
      initialEquippedTitle={profileRes.data.equipped_title as string | null}
      initialEquippedAura={profileRes.data.equipped_aura as string | null}
    />
  );
}
