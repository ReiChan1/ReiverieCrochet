import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Card, StatCard, Badge, StatusBadge, Button } from '../components/ui'
import { Shield, UserX } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import type { Profile } from '../types'

export default function AdminPage() {
  const qc = useQueryClient()

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data as Profile[]
    },
  })

  const { data: patternCount } = useQuery({
    queryKey: ['admin-patterns-count'],
    queryFn: async () => {
      const { count } = await supabase.from('patterns').select('*', { count: 'exact', head: true })
      return count ?? 0
    },
  })

  const { data: postCount } = useQuery({
    queryKey: ['admin-posts-count'],
    queryFn: async () => {
      const { count } = await supabase.from('posts').select('*', { count: 'exact', head: true })
      return count ?? 0
    },
  })

  const { data: orderRevenue } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('price').eq('status', 'completed')
      return (data ?? []).reduce((s: number, o: any) => s + (o.price ?? 0), 0)
    },
  })

  const { data: recentSessions } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: async () => {
      const days: Record<string, number> = {}
      const now = new Date()
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i)
        days[format(d, 'EEE')] = 0
      }
      const { data } = await supabase.from('stitch_sessions').select('recorded_at, stitch_count').gte('recorded_at', new Date(Date.now() - 7 * 86400000).toISOString())
      data?.forEach((s: any) => {
        const k = format(new Date(s.recorded_at), 'EEE')
        if (k in days) days[k] += s.stitch_count
      })
      return Object.entries(days).map(([day, stitches]) => ({ day, stitches }))
    },
  })

  const toggleAdmin = useMutation({
    mutationFn: async ({ id, is_admin }: { id: string; is_admin: boolean }) => {
      const { error } = await supabase.from('profiles').update({ is_admin }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Updated') },
  })

  const totalUsers = users?.length ?? 0
  const adminUsers = users?.filter(u => u.is_admin).length ?? 0

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-500" />
          <div>
            <h2 className="page-title">Admin Dashboard</h2>
            <p className="text-sm text-gray-500">Platform overview and user management</p>
          </div>
        </div>
        <Badge variant="coral" className="text-sm px-3 py-1">Admin Access</Badge>
      </div>

      {/* Platform stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={totalUsers} sub={`${adminUsers} admins`} icon="👥" />
        <StatCard label="Total Patterns" value={patternCount ?? 0} icon="📖" />
        <StatCard label="Total Posts" value={postCount ?? 0} icon="💬" />
        <StatCard label="Platform Revenue" value={`₱${(orderRevenue ?? 0).toLocaleString()}`} icon="💰" />
      </div>

      {/* Activity chart */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Platform Stitch Activity (last 7 days)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={recentSessions} barCategoryGap="35%">
            <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => [v.toLocaleString(), 'stitches']} />
            <Bar dataKey="stitches" fill="#534AB7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* User management table */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">User Management ({totalUsers})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['User', 'Username', 'Level', 'Total Stitches', 'Joined', 'Role', 'Actions'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users?.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-[10px] font-bold text-brand-600 shrink-0">
                        {u.display_name?.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{u.display_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-gray-500">@{u.username}</td>
                  <td className="py-3 px-3"><Badge variant="purple">Lv.{u.level}</Badge></td>
                  <td className="py-3 px-3 text-gray-700 font-medium">{u.total_stitches.toLocaleString()}</td>
                  <td className="py-3 px-3 text-gray-400 text-xs">{format(new Date(u.created_at), 'MMM d, yyyy')}</td>
                  <td className="py-3 px-3">
                    {u.is_admin
                      ? <Badge variant="coral">Admin</Badge>
                      : <Badge variant="gray">User</Badge>}
                  </td>
                  <td className="py-3 px-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleAdmin.mutate({ id: u.id, is_admin: !u.is_admin })}
                      className={u.is_admin ? 'text-red-500 hover:bg-red-50' : 'text-brand-500 hover:bg-brand-50'}
                    >
                      {u.is_admin ? <><UserX className="w-3 h-3" /> Revoke</> : <><Shield className="w-3 h-3" /> Make Admin</>}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Top stitchers */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Stitchers</h3>
        <div className="space-y-2">
          {[...(users ?? [])].sort((a, b) => b.total_stitches - a.total_stitches).slice(0, 5).map((u, i) => {
            const max = users?.[0]?.total_stitches ?? 1
            return (
              <div key={u.id} className="flex items-center gap-3">
                <span className="text-sm text-gray-400 w-4">{i + 1}</span>
                <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-[10px] font-bold text-brand-600 shrink-0">
                  {u.display_name?.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-sm text-gray-700 w-28 truncate">{u.display_name}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(u.total_stitches / Math.max(max, 1)) * 100}%` }} />
                </div>
                <span className="text-xs font-medium text-gray-700 w-20 text-right">{u.total_stitches.toLocaleString()} st</span>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
