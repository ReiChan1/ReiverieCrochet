import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { StatCard, Card, ProgressBar, Badge } from '../components/ui'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Link } from 'react-router-dom'
import { ArrowRight, Flame } from 'lucide-react'
import type { Project, Post } from '../types'
import { formatDistanceToNow } from 'date-fns'

export default function DashboardPage() {
  const { profile } = useAuthStore()

  const { data: projects } = useQuery({
    queryKey: ['projects-summary'],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', profile!.id)
        .eq('status', 'in_progress')
        .order('updated_at', { ascending: false })
        .limit(4)
      return (data ?? []) as Project[]
    },
    enabled: !!profile,
  })

  const { data: posts } = useQuery({
    queryKey: ['feed-preview'],
    queryFn: async () => {
      const { data } = await supabase
        .from('posts')
        .select('*, profiles(display_name, username)')
        .order('created_at', { ascending: false })
        .limit(4)
      return (data ?? []) as Post[]
    },
  })

  const { data: weeklyData } = useQuery({
    queryKey: ['weekly-stitches', profile?.id],
    queryFn: async () => {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      // In production, query stitch_sessions grouped by day
      return days.map(day => ({ day, stitches: Math.floor(Math.random() * 800 + 100) }))
    },
    enabled: !!profile,
  })

  const xpToNextLevel = 500 - (profile?.xp ?? 0) % 500
  const xpProgress = ((profile?.xp ?? 0) % 500) / 500

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Welcome back, {profile?.display_name?.split(' ')[0]} 👋
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Here's your crochet world at a glance</p>
        </div>
        <Link to="/counter" className="btn-primary">Start stitching →</Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Stitches" value={profile?.total_stitches.toLocaleString() ?? '0'} sub="all time" icon="🧶" />
        <StatCard label="Active Projects" value={projects?.length ?? 0} sub="in progress" icon="📋" />
        <StatCard label="Level" value={`Lv. ${profile?.level ?? 1}`} sub={`${xpToNextLevel} XP to next`} icon="⭐" />
        <StatCard label="Friends" value="—" sub="connect via QR" icon="👯" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active projects */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Active Projects</h3>
            <Link to="/projects" className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {projects && projects.length > 0 ? (
            <div className="space-y-4">
              {projects.map(p => {
                const pct = p.total_rows ? Math.round((p.current_row / p.total_rows) * 100) : 0
                return (
                  <div key={p.id}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-800 font-medium">{p.title}</span>
                      <span className="text-xs text-gray-400">{pct}%</span>
                    </div>
                    <ProgressBar value={pct} />
                    <p className="text-xs text-gray-400 mt-1">{p.yarn_name ?? 'No yarn set'} · {p.hook_size_mm ?? '—'}mm hook</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No active projects yet.<br />
              <Link to="/projects" className="text-brand-500 hover:underline">Start one →</Link>
            </p>
          )}
        </Card>

        {/* Weekly chart */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Weekly Stitch Activity</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyData} barCategoryGap="30%">
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                formatter={(v: number) => [v.toLocaleString(), 'stitches']}
              />
              <Bar dataKey="stitches" fill="#534AB7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* XP / Level */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-lg">
              {profile?.level ?? 1}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Yarn Artisan</p>
              <p className="text-xs text-gray-500">{profile?.xp ?? 0} XP · {xpToNextLevel} to Level {(profile?.level ?? 1) + 1}</p>
            </div>
            <div className="ml-auto flex items-center gap-1 text-orange-500">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-semibold">12</span>
            </div>
          </div>
          <ProgressBar value={xpProgress * 100} className="h-2" />
          <div className="flex gap-2 mt-4 flex-wrap">
            <Badge variant="purple">🧶 First Stitch</Badge>
            <Badge variant="teal">🏆 1K Stitches</Badge>
            <Badge variant="amber">🔥 7-Day Streak</Badge>
          </div>
        </Card>

        {/* Community feed preview */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Community Feed</h3>
            <Link to="/social" className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {posts?.slice(0, 3).map(post => (
              <div key={post.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-xs font-semibold text-brand-600 shrink-0">
                  {(post.profiles as any)?.display_name?.slice(0, 2).toUpperCase() ?? 'U'}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-800">{(post.profiles as any)?.display_name}</p>
                  <p className="text-xs text-gray-500 line-clamp-1">{post.content}</p>
                  <p className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(post.created_at))} ago</p>
                </div>
              </div>
            )) ?? (
              <p className="text-sm text-gray-400 text-center py-4">No posts yet. Be the first!</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
