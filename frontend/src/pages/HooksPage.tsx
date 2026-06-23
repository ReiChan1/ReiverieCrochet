import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Card, Button, Input, Textarea, Select, Modal, EmptyState, Badge, StatusBadge } from '../components/ui'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { Hook } from '../types'
import toast from 'react-hot-toast'

const MATERIALS = ['Aluminum', 'Steel', 'Bamboo', 'Ergonomic', 'Plastic']
const CONDITIONS = ['New', 'Good', 'Worn']
const HOOK_SIZES = ['2.0','2.5','3.0','3.5','4.0','4.5','5.0','5.5','6.0','6.5','7.0','8.0','9.0','10.0','12.0']

const emptyForm = { size_mm: '4.0', size_us: '', brand: '', material: 'Aluminum', condition: 'Good', notes: '' }

export default function HooksPage() {
  const { profile } = useAuthStore()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Hook | null>(null)
  const [form, setForm] = useState(emptyForm)

  const { data: hooks, isLoading } = useQuery({
    queryKey: ['hooks', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('hooks').select('*').eq('user_id', profile!.id).order('size_mm')
      if (error) throw error
      return data as Hook[]
    },
    enabled: !!profile,
  })

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: profile!.id,
        size_mm: parseFloat(form.size_mm),
        size_us: form.size_us || null,
        brand: form.brand || null,
        material: form.material as Hook['material'],
        condition: form.condition as Hook['condition'],
        notes: form.notes || null,
      }
      if (editing) {
        const { error } = await supabase.from('hooks').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('hooks').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hooks'] }); setModalOpen(false); setEditing(null); setForm(emptyForm); toast.success('Hook saved!') },
    onError: () => toast.error('Failed to save'),
  })

  const deleteHook = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('hooks').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hooks'] }); toast.success('Removed') },
  })

  const openEdit = (h: Hook) => {
    setEditing(h)
    setForm({ size_mm: h.size_mm.toString(), size_us: h.size_us ?? '', brand: h.brand ?? '', material: h.material ?? 'Aluminum', condition: h.condition ?? 'Good', notes: h.notes ?? '' })
    setModalOpen(true)
  }

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }))

  const conditionVariant: Record<string, 'teal' | 'amber' | 'coral'> = { New: 'teal', Good: 'teal', Worn: 'amber' }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2 className="page-title">Hook Collection</h2>
          <p className="text-sm text-gray-500">{hooks?.length ?? 0} hooks tracked</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(emptyForm); setModalOpen(true) }}>
          <Plus className="w-4 h-4" /> Add Hook
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => <div key={i} className="card h-28 animate-pulse bg-gray-100" />)}
        </div>
      ) : hooks && hooks.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {hooks.map(h => (
            <Card key={h.id} className="text-center relative group">
              <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                <button onClick={() => openEdit(h)} className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-500"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => confirm('Delete?') && deleteHook.mutate(h.id)} className="p-1 rounded bg-gray-100 hover:bg-red-100 text-red-500"><Trash2 className="w-3 h-3" /></button>
              </div>
              <div className="text-2xl font-semibold text-brand-600 mb-1">{h.size_mm}mm</div>
              {h.size_us && <p className="text-xs text-gray-400 mb-1">US {h.size_us}</p>}
              {h.brand && <p className="text-xs text-gray-500 mb-2">{h.brand}</p>}
              <div className="flex gap-1 justify-center flex-wrap">
                {h.material && <Badge variant="gray">{h.material}</Badge>}
                {h.condition && <Badge variant={conditionVariant[h.condition] ?? 'gray'}>{h.condition}</Badge>}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon="🪝" title="No hooks tracked" description="Add your hook collection to track sizes and condition" action={<Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Add Hook</Button>} />
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? 'Edit Hook' : 'Add Hook'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Size (mm) *" value={form.size_mm} onChange={f('size_mm')}>
              {HOOK_SIZES.map(s => <option key={s} value={s}>{s}mm</option>)}
            </Select>
            <Input label="US Size" placeholder="G-6" value={form.size_us} onChange={f('size_us')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Brand" placeholder="Clover Amour" value={form.brand} onChange={f('brand')} />
            <Select label="Material" value={form.material} onChange={f('material')}>{MATERIALS.map(m => <option key={m}>{m}</option>)}</Select>
          </div>
          <Select label="Condition" value={form.condition} onChange={f('condition')}>{CONDITIONS.map(c => <option key={c}>{c}</option>)}</Select>
          <Textarea label="Notes" placeholder="Ergonomic grip, great for long sessions..." value={form.notes} onChange={f('notes')} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={() => upsert.mutate()} loading={upsert.isPending} className="flex-1">{editing ? 'Update' : 'Add'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
