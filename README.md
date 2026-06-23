# 🧶 CrochetHub — Full-Stack Crochet App

Your complete crochet world: stitch counter, project tracker, yarn stash, social feed,
marketplace, gamification, journal, portfolio, commissions, and admin dashboard.

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

## Quick Start

### 1. Clone & install
```bash
git clone <your-repo>
cd crochethub
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 2. Set up Supabase
1. Go to [supabase.com](https://supabase.com) → New project
2. In the SQL Editor, paste and run **`supabase_schema.sql`** (in the project root)
3. Copy your **Project URL** and **anon key** from Settings → API

### 3. Configure environment variables

**Frontend** (`frontend/.env`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3001
```

**Backend** (`backend/.env`):
```env
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FRONTEND_URL=http://localhost:5173
```

> ⚠️ The service role key has full DB access — never expose it to the frontend.

### 4. Run the app

```bash
# From project root — runs both frontend and backend
npm run dev
```

Or separately:
```bash
# Frontend (http://localhost:5173)
cd frontend && npm run dev

# Backend (http://localhost:3001)
cd backend && npm run dev
```

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

## Making yourself an admin

After signing up, run this in the Supabase SQL Editor:

```sql
UPDATE public.profiles
SET is_admin = true
WHERE username = 'your-username';
```

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

## Deployment

### Frontend → Vercel / Netlify
```bash
cd frontend && npm run build
# Upload dist/ or connect repo
```

### Backend → Railway / Render / Fly.io
```bash
cd backend && npm run build
# Set env vars in your hosting dashboard
# Start command: node dist/index.js
```

---

## License
MIT — free to use, modify, and build on!
