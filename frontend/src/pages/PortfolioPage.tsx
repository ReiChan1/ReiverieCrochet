import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Card, Button, StatCard, Badge, ProgressBar } from '../components/ui'
import { QRCodeSVG } from 'qrcode.react'
import { Link } from 'react-router-dom'
import { ExternalLink, MapPin, Globe } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PortfolioPage() {
  const { profile } = useAuthStore()

  const { data: completedProjects } = useQuery({
    queryKey: ['portfolio-projects', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', profile!.id)
        .eq('status', 'completed')
        .order('finished_at', { ascending: false })
      return data ?? []
    },
    enabled: !!profile,
  })

  const { data: publicPatterns } = useQuery({
    queryKey: ['portfolio-patterns', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('patterns')
        .select('*')
        .eq('user_id', profile!.id)
        .eq('is_public', true)
        .order('download_count', { ascending: false })
        .limit(6)
      return data ?? []
    },
    enabled: !!profile,
  })

  const { data: salesData } = useQuery({
    queryKey: ['portfolio-sales', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('purchases')
        .select('price_paid')
        .eq('buyer_id', profile!.id)
      const total = (data ?? []).reduce((s: number, p: any) => s + (p.price_paid ?? 0), 0)
      return { count: data?.length ?? 0, total }
    },
    enabled: !!profile,
  })

  const portfolioUrl = `${window.location.origin}/portfolio/${profile?.username}`

  const CATEGORY_ICONS: Record<string, string> = {
    Blanket: '🛏️', Amigurumi: '🧸', Wearable: '👗', Accessory: '👜', Home: '🏠', Other: '🧶'
  }

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <Card>
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-2xl font-bold text-brand-600 shrink-0">
            {profile?.display_name?.slice(0, 2).toUpperCase() ?? 'ME'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">{profile?.display_name}</h2>
            <p className="text-sm text-gray-500">@{profile?.username}</p>
            {profile?.location && (
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" /> {profile.location}
              </p>
            )}
            {profile?.bio && <p className="text-sm text-gray-600 mt-2">{profile.bio}</p>}
            <div className="flex gap-2 mt-3 flex-wrap">
              <Badge variant="purple">Level {profile?.level}</Badge>
              {profile?.open_for_commissions && <Badge variant="teal">Open for commissions</Badge>}
              <Badge variant="amber">{profile?.total_stitches.toLocaleString()} total stitches</Badge>
            </div>
          </div>
          <div className="shrink-0">
            <div className="p-3 bg-brand-50 rounded-xl">
              <QRCodeSVG value={portfolioUrl} size={80} fgColor="#534AB7" bgColor="transparent" />
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2 w-full"
              onClick={() => { navigator.clipboard.writeText(portfolioUrl); toast.success('Link copied!') }}
            >
              <Globe className="w-3 h-3" /> Share
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Completed Projects" value={completedProjects?.length ?? 0} icon="✅" />
        <StatCard label="Public Patterns" value={publicPatterns?.length ?? 0} icon="📖" />
        <StatCard label="Total Downloads" value={publicPatterns?.reduce((s, p: any) => s + p.download_count, 0) ?? 0} icon="⬇️" />
        <StatCard label="XP Level" value={`Lv. ${profile?.level}`} icon="⭐" />
      </div>

      {/* XP progress */}
      <Card>
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Level {profile?.level} progress</span>
          <span className="text-xs text-gray-400">{(profile?.xp ?? 0) % 500} / 500 XP</span>
        </div>
        <ProgressBar value={((profile?.xp ?? 0) % 500) / 5} />
      </Card>

      {/* Completed projects */}
      {completedProjects && completedProjects.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="section-title mb-0">Finished Objects ({completedProjects.length})</h3>
            <Link to="/projects" className="text-xs text-brand-500 hover:text-brand-600">View all</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {completedProjects.slice(0, 8).map((p: any) => (
              <div key={p.id} className="card text-center hover:border-brand-200 transition-colors">
                <div className="h-16 flex items-center justify-center text-4xl mb-2">
                  {CATEGORY_ICONS[p.tags?.[0]] ?? '🧶'}
                </div>
                <p className="text-xs font-semibold text-gray-800 truncate">{p.title}</p>
                {p.yarn_name && <p className="text-[10px] text-gray-400 truncate">{p.yarn_name}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Public patterns */}
      {publicPatterns && publicPatterns.length > 0 && (
        <section>
          <h3 className="section-title">Published Patterns</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicPatterns.map((p: any) => (
              <Card key={p.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-xl shrink-0">
                  {CATEGORY_ICONS[p.category] ?? '🧶'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{p.title}</p>
                  <p className="text-xs text-gray-400">{p.download_count} downloads · {p.difficulty}</p>
                </div>
                {p.is_for_sale && p.price ? (
                  <Badge variant="amber">₱{p.price}</Badge>
                ) : (
                  <Badge variant="teal">Free</Badge>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Call to action */}
      <Card className="bg-brand-50 border-brand-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-brand-800">Grow your portfolio</h3>
            <p className="text-xs text-brand-600 mt-0.5">Complete projects, publish patterns, take commissions</p>
          </div>
          <div className="flex gap-2">
            <Link to="/projects"><Button size="sm" variant="secondary">Add Project</Button></Link>
            <Link to="/orders"><Button size="sm">View Orders</Button></Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
