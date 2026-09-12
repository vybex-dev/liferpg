import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { ParticleField } from "@/components/ui/ParticleField";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const DESCRIPTION =
  "Turn your real life into an RPG progression system — complete real tasks, earn XP and gold, level up your attributes, and gear out your hero in the shop.";

export const metadata: Metadata = {
  // Falls back to localhost in dev; set NEXT_PUBLIC_SITE_URL in your
  // deployment environment so absolute URLs (Open Graph images,
  // canonical links) resolve to the real production domain.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Life RPG",
    template: "%s · Life RPG",
  },
  description: DESCRIPTION,
  keywords: [
    "life rpg",
    "productivity",
    "gamification",
    "habit tracker",
    "task manager",
    "xp system",
    "leveling up",
  ],
  applicationName: "Life RPG",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "Life RPG",
    description: DESCRIPTION,
    siteName: "Life RPG",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Life RPG",
    description: DESCRIPTION,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#05050a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body>
        <ParticleField />
        <a href="#main-content" className="sr-only sr-only-focusable">
          Skip to main content
        </a>
        {children}
        <CustomCursor />
      </body>
    </html>
  );
}
