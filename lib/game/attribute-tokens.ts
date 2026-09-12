import type { AttributeName } from "./types";

/**
 * Tailwind's compiler only picks up classes it can see as literal
 * strings in source — a template string like `text-attr-${name}`
 * would get purged in production. This lookup keeps every class
 * name literal so nothing silently disappears at build time.
 */
type AttributeTokens = {
  text: string;
  bar: string;
  glow: string;
  border: string;
};

const ATTRIBUTE_TOKENS: Record<AttributeName, AttributeTokens> = {
  Strength: {
    text: "text-attr-strength",
    bar: "bg-attr-strength",
    glow: "shadow-[0_0_20px_0_rgba(244,63,94,0.35)]",
    border: "border-attr-strength/25",
  },
  Intellect: {
    text: "text-attr-intellect",
    bar: "bg-attr-intellect",
    glow: "shadow-[0_0_20px_0_rgba(56,189,248,0.35)]",
    border: "border-attr-intellect/25",
  },
  Discipline: {
    text: "text-attr-discipline",
    bar: "bg-attr-discipline",
    glow: "shadow-[0_0_20px_0_rgba(163,230,53,0.35)]",
    border: "border-attr-discipline/25",
  },
  Charisma: {
    text: "text-attr-charisma",
    bar: "bg-attr-charisma",
    glow: "shadow-[0_0_20px_0_rgba(232,121,249,0.35)]",
    border: "border-attr-charisma/25",
  },
  Vitality: {
    text: "text-attr-vitality",
    bar: "bg-attr-vitality",
    glow: "shadow-[0_0_20px_0_rgba(251,146,60,0.35)]",
    border: "border-attr-vitality/25",
  },
};

export function attributeTokens(name: string): AttributeTokens {
  return (
    ATTRIBUTE_TOKENS[name as AttributeName] ?? {
      text: "text-zinc-400",
      bar: "bg-zinc-500",
      glow: "",
      border: "border-glass-border",
    }
  );
}
