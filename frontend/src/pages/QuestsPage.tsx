import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Card, ProgressBar, StatCard } from '../components/ui'
import { Flame, Trophy } from 'lucide-react'
import type { Badge, UserBadge, Profile } from '../types'

export default function QuestsPage() {
  const { profile } = useAuthStore()

  const { data: allBadges } = useQuery({
    queryKey: ['badges'],
    queryFn: async () => {
      const { data } = await supabase.from('badges').select('*').order('xp_reward')
      return (data ?? []) as Badge[]
    },
  })

  const { data: userBadges } = useQuery({
    queryKey: ['user-badges', profile?.id],
    queryFn: async () => {
      const { data } = await supabase.from('user_badges').select('badge_id').eq('user_id', profile!.id)
      return new Set((data ?? []).map((b: any) => b.badge_id))
    },
    enabled: !!profile,
  })

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, display_name, username, xp, level, total_stitches').order('xp', { ascending: false }).limit(10)
      return (data ?? []) as Profile[]
    },
  })

  const xpToNext = 500 - (profile?.xp ?? 0) % 500
  const xpProgress = ((profile?.xp ?? 0) % 500) / 500
  const earnedCount = userBadges?.size ?? 0
  const rankEmoji = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2 className="page-title">Quests & XP</h2>
          <p className="text-sm text-gray-500">Level up your crochet journey</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Current Level" value={`Lv. ${profile?.level ?? 1}`} icon="⭐" />
        <StatCard label="Total XP" value={profile?.xp.toLocaleString() ?? '0'} icon="✨" />
        <StatCard label="XP to Next Level" value={xpToNext} icon="🎯" />
        <StatCard label="Badges Earned" value={`${earnedCount}/${allBadges?.length ?? 0}`} icon="🏅" />
      </div>

      {/* Level progress */}
      <Card>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-brand-50 border-2 border-brand-200 flex items-center justify-center text-2xl font-bold text-brand-600">
            {profile?.level ?? 1}
          </div>
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-semibold text-gray-900">Level {profile?.level ?? 1}</span>
              <span className="text-xs text-gray-400">{(profile?.xp ?? 0) % 500} / 500 XP</span>
            </div>
            <ProgressBar value={xpProgress * 100} className="h-3" />
            <p className="text-xs text-gray-400 mt-1">{xpToNext} XP to Level {(profile?.level ?? 1) + 1}</p>
          </div>
          <div className="flex items-center gap-1 text-orange-400">
            <Flame className="w-5 h-5" />
            <span className="text-lg font-bold">12</span>
            <span className="text-xs text-gray-400">day streak</span>
          </div>
        </div>
        <div className="text-xs text-gray-400 bg-brand-50 rounded-lg p-3">
          <span className="font-medium text-brand-600">How to earn XP:</span> Save stitch sessions (+XP per 10 stitches) · Complete projects (+100 XP) · Publish patterns (+75 XP) · Earn badges (bonus XP)
        </div>
      </Card>

      {/* Badges */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Badges ({earnedCount}/{allBadges?.length ?? 0})</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {allBadges?.map(b => {
            const earned = userBadges?.has(b.id)
            return (
              <div key={b.id} className={`text-center p-3 rounded-xl transition-all ${earned ? 'bg-brand-50' : 'bg-gray-50 opacity-50 grayscale'}`}>
                <div className="text-3xl mb-1.5">{b.icon}</div>
                <p className="text-xs font-medium text-gray-700 leading-tight">{b.name}</p>
                <p className="text-[10px] text-brand-500 mt-0.5">+{b.xp_reward} XP</p>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Leaderboard */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-gray-900">Global Leaderboard</h3>
        </div>
        <div className="space-y-2">
          {leaderboard?.map((u, i) => {
            const isMe = u.id === profile?.id
            return (
              <div key={u.id} className={`flex items-center gap-3 p-2.5 rounded-lg ${i === 0 ? 'bg-amber-50' : isMe ? 'bg-brand-50' : 'hover:bg-gray-50'}`}>
                <span className="text-base w-6 text-center">{rankEmoji(i)}</span>
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-600 shrink-0">
                  {u.display_name?.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.display_name} {isMe && <span className="text-xs text-brand-500">(you)</span>}</p>
                  <p className="text-xs text-gray-400">@{u.username}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-brand-600">{u.xp.toLocaleString()} XP</p>
                  <p className="text-xs text-gray-400">Lv.{u.level}</p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
