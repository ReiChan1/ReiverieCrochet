import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import {
  Card, Button, Input, Textarea, Select, Modal,
  StatusBadge, EmptyState, Badge
} from '../components/ui'
import { Plus, Lock, Globe, Pencil, Trash2 } from 'lucide-react'
import type { Pattern } from '../types'
import toast from 'react-hot-toast'

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']
const CATEGORIES = ['Blanket', 'Amigurumi', 'Wearable', 'Accessory', 'Home', 'Other']
const WEIGHTS = ['Lace', 'Fingering', 'Sport', 'DK', 'Worsted', 'Bulky', 'Super Bulky']
const HOOK_SIZES = ['2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0', '5.5', '6.0', '6.5', '7.0', '8.0', '9.0', '10.0']

const emptyForm = {
  title: '', description: '', difficulty: 'Beginner', category: 'Blanket',
  hook_size_mm: '', yarn_weight: 'Worsted', yarn_name: '',
  stitch_sequence: '', gauge: '', is_public: false, is_for_sale: false,
  price: '', tags: ''
}

export default function PatternsPage() {
  const { profile } = useAuthStore()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Pattern | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [tab, setTab] = useState<'mine' | 'public'>('mine')

  const { data: patterns, isLoading } = useQuery({
    queryKey: ['patterns', profile?.id, tab],
    queryFn: async () => {
      let q = supabase.from('patterns').select('*, profiles(username, display_name)')
      if (tab === 'mine') q = q.eq('user_id', profile!.id)
      else q = q.eq('is_public', true)
      const { data, error } = await q.order('created_at', { ascending: false })
      if (error) throw error
      return data as Pattern[]
    },
    enabled: !!profile,
  })

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: profile!.id,
        title: form.title,
        description: form.description || null,
        difficulty: form.difficulty,
        category: form.category || null,
        hook_size_mm: form.hook_size_mm ? parseFloat(form.hook_size_mm) : null,
        yarn_weight: form.yarn_weight || null,
        yarn_name: form.yarn_name || null,
        stitch_sequence: form.stitch_sequence || null,
        gauge: form.gauge || null,
        is_public: form.is_public,
        is_for_sale: form.is_for_sale,
        price: form.price ? parseFloat(form.price) : null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      }
      if (editing) {
        const { error } = await supabase.from('patterns').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('patterns').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patterns'] })
      setModalOpen(false); setEditing(null); setForm(emptyForm)
      toast.success(editing ? 'Pattern updated!' : 'Pattern saved!')
    },
    onError: () => toast.error('Failed to save pattern'),
  })

  const deletePattern = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('patterns').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patterns'] }); toast.success('Deleted') },
  })

  const openEdit = (p: Pattern) => {
    setEditing(p)
    setForm({
      title: p.title, description: p.description ?? '', difficulty: p.difficulty,
      category: p.category ?? 'Blanket', hook_size_mm: p.hook_size_mm?.toString() ?? '',
      yarn_weight: p.yarn_weight ?? 'Worsted', yarn_name: p.yarn_name ?? '',
      stitch_sequence: p.stitch_sequence ?? '', gauge: p.gauge ?? '',
      is_public: p.is_public, is_for_sale: p.is_for_sale, price: p.price?.toString() ?? '',
      tags: p.tags?.join(', ') ?? '',
    })
    setModalOpen(true)
  }

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2 className="page-title">Patterns</h2>
          <p className="text-sm text-gray-500">Build, save and share your crochet patterns</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(emptyForm); setModalOpen(true) }}>
          <Plus className="w-4 h-4" /> New Pattern
        </Button>
      </div>

      <div className="flex gap-2 border-b border-gray-100 pb-0">
        {(['mine', 'public'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'mine' ? 'My Patterns' : 'Community Patterns'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-48 animate-pulse bg-gray-100" />)}
        </div>
      ) : patterns && patterns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patterns.map(p => (
            <Card key={p.id} className="hover:border-brand-200 transition-colors flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900 leading-tight pr-2">{p.title}</h3>
                {p.is_public ? <Globe className="w-3 h-3 text-teal-500 shrink-0 mt-0.5" /> : <Lock className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />}
              </div>
              <div className="flex gap-1.5 flex-wrap mb-3">
                <StatusBadge status={p.difficulty} />
                {p.category && <Badge variant="gray">{p.category}</Badge>}
              </div>
              <div className="text-xs text-gray-400 space-y-0.5 mb-3">
                {p.yarn_name && <p>🧶 {p.yarn_name}</p>}
                {p.hook_size_mm && <p>🪝 {p.hook_size_mm}mm hook</p>}
                {p.yarn_weight && <p>⚖️ {p.yarn_weight} weight</p>}
              </div>
              {p.is_for_sale && p.price && (
                <p className="text-sm font-semibold text-brand-600 mb-2">₱{p.price}</p>
              )}
              {p.tags && p.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mb-3">
                  {p.tags.slice(0, 3).map(t => <Badge key={t} variant="gray" className="text-[10px]">{t}</Badge>)}
                </div>
              )}
              {tab === 'mine' && (
                <div className="flex gap-2 mt-auto pt-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)} className="flex-1">
                    <Pencil className="w-3 h-3" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => confirm('Delete?') && deletePattern.mutate(p.id)} className="text-red-500 hover:bg-red-50">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="📖"
          title={tab === 'mine' ? "No patterns yet" : "No community patterns"}
          description={tab === 'mine' ? "Document your first crochet pattern" : "Be the first to share a pattern!"}
          action={tab === 'mine' ? <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Create Pattern</Button> : undefined}
        />
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? 'Edit Pattern' : 'New Pattern'}>
        <div className="space-y-4">
          <Input label="Pattern title *" placeholder="e.g. Sunflower Granny Square" value={form.title} onChange={f('title')} />
          <Textarea label="Description" placeholder="What does this pattern make?" value={form.description} onChange={f('description')} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Difficulty" value={form.difficulty} onChange={f('difficulty')}>
              {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
            </Select>
            <Select label="Category" value={form.category} onChange={f('category')}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Hook size (mm)" value={form.hook_size_mm} onChange={f('hook_size_mm')}>
              <option value="">— Select —</option>
              {HOOK_SIZES.map(s => <option key={s} value={s}>{s}mm</option>)}
            </Select>
            <Select label="Yarn weight" value={form.yarn_weight} onChange={f('yarn_weight')}>
              {WEIGHTS.map(w => <option key={w}>{w}</option>)}
            </Select>
          </div>
          <Input label="Yarn name" placeholder="Lion Brand Pound of Love" value={form.yarn_name} onChange={f('yarn_name')} />
          <Input label="Gauge" placeholder="e.g. 14 sc × 16 rows = 4 inches" value={form.gauge} onChange={f('gauge')} />
          <Textarea label="Stitch sequence" placeholder="ch 4, sl st to form ring, ch 3, 2 dc in ring..." value={form.stitch_sequence} onChange={f('stitch_sequence')} />
          <Input label="Tags" placeholder="granny square, summer, gift" value={form.tags} onChange={f('tags')} />
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_public} onChange={e => setForm(p => ({ ...p, is_public: e.target.checked }))} className="rounded text-brand-500" />
              Make public
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_for_sale} onChange={e => setForm(p => ({ ...p, is_for_sale: e.target.checked }))} className="rounded text-brand-500" />
              Sell this pattern
            </label>
          </div>
          {form.is_for_sale && (
            <Input label="Price (₱)" type="number" min="0" step="0.01" placeholder="120.00" value={form.price} onChange={f('price')} />
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={() => upsert.mutate()} loading={upsert.isPending} className="flex-1" disabled={!form.title}>
              {editing ? 'Update' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
