# Life RPG — Phase 1 Project Structure

```
liferpg/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── favicon.ico
├── lib/
│   └── supabase/
│       ├── client.ts
│       └── server.ts
├── supabase/
│   └── schema.sql
├── .env.example
├── .env.local            (you create this, gitignored)
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── tsconfig.json
├── package.json
└── middleware.ts
```

Nothing beyond this exists yet — no components/, no hooks/, no api routes.
Those come in later phases. Phase 1 is scaffold + design tokens + DB schema only.
