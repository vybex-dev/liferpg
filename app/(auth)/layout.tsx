import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      id="main-content"
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-12"
    >
      {/* Ambient glow orbs behind the card — deliberate, not a flat gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-xp-violet/20 blur-[100px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-xp-cyan/15 blur-[100px]"
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="glass flex h-12 w-12 items-center justify-center rounded-bento-sm shadow-glow-violet">
            <Sparkles className="h-5 w-5 text-xp-cyan" strokeWidth={2} />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-100">
            Life RPG
          </h1>
        </div>

        {children}
      </div>
    </main>
  );
}
