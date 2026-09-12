"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Coins, Loader2 } from "lucide-react";
import { purchaseItem } from "@/app/actions/tasks";
import { ErrorToast } from "@/components/ui/ErrorToast";
import { itemTypeIcon } from "@/lib/game/item-icons";
import type { ShopItem } from "@/lib/game/types";

type ShopGridProps = {
  initialGold: number;
  items: ShopItem[];
  initialOwnedIds: string[];
};

const TOAST_DURATION_MS = 5000;

export function ShopGrid({ initialGold, items, initialOwnedIds }: ShopGridProps) {
  const [gold, setGold] = useState(initialGold);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(
    () => new Set(initialOwnedIds)
  );
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

            return (
              <motion.div
                key={item.id}
                whileHover={owned ? undefined : { y: -3 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="glass flex flex-col justify-between rounded-bento-md p-5"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-xp-violet" strokeWidth={1.75} />
                    {owned && (
                      <span className="flex items-center gap-1 rounded-full bg-xp-cyan/15 px-2 py-0.5 text-[11px] font-medium text-xp-cyan">
                        <Check className="h-3 w-3" strokeWidth={2.5} />
                        Owned
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
                    whileTap={owned ? undefined : { scale: 0.95 }}
                    onClick={() => handlePurchase(item)}
                    disabled={owned || isPending || !canAfford}
                    className={`rounded-bento-sm px-3.5 py-2 text-xs font-medium transition-opacity ${
                      owned
                        ? "cursor-default bg-white/[0.04] text-zinc-600"
                        : "bg-xp-glow text-space-950 hover:opacity-90 disabled:opacity-40"
                    }`}
                  >
                    {isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : owned ? (
                      "Owned"
                    ) : canAfford ? (
                      "Buy"
                    ) : (
                      "Can't afford"
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
