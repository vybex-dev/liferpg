# Life RPG — Project Structure (through Phase 2)

```
liferpg/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx        # shared gradient/glow backdrop for auth pages
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── actions/
│   │   └── auth.ts           # server actions: signup, login, logout
│   ├── dashboard/
│   │   └── page.tsx          # protected placeholder — verifies auth flow
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── favicon.ico
├── lib/
│   └── supabase/
│       ├── client.ts
│       └── server.ts
├── supabase/
│   ├── schema.sql                  # Phase 1: tables + RLS
│   └── phase2_auth_trigger.sql     # Phase 2: updated signup trigger
├── .env.example
├── .env.local            (you create this, gitignored)
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── tsconfig.json
├── package.json
└── middleware.ts          # session refresh + /dashboard route guard
```

Still nothing beyond this — no bento grid, no task/XP logic, no components/
library yet. Those are later phases.
