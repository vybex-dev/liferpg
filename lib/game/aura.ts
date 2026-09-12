/**
 * Maps an equipped aura item's name (profiles.equipped_aura) to the
 * avatar's background gradient class in HeroCard. Tailwind only
 * picks up classes that appear as literal strings in source — a
 * template string built from the item name at runtime would get
 * purged in production — so this stays a fixed lookup, the same
 * pattern as ATTRIBUTE_TOKENS in attribute-tokens.ts.
 *
 * Falls back to the app's default violet -> cyan gradient when no
 * aura is equipped, or when an aura's name doesn't have a specific
 * look defined here yet — so adding a new aura item to the shop's
 * catalog without also adding an entry here degrades gracefully
 * instead of breaking the hero card.
 */
const AURA_GRADIENTS: Record<string, string> = {
  "violet aura": "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-600",
  "cyan aura": "bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600",
};

const DEFAULT_AURA_GRADIENT = "bg-xp-glow";

export function auraGradientClass(auraName: string | null | undefined): string {
  if (!auraName) return DEFAULT_AURA_GRADIENT;
  return AURA_GRADIENTS[auraName.toLowerCase()] ?? DEFAULT_AURA_GRADIENT;
}
