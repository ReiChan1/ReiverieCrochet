import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { requireAuth, requireAdmin, type AuthRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth, requireAdmin)

// GET /api/admin/stats — platform overview
router.get('/stats', async (_req, res) => {
  try {
    const [
      { count: totalUsers },
      { count: totalPatterns },
      { count: totalPosts },
      { count: totalOrders },
      { data: revenue },
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('patterns').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('posts').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('orders').select('price').eq('status', 'completed'),
    ])

    const totalRevenue = (revenue ?? []).reduce((s: number, o: any) => s + (o.price ?? 0), 0)

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const { count: newUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo)

    res.json({
      total_users: totalUsers ?? 0,
      new_users_this_week: newUsers ?? 0,
      total_patterns: totalPatterns ?? 0,
      total_posts: totalPosts ?? 0,
      total_orders: totalOrders ?? 0,
      marketplace_revenue: totalRevenue,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// GET /api/admin/users — all users
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const from = (page - 1) * limit
    const { data, error, count } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)
    if (error) throw error
    res.json({ users: data, total: count, page, limit })
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// PATCH /api/admin/users/:id — update user (e.g. grant/revoke admin)
router.patch('/users/:id', async (req, res) => {
  try {
    const { is_admin } = req.body
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_admin })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to update user' })
  }
})

// DELETE /api/admin/users/:id — delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

// GET /api/admin/patterns — all patterns with user info
router.get('/patterns', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('patterns')
      .select('*, profiles(username, display_name)')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch patterns' })
  }
})

// DELETE /api/admin/patterns/:id — remove pattern (DMCA etc)
router.delete('/patterns/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('patterns').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to delete pattern' })
  }
})

// GET /api/admin/posts — flagged/all posts
router.get('/posts', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select('*, profiles(username, display_name)')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch posts' })
  }
})

export default router
