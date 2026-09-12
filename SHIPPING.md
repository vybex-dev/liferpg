# Shipping Life RPG

Everything you need to deploy and submit, in order.

---

## 1. Vercel deployment checklist

- [ ] Push the repo to GitHub (public — see pre-submission checklist below).
- [ ] In [vercel.com/new](https://vercel.com/new), import the GitHub repo.
- [ ] Framework preset: Vercel auto-detects **Next.js** — leave build/output
      settings on their defaults (`npm run build`, `.next`).
- [ ] Under **Environment Variables**, add exactly these two (same names and
      values as your local `.env.local`):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Deploy.
- [ ] In your **Supabase** project, go to **Authentication → URL
      Configuration** and add your new Vercel URL (e.g.
      `https://your-project.vercel.app`) to both:
  - **Site URL**
  - **Redirect URLs**

  This step is required — without it, Supabase Auth will reject
  sign-up/login redirects from your deployed domain even though they work
  fine on `localhost`.
- [ ] Visit the deployed URL and run through signup → complete a task →
      refresh, to confirm the deployed database connection actually works
      (not just the build).
- [ ] If you rotate or regenerate your Supabase anon key at any point,
      update it in Vercel's Environment Variables and redeploy — Vercel
      does not pick up `.env.local` changes automatically since it never
      reads that file.

---

## 2. Demo video shot list (90–180 seconds)

Record in this order — it's also the order a judge will want to see cause
and effect (action → visible reward → proof it persisted).

| # | Beat | What to show | ~Time |
|---|------|---------------|-------|
| 1 | **Signup** | Land on `/login`, click through to `/signup`, fill in username/email/password, submit. Land on the dashboard as a fresh level-1 character. | 20s |
| 2 | **Login** | Log out (button top-right of dashboard), then log back in with the same credentials to prove the account persisted. | 15s |
| 3 | **Add a task** | On the dashboard, type a task title, pick a category (e.g. "Fitness"), set an XP reward, click Add. Show it appear in the quest log. | 15s |
| 4 | **Complete a task + level-up moment** | Click the checkbox. Narrate or pause on: the checkbox animating, the XP bar filling, the gold counter ticking up. Ideally pick/set an XP reward large enough to trigger an actual level-up here so the full-screen "Level Up" overlay fires — that's the single biggest visual payoff in the app. | 30–40s |
| 5 | **Refresh to prove persistence** | Hard refresh the browser (or reload the URL). Show the level, XP, gold, and completed task are exactly as they were — proving it's reading from Postgres, not local state. | 15s |

Optional, if you have time left: a 10-second pass through the shop
(`/dashboard/shop`) buying a cosmetic item with the gold just earned — it's
not a required beat, but it's the fastest way to show the currency system
is real and connected end-to-end.

**Recording tip:** trigger the level-up deliberately by setting a task's XP
reward high enough to cross the next level threshold (the XP bar on the
hero card shows "current / needed" — aim just over that gap) rather than
leaving it to chance.

---

## 3. Pre-submission checklist

- [ ] Repo is set to **Public** on GitHub.
- [ ] `README.md` disclosure section is present and accurate (AI tool use
      disclosed — see README's Disclosure section).
- [ ] `.env.local` is **not** committed (already covered by `.gitignore`;
      double-check with `git status` before your final push).
- [ ] `.env.example` is committed and has placeholder values only.
- [ ] Open the **live Vercel URL in an incognito/private window** (logged
      out, no cached session) and confirm:
  - [ ] `/` redirects to `/login` when signed out.
  - [ ] Signup works end-to-end and lands on the dashboard.
  - [ ] Completing a task updates XP/gold/streak visibly.
  - [ ] A hard refresh preserves all of the above.
- [ ] Open the browser DevTools console on the core flow (signup → add task
      → complete task → shop) and confirm there are **no red errors**.
- [ ] Confirm commit history reflects steady, phase-by-phase work (this is
      a stated judging criterion) — if you squashed commits, make sure the
      final history still reads as incremental rather than one giant commit.
- [ ] Demo video is uploaded/linked and hits all 5 required beats in order.
