import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { requireAuth, type AuthRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

// POST /api/xp/award — award XP to logged-in user
router.post('/award', async (req: AuthRequest, res) => {
  try {
    const { amount } = req.body as { amount: number }
    if (!amount || amount < 0) return res.status(400).json({ error: 'Invalid XP amount' })

    const { error } = await supabaseAdmin.rpc('update_xp', {
      p_user_id: req.userId,
      p_xp: amount,
    })
    if (error) throw error

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('xp, level')
      .eq('id', req.userId)
      .single()

    res.json({ success: true, xp: profile?.xp, level: profile?.level })
  } catch {
    res.status(500).json({ error: 'Failed to award XP' })
  }
})

// POST /api/xp/check-badges — check and award any newly unlocked badges
router.post('/check-badges', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!

    const [
      { data: profile },
      { count: projectCount },
      { count: patternCount },
      { count: friendCount },
      { data: userBadges },
      { data: allBadges },
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('total_stitches, xp').eq('id', userId).single(),
      supabaseAdmin.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('patterns').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_public', true),
      supabaseAdmin.from('friendships').select('*', { count: 'exact', head: true }).or(`requester.eq.${userId},addressee.eq.${userId}`).eq('status', 'accepted'),
      supabaseAdmin.from('user_badges').select('badge_id').eq('user_id', userId),
      supabaseAdmin.from('badges').select('*'),
    ])

    const earned = new Set((userBadges ?? []).map((b: any) => b.badge_id))
    const newBadges: string[] = []

    const checks: Record<string, boolean> = {
      'First Stitch':     (profile?.total_stitches ?? 0) >= 1,
      '1K Stitches':      (profile?.total_stitches ?? 0) >= 1000,
      '10K Stitches':     (profile?.total_stitches ?? 0) >= 10000,
      'First Project':    (projectCount ?? 0) >= 1,
      'Pattern Maker':    (patternCount ?? 0) >= 1,
      'Social Butterfly': (friendCount ?? 0) >= 5,
      'Yarn Hoarder':     false, // checked separately from yarn table
    }

    for (const badge of (allBadges ?? [])) {
      if (!earned.has(badge.id) && checks[badge.name]) {
        await supabaseAdmin.from('user_badges').insert({ user_id: userId, badge_id: badge.id })
        await supabaseAdmin.rpc('update_xp', { p_user_id: userId, p_xp: badge.xp_reward })
        newBadges.push(badge.name)
      }
    }

    res.json({ new_badges: newBadges })
  } catch {
    res.status(500).json({ error: 'Failed to check badges' })
  }
})

export default router
