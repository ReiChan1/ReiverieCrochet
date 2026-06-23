import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Card, Button, Input, Modal, Avatar, Badge, EmptyState } from '../components/ui'
import { UserPlus, Check, X } from 'lucide-react'
import type { Friendship, Profile } from '../types'
import toast from 'react-hot-toast'

export default function FriendsPage() {
  const { profile } = useAuthStore()
  const qc = useQueryClient()
  const [addModal, setAddModal] = useState(false)
  const [qrModal, setQrModal] = useState(false)
  const [searchUsername, setSearchUsername] = useState('')
  const [searchResult, setSearchResult] = useState<Profile | null>(null)
  const [searching, setSearching] = useState(false)

  const { data: friendships } = useQuery({
    queryKey: ['friendships', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('friendships')
        .select('*, profiles!friendships_addressee_fkey(id,username,display_name,avatar_url,level), requester_profile:profiles!friendships_requester_fkey(id,username,display_name,avatar_url,level)')
        .or(`requester.eq.${profile!.id},addressee.eq.${profile!.id}`)
      if (error) throw error
      return (data ?? []) as any[]
    },
    enabled: !!profile,
  })

  const searchUser = async () => {
    if (!searchUsername.trim()) return
    setSearching(true)
    const { data } = await supabase.from('profiles').select('*').eq('username', searchUsername.trim()).single()
    setSearchResult(data as Profile | null)
    if (!data) toast.error('User not found')
    setSearching(false)
  }

  const sendRequest = useMutation({
    mutationFn: async (addresseeId: string) => {
      const { error } = await supabase.from('friendships').insert({ requester: profile!.id, addressee: addresseeId, status: 'pending' })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['friendships'] }); setAddModal(false); setSearchResult(null); setSearchUsername(''); toast.success('Friend request sent!') },
    onError: () => toast.error('Could not send request'),
  })

  const respondRequest = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'accepted' | 'blocked' }) => {
      const { error } = await supabase.from('friendships').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ['friendships'] })
      toast.success(status === 'accepted' ? 'Friend added!' : 'Request declined')
    },
  })

  const accepted = friendships?.filter(f => f.status === 'accepted') ?? []
  const pending = friendships?.filter(f => f.status === 'pending' && f.addressee === profile?.id) ?? []

  const getFriendProfile = (f: any) =>
    f.requester === profile?.id ? f.profiles : f.requester_profile

  const profileUrl = `${window.location.origin}/friends?add=${profile?.username}`

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2 className="page-title">Friends & QR Connect</h2>
          <p className="text-sm text-gray-500">{accepted.length} friends · {pending.length} pending</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setQrModal(true)}>My QR Code</Button>
          <Button onClick={() => setAddModal(true)}><UserPlus className="w-4 h-4" /> Add Friend</Button>
        </div>
      </div>

      {/* Pending requests */}
      {pending.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Pending Requests ({pending.length})</h3>
          <div className="space-y-3">
            {pending.map(f => {
              const p = f.requester_profile
              return (
                <div key={f.id} className="flex items-center gap-3">
                  <Avatar name={p?.display_name ?? 'User'} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{p?.display_name}</p>
                    <p className="text-xs text-gray-400">@{p?.username}</p>
                  </div>
                  <Button size="sm" onClick={() => respondRequest.mutate({ id: f.id, status: 'accepted' })}><Check className="w-3 h-3" /> Accept</Button>
                  <Button size="sm" variant="ghost" onClick={() => respondRequest.mutate({ id: f.id, status: 'blocked' })}><X className="w-3 h-3" /></Button>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Friends list */}
      {accepted.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accepted.map(f => {
            const p = getFriendProfile(f)
            return (
              <Card key={f.id} className="flex items-center gap-3">
                <Avatar name={p?.display_name ?? 'User'} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{p?.display_name}</p>
                  <p className="text-xs text-gray-400">@{p?.username}</p>
                </div>
                <Badge variant="purple">Lv.{p?.level}</Badge>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState icon="👯" title="No friends yet" description="Add friends via QR code at craft fairs or by searching their username" action={<Button onClick={() => setAddModal(true)}><UserPlus className="w-4 h-4" /> Add Friend</Button>} />
      )}

      {/* QR Modal */}
      <Modal open={qrModal} onClose={() => setQrModal(false)} title="Your QR Profile">
        <div className="text-center space-y-4">
          <div className="inline-block p-4 bg-brand-50 rounded-2xl">
            <QRCodeSVG value={profileUrl} size={200} fgColor="#534AB7" bgColor="transparent" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">{profile?.display_name}</p>
            <p className="text-sm text-gray-500">@{profile?.username} · Level {profile?.level}</p>
          </div>
          <p className="text-xs text-gray-400">Show this QR code for others to scan and add you as a friend</p>
          <Button onClick={() => { navigator.clipboard.writeText(profileUrl); toast.success('Link copied!') }} variant="secondary" className="w-full">Copy profile link</Button>
        </div>
      </Modal>

      {/* Add Friend Modal */}
      <Modal open={addModal} onClose={() => { setAddModal(false); setSearchResult(null); setSearchUsername('') }} title="Add a Friend">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Enter username" value={searchUsername} onChange={e => setSearchUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchUser()} />
            <Button onClick={searchUser} loading={searching} variant="secondary">Search</Button>
          </div>
          {searchResult && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Avatar name={searchResult.display_name ?? 'User'} size="md" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{searchResult.display_name}</p>
                <p className="text-xs text-gray-400">@{searchResult.username} · Level {searchResult.level}</p>
              </div>
              <Button size="sm" onClick={() => sendRequest.mutate(searchResult.id)} loading={sendRequest.isPending}><UserPlus className="w-3 h-3" /> Add</Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
