// ─────────────────────────────────────────────────────────────
// CrochetHub — Shared TypeScript Types
// ─────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  level: number
  xp: number
  total_stitches: number
  is_admin: boolean
  open_for_commissions: boolean
  created_at: string
  updated_at: string
}

export interface YarnStash {
  id: string
  user_id: string
  name: string
  brand: string | null
  color_name: string | null
  color_hex: string | null
  weight: 'Lace' | 'Fingering' | 'Sport' | 'DK' | 'Worsted' | 'Bulky' | 'Super Bulky' | null
  fiber: string | null
  yardage: number | null
  skeins: number
  dye_lot: string | null
  notes: string | null
  created_at: string
}

export interface Hook {
  id: string
  user_id: string
  size_mm: number
  size_us: string | null
  brand: string | null
  material: 'Aluminum' | 'Steel' | 'Bamboo' | 'Ergonomic' | 'Plastic' | null
  condition: 'New' | 'Good' | 'Worn' | null
  notes: string | null
  created_at: string
}

export interface Pattern {
  id: string
  user_id: string
  title: string
  description: string | null
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  category: string | null
  hook_size_mm: number | null
  yarn_weight: string | null
  yarn_name: string | null
  stitch_sequence: string | null
  gauge: string | null
  is_public: boolean
  is_for_sale: boolean
  price: number | null
  download_count: number
  tags: string[]
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface Project {
  id: string
  user_id: string
  pattern_id: string | null
  title: string
  status: 'planned' | 'in_progress' | 'completed' | 'frogged'
  yarn_id: string | null
  hook_id: string | null
  yarn_name: string | null
  hook_size_mm: number | null
  total_rows: number | null
  current_row: number
  total_stitches: number
  notes: string | null
  started_at: string | null
  finished_at: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export interface StitchSession {
  id: string
  user_id: string
  project_id: string | null
  row_number: number
  stitch_count: number
  notes: string | null
  recorded_at: string
}

export interface Post {
  id: string
  user_id: string
  project_id: string | null
  content: string
  image_url: string | null
  likes: number
  tags: string[]
  created_at: string
  profiles?: Profile
  user_liked?: boolean
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export interface Friendship {
  id: string
  requester: string
  addressee: string
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
  profiles?: Profile
}

export interface Purchase {
  id: string
  buyer_id: string
  pattern_id: string
  price_paid: number
  purchased_at: string
  patterns?: Pattern
}

export interface JournalEntry {
  id: string
  user_id: string
  project_id: string | null
  content: string
  mood: 'relaxed' | 'focused' | 'happy' | 'frustrated' | 'creative' | null
  yarn_used: string | null
  hook_size: string | null
  stitches_today: number
  entry_date: string
  created_at: string
}

export interface Badge {
  id: string
  name: string
  description: string | null
  icon: string | null
  xp_reward: number
}

export interface UserBadge {
  user_id: string
  badge_id: string
  earned_at: string
  badges?: Badge
}

export interface Order {
  id: string
  crafter_id: string
  client_name: string
  client_email: string | null
  item_name: string
  yarn_name: string | null
  hook_size: string | null
  price: number | null
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  notes: string | null
  due_date: string | null
  created_at: string
  updated_at: string
}

// Admin stats
export interface AdminStats {
  total_users: number
  new_users_this_week: number
  total_patterns: number
  new_patterns_today: number
  active_sessions: number
  marketplace_revenue: number
}
