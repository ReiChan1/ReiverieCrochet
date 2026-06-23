# 🧶 CrochetHub — Full-Stack Crochet App

Your complete crochet world: stitch counter, project tracker, yarn stash, social feed,
marketplace, gamification, journal, portfolio, commissions, and dashboard.

---

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18 · TypeScript · Tailwind CSS · Vite |
| Backend   | Node.js · Express · TypeScript          |
| Database  | Supabase (PostgreSQL + Auth + RLS)      |
| State     | Zustand · TanStack Query                |
| Charts    | Recharts                                |
| QR Code   | qrcode.react                            |

---


## Features

| Module              | Description                                             |
|---------------------|---------------------------------------------------------|
| 🔐 Auth             | Email signup/login, admin roles, RLS protection         |
| 📊 Dashboard        | Overview stats, project progress, activity chart        |
| 🧮 Stitch Counter   | Live counter with row tracking, keyboard shortcuts, XP  |
| 📋 Projects         | Kanban-style tracker with Yarn + Hook + progress bar    |
| 📖 Patterns         | Build, save, publish patterns with stitch sequences     |
| 🧶 Yarn Stash       | Color swatch, weight, fiber, skein count tracker        |
| 🪝 Hook Collection  | Size, brand, condition tracker                          |
| 🌸 Social Feed      | Posts, likes, community sharing                         |
| 👯 Friends & QR     | Add friends by username or QR code scan                 |
| 🛍️ Marketplace     | Buy/sell/download patterns                              |
| 📈 Stats            | Recharts: stitch activity, hook usage, yarn breakdown   |
| 🏆 Quests & XP      | Level system, badges, global leaderboard                |
| 📓 Journal          | Daily entries with mood, yarn, hook tracking            |
| 💼 Portfolio        | Public page with QR business card                       |
| 🧾 Orders           | Commission management with revenue tracking             |
| 🛡️ Admin           | Full user management, platform stats, content moderation |

---

## Project Structure

```
crochethub/
├── supabase_schema.sql        ← Run this in Supabase first!
├── frontend/
│   ├── src/
│   │   ├── App.tsx            ← Router + auth setup
│   │   ├── main.tsx
│   │   ├── index.css          ← Tailwind + global styles
│   │   ├── components/
│   │   │   ├── ui/index.tsx   ← Button, Input, Card, Modal, Badge...
│   │   │   └── layout/        ← AppLayout, Sidebar, Topbar
│   │   ├── pages/             ← One file per route (15 pages)
│   │   ├── store/             ← Zustand auth store
│   │   ├── lib/               ← Supabase client
│   │   └── types/             ← All TypeScript interfaces
│   ├── tailwind.config.ts
│   └── vite.config.ts
└── backend/
    └── src/
        ├── index.ts           ← Express server entry
        ├── lib/supabase.ts    ← Admin client (service role)
        ├── middleware/auth.ts ← JWT auth + admin check
        └── routes/
            ├── admin.ts       ← /api/admin/*
            ├── xp.ts          ← /api/xp/*
            └── profiles.ts    ← /api/profiles/*
```

---

## License
MIT — free to use, modify, and build on!
