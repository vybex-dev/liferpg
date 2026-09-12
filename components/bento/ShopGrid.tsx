"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Coins, Loader2 } from "lucide-react";
import { equipItem, purchaseItem } from "@/app/actions/tasks";
import { ErrorToast } from "@/components/ui/ErrorToast";
import { itemTypeIcon } from "@/lib/game/item-icons";
import type { ShopItem } from "@/lib/game/types";

type ShopGridProps = {
  initialGold: number;
  items: ShopItem[];
  initialOwnedIds: string[];
  initialEquippedTitle: string | null;
  initialEquippedAura: string | null;
};

const TOAST_DURATION_MS = 5000;

/** Item types that have a slot on the profile and can be equipped. */
function isEquippable(type: string): type is "title" | "aura" {
  return type === "title" || type === "aura";
}

export function ShopGrid({
  initialGold,
  items,
  initialOwnedIds,
  initialEquippedTitle,
  initialEquippedAura,
}: ShopGridProps) {
  const [gold, setGold] = useState(initialGold);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(
    () => new Set(initialOwnedIds)
  );
  const [equippedTitle, setEquippedTitle] = useState(initialEquippedTitle);
  const [equippedAura, setEquippedAura] = useState(initialEquippedAura);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  async function handlePurchase(item: ShopItem) {
    if (pendingItemId || ownedIds.has(item.id)) return;

    if (gold < item.cost) {
      showToast("You don't have enough gold for that.");
      return;
    }

    setPendingItemId(item.id);

    // Optimistic: deduct the cost and mark it owned immediately.
    const prevGold = gold;
    setGold((g) => g - item.cost);
    setOwnedIds((prev) => new Set(prev).add(item.id));

    try {
      const result = await purchaseItem(item.id);

      if (!result.success) {
        // Roll back both the balance and the ownership flag together.
        setGold(prevGold);
        setOwnedIds((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        showToast(result.error);
      } else {
        // Reconcile with the server's authoritative balance.
        setGold(result.data.newGold);
      }
    } catch {
      // Request never completed a round trip (offline, dropped
      // connection) — roll back the same way a handled failure
      // would rather than leaving a phantom purchase on screen.
      setGold(prevGold);
      setOwnedIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
      showToast("Couldn't reach the server. Check your connection and try again.");
    }

    setPendingItemId(null);
  }

  async function handleEquip(item: ShopItem) {
    if (pendingItemId || !isEquippable(item.type)) return;

    const slot = item.type;
    const isCurrentlyEquipped =
      slot === "title" ? equippedTitle === item.name : equippedAura === item.name;

    setPendingItemId(item.id);

    // Optimistic: toggle this item's slot immediately. Equipping
    // one item always replaces whatever else occupied that slot,
    // which the equip_item RPC enforces the same way server-side.
    const prevTitle = equippedTitle;
    const prevAura = equippedAura;
    if (slot === "title") {
      setEquippedTitle(isCurrentlyEquipped ? null : item.name);
    } else {
      setEquippedAura(isCurrentlyEquipped ? null : item.name);
    }

    try {
      const result = await equipItem(item.id);

      if (!result.success) {
        setEquippedTitle(prevTitle);
        setEquippedAura(prevAura);
        showToast(result.error);
      } else {
        // Reconcile with the server's authoritative slot state.
        setEquippedTitle(result.data.equippedTitle);
        setEquippedAura(result.data.equippedAura);
      }
    } catch {
      setEquippedTitle(prevTitle);
      setEquippedAura(prevAura);
      showToast("Couldn't reach the server. Check your connection and try again.");
    }

    setPendingItemId(null);
  }

  return (
    <>
      <div className="glass mb-4 flex items-center justify-between rounded-bento-lg px-5 py-4 md:mb-5">
        <span className="text-xs text-zinc-500">Your balance</span>
        <div className="flex items-center gap-1.5">
          <Coins className="h-4 w-4 text-gold" strokeWidth={2} />
          <span className="font-display text-lg font-semibold text-gold-bright">
            {gold.toLocaleString()}
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="glass flex flex-col items-center justify-center rounded-bento-lg px-6 py-16 text-center">
          <p className="font-display text-base font-medium text-zinc-200">
            The shop is empty
          </p>
          <p className="mt-1.5 max-w-xs text-sm text-zinc-500">
            Nothing&apos;s for sale yet — check back once the catalog has
            been seeded.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const owned = ownedIds.has(item.id);
            const isPending = pendingItemId === item.id;
            const canAfford = gold >= item.cost;
            const Icon = itemTypeIcon(item.type);
            const equippable = isEquippable(item.type);
            const equipped =
              equippable &&
              (item.type === "title"
                ? equippedTitle === item.name
                : equippedAura === item.name);

            return (
              <motion.div
                key={item.id}
                whileHover={
                  (owned && !equippable) || (!owned && !canAfford)
                    ? undefined
                    : { y: -3 }
                }
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`glass flex flex-col justify-between rounded-bento-md p-5 transition-[opacity,box-shadow] duration-200 ${
                  (!owned && canAfford) || (owned && equippable)
                    ? "glass-interactive glow-edge"
                    : ""
                } ${!owned && !canAfford ? "opacity-70" : ""}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-xp-violet" strokeWidth={1.75} />
                    {owned && (
                      <span
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          equipped
                            ? "bg-xp-glow text-space-950"
                            : "bg-xp-cyan/15 text-xp-cyan"
                        }`}
                      >
                        <Check className="h-3 w-3" strokeWidth={2.5} />
                        {equipped ? "Equipped" : "Owned"}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 font-display text-base font-medium text-zinc-100">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-xs capitalize text-zinc-500">
                    {item.type}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Coins className="h-3.5 w-3.5 text-gold" strokeWidth={2} />
                    <span className="text-sm font-medium text-gold-bright">
                      {item.cost.toLocaleString()}
                    </span>
                  </div>

                  <motion.button
                    type="button"
                    whileTap={
                      owned && !equippable ? undefined : { scale: 0.95 }
                    }
                    onClick={() =>
                      owned
                        ? equippable
                          ? handleEquip(item)
                          : undefined
                        : handlePurchase(item)
                    }
                    disabled={
                      isPending || (owned ? !equippable : !canAfford)
                    }
                    className={`rounded-bento-sm px-3.5 py-2 text-xs font-medium transition-[opacity,box-shadow] duration-200 ${
                      !owned
                        ? canAfford
                          ? "bg-xp-glow text-space-950 shadow-neu-raised-sm hover:opacity-90"
                          : "cursor-not-allowed bg-space-800 text-zinc-600 shadow-neu-pressed"
                        : equippable
                          ? equipped
                            ? "bg-xp-cyan/15 text-xp-cyan shadow-neu-pressed hover:bg-xp-cyan/25"
                            : "bg-xp-glow text-space-950 shadow-neu-raised-sm hover:opacity-90"
                          : "cursor-default bg-white/[0.04] text-zinc-600"
                    }`}
                  >
                    {isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : !owned ? (
                      canAfford ? (
                        "Buy"
                      ) : (
                        "Can't afford"
                      )
                    ) : equippable ? (
                      equipped ? (
                        "Unequip"
                      ) : (
                        "Equip"
                      )
                    ) : (
                      "Owned"
                    )}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <ErrorToast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
