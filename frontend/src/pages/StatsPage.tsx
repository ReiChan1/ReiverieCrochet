import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Card, StatCard, ProgressBar } from '../components/ui'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#534AB7', '#7F77DD', '#AFA9EC', '#CECBF6', '#EEEDFE']

export default function StatsPage() {
  const { profile } = useAuthStore()

  const { data: projects } = useQuery({
    queryKey: ['stats-projects', profile?.id],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('status, total_stitches, hook_size_mm, started_at, finished_at').eq('user_id', profile!.id)
      return data ?? []
    },
    enabled: !!profile,
  })

  const { data: sessions } = useQuery({
    queryKey: ['stats-sessions', profile?.id],
    queryFn: async () => {
      const { data } = await supabase.from('stitch_sessions').select('stitch_count, recorded_at').eq('user_id', profile!.id).order('recorded_at')
      return data ?? []
    },
    enabled: !!profile,
  })

  const { data: yarn } = useQuery({
    queryKey: ['stats-yarn', profile?.id],
    queryFn: async () => {
      const { data } = await supabase.from('yarn_stash').select('weight, skeins').eq('user_id', profile!.id)
      return data ?? []
    },
    enabled: !!profile,
  })

  // Status breakdown
  const statusData = ['planned', 'in_progress', 'completed', 'frogged'].map(s => ({
    name: s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1),
    value: projects?.filter(p => p.status === s).length ?? 0,
  })).filter(d => d.value > 0)

  // Monthly sessions (last 6 months)
  const monthlyData = (() => {
    const months: Record<string, number> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months[d.toLocaleString('default', { month: 'short' })] = 0
    }
    sessions?.forEach(s => {
      const m = new Date(s.recorded_at).toLocaleString('default', { month: 'short' })
      if (m in months) months[m] += s.stitch_count
    })
    return Object.entries(months).map(([month, stitches]) => ({ month, stitches }))
  })()

  // Yarn weight breakdown
  const yarnData = (() => {
    const w: Record<string, number> = {}
    yarn?.forEach(y => { w[y.weight ?? 'Unknown'] = (w[y.weight ?? 'Unknown'] ?? 0) + y.skeins })
    return Object.entries(w).map(([name, skeins]) => ({ name, skeins }))
  })()

  // Hook usage
  const hookData = (() => {
    const h: Record<string, number> = {}
    projects?.forEach(p => {
      if (p.hook_size_mm) {
        const k = `${p.hook_size_mm}mm`
        h[k] = (h[k] ?? 0) + 1
      }
    })
    return Object.entries(h).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([size, count]) => ({ size, count }))
  })()

  const completedProjects = projects?.filter(p => p.status === 'completed').length ?? 0
  const totalProjectStitches = projects?.reduce((s, p) => s + (p.total_stitches ?? 0), 0) ?? 0

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2 className="page-title">My Stats</h2>
          <p className="text-sm text-gray-500">Your crochet journey at a glance</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Stitches" value={profile?.total_stitches.toLocaleString() ?? '0'} icon="🧶" />
        <StatCard label="Projects Done" value={completedProjects} icon="✅" />
        <StatCard label="XP Earned" value={profile?.xp.toLocaleString() ?? '0'} icon="⭐" />
        <StatCard label="Current Level" value={`Lv. ${profile?.level}`} icon="🏆" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Stitch Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barCategoryGap="35%">
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} formatter={(v: number) => [v.toLocaleString(), 'stitches']} />
              <Bar dataKey="stitches" fill="#534AB7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Projects by Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-400 text-center py-16">No project data yet</p>}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Most Used Hook Sizes</h3>
          {hookData.length > 0 ? (
            <div className="space-y-3">
              {hookData.map((h, i) => (
                <div key={h.size}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{h.size}</span>
                    <span className="text-gray-900 font-medium">{h.count} project{h.count !== 1 ? 's' : ''}</span>
                  </div>
                  <ProgressBar value={h.count} max={hookData[0].count} />
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400 text-center py-8">No hook data yet</p>}
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Yarn Weight Distribution</h3>
          {yarnData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={yarnData} layout="vertical" barCategoryGap="30%">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={72} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} formatter={(v: number) => [v, 'skeins']} />
                <Bar dataKey="skeins" fill="#7F77DD" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-400 text-center py-16">Add yarn to see breakdown</p>}
        </Card>
      </div>
    </div>
  )
}
