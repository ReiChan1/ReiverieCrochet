import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Card, Button, StatusBadge, EmptyState, Badge } from '../components/ui'
import { ShoppingBag, Download } from 'lucide-react'
import type { Pattern } from '../types'
import toast from 'react-hot-toast'

const CATEGORY_ICONS: Record<string, string> = {
  Blanket: '🛏️', Amigurumi: '🧸', Wearable: '👗', Accessory: '👜', Home: '🏠', Other: '🧶'
}

export default function MarketplacePage() {
  const { profile } = useAuthStore()
  const qc = useQueryClient()

  const { data: patterns, isLoading } = useQuery({
    queryKey: ['marketplace'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patterns')
        .select('*, profiles(display_name, username)')
        .eq('is_public', true)
        .order('download_count', { ascending: false })
      if (error) throw error
      return data as Pattern[]
    },
  })

  const { data: myPurchases } = useQuery({
    queryKey: ['purchases', profile?.id],
    queryFn: async () => {
      const { data } = await supabase.from('purchases').select('pattern_id').eq('buyer_id', profile!.id)
      return new Set((data ?? []).map((p: any) => p.pattern_id))
    },
    enabled: !!profile,
  })

  const purchase = useMutation({
    mutationFn: async (pattern: Pattern) => {
      const { error } = await supabase.from('purchases').insert({
        buyer_id: profile!.id,
        pattern_id: pattern.id,
        price_paid: pattern.price ?? 0,
      })
      if (error) throw error
      await supabase.from('patterns').update({ download_count: pattern.download_count + 1 }).eq('id', pattern.id)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchases', 'marketplace'] }); toast.success('Pattern purchased! Check your patterns library.') },
    onError: () => toast.error('Purchase failed'),
  })

  const freePatterns = patterns?.filter(p => !p.is_for_sale || !p.price) ?? []
  const paidPatterns = patterns?.filter(p => p.is_for_sale && p.price) ?? []

  const PatternCard = ({ p }: { p: Pattern }) => {
    const owned = myPurchases?.has(p.id) || p.user_id === profile?.id
    const isFree = !p.is_for_sale || !p.price
    return (
      <Card className="flex flex-col hover:border-brand-200 transition-colors">
        <div className="h-24 rounded-lg flex items-center justify-center text-5xl mb-3"
          style={{ background: 'linear-gradient(135deg, #EEEDFE, #F3E8FF)' }}>
          {CATEGORY_ICONS[p.category ?? ''] ?? '🧶'}
        </div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-tight">{p.title}</h3>
        <p className="text-xs text-gray-400 mb-2">by @{(p.profiles as any)?.username}</p>
        <div className="flex gap-1.5 mb-3 flex-wrap">
          <StatusBadge status={p.difficulty} />
          {p.category && <Badge variant="gray">{p.category}</Badge>}
        </div>
        {p.description && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{p.description}</p>}
        <div className="mt-auto flex items-center justify-between">
          <span className={`text-base font-semibold ${isFree ? 'text-teal-600' : 'text-brand-600'}`}>
            {isFree ? 'Free' : `₱${p.price}`}
          </span>
          {owned ? (
            <Button size="sm" variant="secondary"><Download className="w-3 h-3" /> Owned</Button>
          ) : (
            <Button size="sm" onClick={() => purchase.mutate(p)} loading={purchase.isPending}>
              <ShoppingBag className="w-3 h-3" /> {isFree ? 'Get free' : 'Buy'}
            </Button>
          )}
        </div>
      </Card>
    )
  }

  if (isLoading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => <div key={i} className="card h-64 animate-pulse bg-gray-100" />)}
    </div>
  )

  return (
    <div className="space-y-8">
      <div className="page-header">
        <div>
          <h2 className="page-title">Pattern Marketplace</h2>
          <p className="text-sm text-gray-500">Discover, buy and sell crochet patterns</p>
        </div>
      </div>

      {paidPatterns.length > 0 && (
        <section>
          <h3 className="section-title">Premium Patterns</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paidPatterns.map(p => <PatternCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {freePatterns.length > 0 && (
        <section>
          <h3 className="section-title">Free Patterns</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {freePatterns.map(p => <PatternCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {patterns?.length === 0 && (
        <EmptyState icon="🛍️" title="Marketplace is empty" description="Be the first to list a pattern for sale or share a free one!" />
      )}
    </div>
  )
}
