import { Award, Crown, Flag, Frame, Shirt, Sparkles, type LucideIcon } from "lucide-react";

const ITEM_TYPE_ICONS: Record<string, LucideIcon> = {
  aura: Sparkles,
  cosmetic: Shirt,
  frame: Frame,
  banner: Flag,
  title: Award,
};

/** Falls back to Crown for any item type outside the known set. */
export function itemTypeIcon(type: string): LucideIcon {
  return ITEM_TYPE_ICONS[type.toLowerCase()] ?? Crown;
}
