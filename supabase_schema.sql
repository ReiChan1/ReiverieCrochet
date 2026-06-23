-- ============================================================
-- CrochetHub — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- PROFILES (extends Supabase auth.users)
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  username      text unique not null,
  display_name  text,
  avatar_url    text,
  bio           text,
  location      text,
  level         int default 1,
  xp            int default 0,
  total_stitches bigint default 0,
  is_admin      boolean default false,
  open_for_commissions boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- YARN STASH
-- ─────────────────────────────────────────────────────────────
create table public.yarn_stash (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade,
  name        text not null,
  brand       text,
  color_name  text,
  color_hex   text,
  weight      text,  -- Lace, Fingering, DK, Worsted, Bulky, etc.
  fiber       text,
  yardage     int,
  skeins      numeric(5,2) default 1,
  dye_lot     text,
  notes       text,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- HOOK COLLECTION
-- ─────────────────────────────────────────────────────────────
create table public.hooks (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade,
  size_mm     numeric(4,1) not null,
  size_us     text,
  brand       text,
  material    text,  -- Aluminum, Steel, Bamboo, Ergonomic
  condition   text default 'Good',  -- Good, Worn, New
  notes       text,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- PATTERNS
-- ─────────────────────────────────────────────────────────────
create table public.patterns (
  id            uuid default uuid_generate_v4() primary key,
  user_id       uuid references public.profiles(id) on delete cascade,
  title         text not null,
  description   text,
  difficulty    text default 'Beginner',  -- Beginner, Intermediate, Advanced
  category      text,  -- Blanket, Amigurumi, Wearable, Accessory, Home
  hook_size_mm  numeric(4,1),
  yarn_weight   text,
  yarn_name     text,
  stitch_sequence text,
  gauge         text,
  is_public     boolean default false,
  is_for_sale   boolean default false,
  price         numeric(10,2),
  download_count int default 0,
  tags          text[],
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- PROJECTS
-- ─────────────────────────────────────────────────────────────
create table public.projects (
  id            uuid default uuid_generate_v4() primary key,
  user_id       uuid references public.profiles(id) on delete cascade,
  pattern_id    uuid references public.patterns(id) on delete set null,
  title         text not null,
  status        text default 'planned',  -- planned, in_progress, completed, frogged
  yarn_id       uuid references public.yarn_stash(id) on delete set null,
  hook_id       uuid references public.hooks(id) on delete set null,
  yarn_name     text,
  hook_size_mm  numeric(4,1),
  total_rows    int,
  current_row   int default 0,
  total_stitches bigint default 0,
  notes         text,
  started_at    date,
  finished_at   date,
  tags          text[],
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- STITCH COUNTER SESSIONS
-- ─────────────────────────────────────────────────────────────
create table public.stitch_sessions (
  id            uuid default uuid_generate_v4() primary key,
  user_id       uuid references public.profiles(id) on delete cascade,
  project_id    uuid references public.projects(id) on delete set null,
  row_number    int not null,
  stitch_count  int not null,
  notes         text,
  recorded_at   timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- SOCIAL POSTS (feed)
-- ─────────────────────────────────────────────────────────────
create table public.posts (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade,
  project_id  uuid references public.projects(id) on delete set null,
  content     text not null,
  image_url   text,
  likes       int default 0,
  tags        text[],
  created_at  timestamptz default now()
);

create table public.post_likes (
  post_id   uuid references public.posts(id) on delete cascade,
  user_id   uuid references public.profiles(id) on delete cascade,
  primary key (post_id, user_id)
);

create table public.comments (
  id          uuid default uuid_generate_v4() primary key,
  post_id     uuid references public.posts(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  content     text not null,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- FRIENDSHIPS (QR-based)
-- ─────────────────────────────────────────────────────────────
create table public.friendships (
  id          uuid default uuid_generate_v4() primary key,
  requester   uuid references public.profiles(id) on delete cascade,
  addressee   uuid references public.profiles(id) on delete cascade,
  status      text default 'pending',  -- pending, accepted, blocked
  created_at  timestamptz default now(),
  unique(requester, addressee)
);

-- ─────────────────────────────────────────────────────────────
-- MARKETPLACE PURCHASES
-- ─────────────────────────────────────────────────────────────
create table public.purchases (
  id          uuid default uuid_generate_v4() primary key,
  buyer_id    uuid references public.profiles(id) on delete cascade,
  pattern_id  uuid references public.patterns(id) on delete cascade,
  price_paid  numeric(10,2),
  purchased_at timestamptz default now(),
  unique(buyer_id, pattern_id)
);

-- ─────────────────────────────────────────────────────────────
-- CROCHET JOURNAL
-- ─────────────────────────────────────────────────────────────
create table public.journal_entries (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade,
  project_id  uuid references public.projects(id) on delete set null,
  content     text not null,
  mood        text,  -- relaxed, focused, happy, frustrated, creative
  yarn_used   text,
  hook_size   text,
  stitches_today int default 0,
  entry_date  date default current_date,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- QUESTS / GAMIFICATION
-- ─────────────────────────────────────────────────────────────
create table public.badges (
  id          uuid default uuid_generate_v4() primary key,
  name        text unique not null,
  description text,
  icon        text,
  xp_reward   int default 50
);

create table public.user_badges (
  user_id   uuid references public.profiles(id) on delete cascade,
  badge_id  uuid references public.badges(id) on delete cascade,
  earned_at timestamptz default now(),
  primary key (user_id, badge_id)
);

-- Seed badges
insert into public.badges (name, description, icon, xp_reward) values
  ('First Stitch',      'Record your very first stitch',         '🧶', 10),
  ('1K Stitches',       'Reach 1,000 total stitches',            '🏆', 50),
  ('10K Stitches',      'Reach 10,000 total stitches',           '⭐', 150),
  ('First Project',     'Create your first project',             '📋', 20),
  ('Pattern Maker',     'Publish your first pattern',            '📖', 75),
  ('Social Butterfly',  'Add 5 friends via QR code',             '👯', 40),
  ('Week Streak',       'Crochet 7 days in a row',               '🔥', 60),
  ('Month Streak',      'Crochet 30 days in a row',              '🌟', 200),
  ('Marketplace Pro',   'Sell 10 patterns',                      '💰', 100),
  ('Yarn Hoarder',      'Add 20+ skeins to your stash',          '🎀', 30);

-- ─────────────────────────────────────────────────────────────
-- COMMISSION ORDERS
-- ─────────────────────────────────────────────────────────────
create table public.orders (
  id            uuid default uuid_generate_v4() primary key,
  crafter_id    uuid references public.profiles(id) on delete cascade,
  client_name   text not null,
  client_email  text,
  item_name     text not null,
  yarn_name     text,
  hook_size     text,
  price         numeric(10,2),
  status        text default 'pending',  -- pending, in_progress, completed, cancelled
  notes         text,
  due_date      date,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- ROW-LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────
alter table public.profiles         enable row level security;
alter table public.yarn_stash       enable row level security;
alter table public.hooks            enable row level security;
alter table public.patterns         enable row level security;
alter table public.projects         enable row level security;
alter table public.stitch_sessions  enable row level security;
alter table public.posts            enable row level security;
alter table public.post_likes       enable row level security;
alter table public.comments         enable row level security;
alter table public.friendships      enable row level security;
alter table public.purchases        enable row level security;
alter table public.journal_entries  enable row level security;
alter table public.user_badges      enable row level security;
alter table public.orders           enable row level security;

-- Profiles: public read, owner write
create policy "profiles_public_read"  on public.profiles for select using (true);
create policy "profiles_owner_update" on public.profiles for update using (auth.uid() = id);

-- Yarn stash: owner only
create policy "yarn_owner" on public.yarn_stash for all using (auth.uid() = user_id);

-- Hooks: owner only
create policy "hooks_owner" on public.hooks for all using (auth.uid() = user_id);

-- Patterns: public read if is_public, owner write
create policy "patterns_public_read" on public.patterns for select using (is_public = true or auth.uid() = user_id);
create policy "patterns_owner_write" on public.patterns for insert with check (auth.uid() = user_id);
create policy "patterns_owner_update" on public.patterns for update using (auth.uid() = user_id);
create policy "patterns_owner_delete" on public.patterns for delete using (auth.uid() = user_id);

-- Projects: owner only
create policy "projects_owner" on public.projects for all using (auth.uid() = user_id);

-- Stitch sessions: owner only
create policy "sessions_owner" on public.stitch_sessions for all using (auth.uid() = user_id);

-- Posts: public read, owner write
create policy "posts_public_read"  on public.posts for select using (true);
create policy "posts_owner_write"  on public.posts for insert with check (auth.uid() = user_id);
create policy "posts_owner_update" on public.posts for update using (auth.uid() = user_id);
create policy "posts_owner_delete" on public.posts for delete using (auth.uid() = user_id);

-- Post likes: authenticated
create policy "likes_read"   on public.post_likes for select using (true);
create policy "likes_write"  on public.post_likes for insert with check (auth.uid() = user_id);
create policy "likes_delete" on public.post_likes for delete using (auth.uid() = user_id);

-- Comments: public read, owner write
create policy "comments_read"  on public.comments for select using (true);
create policy "comments_write" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments_delete" on public.comments for delete using (auth.uid() = user_id);

-- Friendships: participants only
create policy "friendships_read"  on public.friendships for select using (auth.uid() = requester or auth.uid() = addressee);
create policy "friendships_write" on public.friendships for insert with check (auth.uid() = requester);
create policy "friendships_update" on public.friendships for update using (auth.uid() = addressee);

-- Purchases: buyer only
create policy "purchases_owner" on public.purchases for all using (auth.uid() = buyer_id);

-- Journal: owner only
create policy "journal_owner" on public.journal_entries for all using (auth.uid() = user_id);

-- Badges: public read
create policy "badges_public_read" on public.badges for select using (true);
create policy "user_badges_read"   on public.user_badges for select using (true);
create policy "user_badges_write"  on public.user_badges for insert with check (auth.uid() = user_id);

-- Orders: crafter only
create policy "orders_owner" on public.orders for all using (auth.uid() = crafter_id);

-- ─────────────────────────────────────────────────────────────
-- FUNCTIONS & TRIGGERS
-- ─────────────────────────────────────────────────────────────

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- XP level-up function (every 500 XP = 1 level)
create or replace function public.update_xp(p_user_id uuid, p_xp int)
returns void language plpgsql security definer as $$
declare
  new_xp int;
  new_level int;
begin
  update public.profiles
  set xp = xp + p_xp
  where id = p_user_id
  returning xp into new_xp;

  new_level := floor(new_xp / 500) + 1;

  update public.profiles
  set level = new_level
  where id = p_user_id;
end;
$$;

-- Update total_stitches on stitch session insert
create or replace function public.sync_total_stitches()
returns trigger language plpgsql as $$
begin
  update public.profiles
  set total_stitches = total_stitches + new.stitch_count
  where id = new.user_id;
  return new;
end;
$$;

create trigger after_stitch_session
  after insert on public.stitch_sessions
  for each row execute function public.sync_total_stitches();
