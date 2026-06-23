import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Card, Button, Input, Textarea, Modal, EmptyState, Avatar, Badge } from '../components/ui'
import { Heart, MessageCircle, Plus } from 'lucide-react'
import type { Post } from '../types'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

export default function SocialPage() {
  const { profile } = useAuthStore()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(display_name, username, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(30)
      if (error) throw error
      return data as Post[]
    },
  })

  const createPost = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('posts').insert({
        user_id: profile!.id,
        content,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] })
      setModalOpen(false); setContent(''); setTags('')
      toast.success('Posted!')
    },
    onError: () => toast.error('Failed to post'),
  })

  const toggleLike = useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      if (liked) {
        await supabase.from('post_likes').delete().match({ post_id: postId, user_id: profile!.id })
        await supabase.from('posts').update({ likes: supabase.rpc as any }).eq('id', postId)
      } else {
        await supabase.from('post_likes').insert({ post_id: postId, user_id: profile!.id })
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  })

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2 className="page-title">Community Feed</h2>
          <p className="text-sm text-gray-500">Share your crochet journey with the community</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Share post</Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="card h-32 animate-pulse bg-gray-100" />)}</div>
      ) : posts && posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map(post => (
            <Card key={post.id} className="hover:border-gray-300 transition-colors">
              <div className="flex gap-3">
                <Avatar name={(post.profiles as any)?.display_name ?? 'User'} avatarUrl={(post.profiles as any)?.avatar_url} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{(post.profiles as any)?.display_name}</span>
                    <span className="text-xs text-gray-400">@{(post.profiles as any)?.username}</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(post.created_at))} ago</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1 leading-relaxed">{post.content}</p>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {post.tags.map(t => <Badge key={t} variant="purple">#{t}</Badge>)}
                    </div>
                  )}
                  <div className="flex gap-4 mt-3">
                    <button
                      onClick={() => toggleLike.mutate({ postId: post.id, liked: false })}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Heart className="w-3.5 h-3.5" />
                      {post.likes > 0 && <span>{post.likes}</span>}
                    </button>
                    <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-500 transition-colors">
                      <MessageCircle className="w-3.5 h-3.5" /> Comment
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon="🌸" title="No posts yet" description="Be the first to share your crochet journey!" action={<Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Share something</Button>} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Share with the community">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Avatar name={profile?.display_name ?? 'Me'} size="md" />
            <Textarea
              className="flex-1"
              placeholder="What are you working on? Share your progress, ask for advice, or show off your FO! 🧶"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
            />
          </div>
          <Input label="Tags (comma-separated)" placeholder="WIP, blanket, amigurumi" value={tags} onChange={e => setTags(e.target.value)} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={() => createPost.mutate()} loading={createPost.isPending} className="flex-1" disabled={!content.trim()}>Post</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
