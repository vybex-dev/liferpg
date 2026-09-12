import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep space background system
        space: {
          950: "#05050a",
          900: "#0a0a14",
          800: "#12121f",
          700: "#1a1a2e",
        },
        // Violet → Cyan glow (XP / leveling / progression)
        xp: {
          violet: "#8b5cf6",
          "violet-dim": "#6d28d9",
          cyan: "#22d3ee",
          "cyan-dim": "#0891b2",
        },
        // Warm gold (currency, distinct from XP palette on purpose)
        gold: {
          DEFAULT: "#f5b942",
          bright: "#ffd166",
          dim: "#b8862f",
          muted: "#8a6a3a",
        },
        // Glass surface + border tones
        glass: {
          surface: "rgba(255, 255, 255, 0.04)",
          "surface-strong": "rgba(255, 255, 255, 0.07)",
          border: "rgba(255, 255, 255, 0.08)",
          "border-strong": "rgba(255, 255, 255, 0.14)",
        },
        // Attribute accent colors (Strength, Intellect, Discipline, etc.)
        attr: {
          strength: "#f43f5e",
          intellect: "#38bdf8",
          discipline: "#a3e635",
          charisma: "#e879f9",
          vitality: "#fb923c",
        },
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      backgroundImage: {
        "space-gradient":
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(139, 92, 246, 0.15), transparent), radial-gradient(ellipse 60% 50% at 90% 90%, rgba(34, 211, 238, 0.1), transparent), linear-gradient(180deg, #05050a 0%, #0a0a14 100%)",
        "xp-glow": "linear-gradient(90deg, #8b5cf6 0%, #22d3ee 100%)",
        "gold-glow": "linear-gradient(135deg, #ffd166 0%, #f5b942 60%, #b8862f 100%)",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glow-violet": "0 0 24px 0 rgba(139, 92, 246, 0.35)",
        "glow-cyan": "0 0 24px 0 rgba(34, 211, 238, 0.35)",
        "glow-gold": "0 0 24px 0 rgba(245, 185, 66, 0.35)",
      },
      borderRadius: {
        "bento-sm": "1rem",
        "bento-md": "1.5rem",
        "bento-lg": "2rem",
        "bento-xl": "2.5rem",
      },
    },
  },
  plugins: [
    function ({ addUtilities }: any) {
      addUtilities({
        ".glass": {
          backgroundColor: "rgba(255, 255, 255, 0.04)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        },
        ".glass-strong": {
          backgroundColor: "rgba(255, 255, 255, 0.07)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.45)",
        },
      });
    },
  ],
};

export default config;
