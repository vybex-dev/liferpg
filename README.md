# Life RPG

Turn your real-life to-dos into an RPG character sheet. Add a task, complete
it, and watch XP, gold, streaks, and per-category attributes (Strength,
Intellect, Discipline, Charisma, Vitality) move in real time — all backed by
a Postgres database so nothing resets on refresh.

## Design: "Neon Glass Bento"

Frosted-glass cards float in an asymmetric bento grid over a deep-space
gradient, with a violet-to-cyan glow reserved for XP/leveling and a distinct
warm gold reserved for currency, so the two numbers that matter most in an
RPG are never visually confused with each other. Motion is deliberately
restrained: there's exactly one big orchestrated moment (the level-up
overlay) and everything else only animates in direct response to something
you clicked.

## Tech stack

- **Framework:** Next.js 14 (App Router, Server Actions, Suspense streaming)
- **Database / Auth:** Supabase (Postgres, Row Level Security, Auth)
- **Styling:** Tailwind CSS (custom design tokens, no component library)
- **Animation:** Framer Motion
- **Icons:** lucide-react
- **Language:** TypeScript throughout
- **Hosting:** Vercel

All game logic — XP math, leveling, streaks, gold, purchases — runs as
Postgres functions called via RPC, never in client code. See
`supabase/phase3_game_logic.sql` for the source of truth; `lib/game/leveling.ts`
is a read-only mirror used purely to render progress bars without a round trip.

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/vybex-dev/liferpg.git
cd liferpg
npm install
```

### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, and open
**Settings → API**. You'll need the **Project URL** and the **anon public**
key in the next step.

### 3. Set environment variables

```bash
cp .env.example .env.local
```

Fill in the two values from step 2:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Run the database migrations

Open the **SQL Editor** in your Supabase project and run these files **in
this exact order** (each one depends on the tables/functions the previous
one created):

1. `supabase/schema.sql` — creates `profiles`, `attributes`, `tasks`,
   `items`, `user_items`, and enables Row Level Security on every table.
2. `supabase/phase2_auth_trigger.sql` — creates the trigger that
   auto-provisions a level-1 profile the moment someone signs up.
3. `supabase/phase3_game_logic.sql` — creates the `complete_task` and
   `purchase_item` RPC functions where all XP/level/gold/streak math
   actually happens, atomically.
4. `supabase/phase5_seed_items.sql` — seeds the shop with cosmetic items
   so it isn't empty on first load.
5. `supabase/phase6_equip_items.sql` — adds equipped title/aura fields
   and the server-side item equip functionality.
6. `supabase/phase7_security_hardening.sql` — locks down table
   privileges so game state can only change through the RPCs above,
   not through a direct API/table write. See **Security** below.
   `schema.sql` (step 1) already creates a fresh project with this
   hardened configuration, so this file is idempotent/a no-op on a
   brand-new project — it only matters if your project's tables were
   created before this step existed. Run it either way; it's safe to
   re-run any number of times.

Paste each file's contents into the SQL Editor and click **Run**, one at a
time, in order.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on
`/login` if signed out, or `/dashboard` if you already have a session.

## Project structure

```
liferpg/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx           # shared gradient/glow backdrop
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── actions/
│   │   ├── auth.ts              # signup, login, logout server actions
│   │   └── tasks.ts             # createTask, deleteTask, completeTask, purchaseItem
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── DashboardData.tsx    # server-side data fetch
│   │   └── shop/
│   ├── layout.tsx                # fonts, skip link, <html lang>
│   ├── page.tsx                  # redirects to /dashboard or /login
│   └── globals.css               # design tokens, focus rings, reduced-motion
├── components/
│   ├── bento/                    # HeroCard, StreakCard, GoldCard, AttributeRow,
│   │                              # TaskListCard, ShopGrid, skeletons, empty states
│   ├── dashboard/DashboardShell.tsx  # client state, optimistic updates, rollback
│   ├── game/LevelUpModal.tsx     # the one big animation moment
│   └── ui/ErrorToast.tsx
├── lib/
│   ├── game/                     # leveling math (display-only), category/attribute maps
│   └── supabase/                 # browser + server Supabase clients
├── supabase/                     # SQL migrations, run in numbered order
├── middleware.ts                 # session refresh + /dashboard route guard
└── tailwind.config.ts            # Neon Glass Bento design tokens
```

## Security

- **Row Level Security** on every table restricts every read to
  `auth.uid()`'s own rows (or, for the shared `items` catalog, to any
  signed-in user). There is no path for one user to read or write
  another user's profile, attributes, tasks, or inventory.
- **Game state is not client-authoritative.** `profiles`, `attributes`,
  and `user_items` are SELECT-only for the `authenticated` role at the
  database privilege level (not just RLS) — a direct API call, not
  just the app's own UI, is rejected. XP, level, gold, streaks,
  attribute progression, and inventory ownership are only ever
  written by the SECURITY DEFINER RPCs in `phase3_game_logic.sql`
  (`complete_task`, `purchase_item`) and `phase6_equip_items.sql`
  (`equip_item`), each of which derives the current user from
  `auth.uid()` and re-validates ownership/eligibility/cost server-side
  — a client can request "complete this task" or "buy this item" but
  can't supply the resulting XP, gold, level, or price.
- **Tasks** keep normal client CRUD (create/edit/delete your own
  task's title, category, and XP value), but `is_completed`,
  `completed_at`, and `user_id` are excluded from the client's column
  privileges on `INSERT`/`UPDATE`, so a task can only be marked
  complete by calling `complete_task()`.
- See `supabase/phase7_security_hardening.sql` for the full rationale
  and the specific privileges this closes off.

## Accessibility notes

- Full keyboard navigation, with a themed focus-visible ring (not the
  default blue outline) on every interactive element.
- The level-up modal is a proper `role="dialog"` with a focus trap, focus
  restoration on close, and a visible close button — not just click-to-dismiss.
- XP/level progress bars expose `aria-valuetext` so screen readers announce
  meaningful progress, not just a raw percentage.
- Respects `prefers-reduced-motion`: the level-up burst and count-up are
  skipped in favor of a plain state change.
- A skip-to-content link is available on every page for keyboard users.

## Disclosure

In the interest of full transparency for judging, everything used to build
this project:

- **Next.js**, **React**, and **TypeScript** — application framework and language.
- **Supabase** — Postgres database, authentication, and Row Level Security.
- **Tailwind CSS** — utility-first styling; no external component library.
- **Framer Motion** — animation (the level-up sequence, optimistic UI transitions).
- **lucide-react** — icon set.
- **Vercel** — hosting and deployment.
- **Claude (Anthropic)** was used during development.

No other AI tools, code generators, or third-party APIs were used.
