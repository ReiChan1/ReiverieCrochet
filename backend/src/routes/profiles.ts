import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { requireAuth, type AuthRequest } from '../middleware/auth'

const router = Router()

// GET /api/profiles/:username — public profile
router.get('/:username', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, username, display_name, avatar_url, bio, location, level, xp, total_stitches, open_for_commissions, created_at')
      .eq('username', req.params.username)
      .single()
    if (error || !data) return res.status(404).json({ error: 'User not found' })
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

// PATCH /api/profiles/me — update own profile
router.patch('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const allowed = ['display_name', 'bio', 'location', 'open_for_commissions', 'avatar_url']
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    )
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', req.userId)
      .select()
      .single()
    if (error) throw error
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

export default router
