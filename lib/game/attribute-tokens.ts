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
  /** Literal hover: variants — see note above on why these can't be
   *  built by concatenating "hover:" onto `glow`/`border` at runtime. */
  hoverGlow: string;
  hoverBorder: string;
};

const ATTRIBUTE_TOKENS: Record<AttributeName, AttributeTokens> = {
  Strength: {
    text: "text-attr-strength",
    bar: "bg-attr-strength",
    glow: "shadow-[0_0_20px_0_rgba(244,63,94,0.35)]",
    border: "border-attr-strength/25",
    hoverGlow: "hover:shadow-[0_0_24px_2px_rgba(244,63,94,0.4)]",
    hoverBorder: "hover:border-attr-strength/60",
  },
  Intellect: {
    text: "text-attr-intellect",
    bar: "bg-attr-intellect",
    glow: "shadow-[0_0_20px_0_rgba(56,189,248,0.35)]",
    border: "border-attr-intellect/25",
    hoverGlow: "hover:shadow-[0_0_24px_2px_rgba(56,189,248,0.4)]",
    hoverBorder: "hover:border-attr-intellect/60",
  },
  Discipline: {
    text: "text-attr-discipline",
    bar: "bg-attr-discipline",
    glow: "shadow-[0_0_20px_0_rgba(163,230,53,0.35)]",
    border: "border-attr-discipline/25",
    hoverGlow: "hover:shadow-[0_0_24px_2px_rgba(163,230,53,0.4)]",
    hoverBorder: "hover:border-attr-discipline/60",
  },
  Charisma: {
    text: "text-attr-charisma",
    bar: "bg-attr-charisma",
    glow: "shadow-[0_0_20px_0_rgba(232,121,249,0.35)]",
    border: "border-attr-charisma/25",
    hoverGlow: "hover:shadow-[0_0_24px_2px_rgba(232,121,249,0.4)]",
    hoverBorder: "hover:border-attr-charisma/60",
  },
  Vitality: {
    text: "text-attr-vitality",
    bar: "bg-attr-vitality",
    glow: "shadow-[0_0_20px_0_rgba(251,146,60,0.35)]",
    border: "border-attr-vitality/25",
    hoverGlow: "hover:shadow-[0_0_24px_2px_rgba(251,146,60,0.4)]",
    hoverBorder: "hover:border-attr-vitality/60",
  },
};

export function attributeTokens(name: string): AttributeTokens {
  return (
    ATTRIBUTE_TOKENS[name as AttributeName] ?? {
      text: "text-zinc-400",
      bar: "bg-zinc-500",
      glow: "",
      border: "border-glass-border",
      hoverGlow: "",
      hoverBorder: "hover:border-glass-border-strong",
    }
  );
}
