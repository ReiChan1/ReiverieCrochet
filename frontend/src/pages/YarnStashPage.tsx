import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Card, Button, Input, Textarea, Select, Modal, EmptyState, Badge } from '../components/ui'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { YarnStash } from '../types'
import toast from 'react-hot-toast'

const WEIGHTS = ['Lace', 'Fingering', 'Sport', 'DK', 'Worsted', 'Bulky', 'Super Bulky']

const emptyForm = { name: '', brand: '', color_name: '', color_hex: '#a78bfa', weight: 'Worsted', fiber: '', yardage: '', skeins: '1', dye_lot: '', notes: '' }

export default function YarnStashPage() {
  const { profile } = useAuthStore()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<YarnStash | null>(null)
  const [form, setForm] = useState(emptyForm)

  const { data: yarns, isLoading } = useQuery({
    queryKey: ['yarn', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('yarn_stash').select('*').eq('user_id', profile!.id).order('name')
      if (error) throw error
      return data as YarnStash[]
    },
    enabled: !!profile,
  })

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: profile!.id,
        name: form.name, brand: form.brand || null, color_name: form.color_name || null,
        color_hex: form.color_hex || null, weight: form.weight as YarnStash['weight'],
        fiber: form.fiber || null, yardage: form.yardage ? parseInt(form.yardage) : null,
        skeins: parseFloat(form.skeins) || 1, dye_lot: form.dye_lot || null, notes: form.notes || null,
      }
      if (editing) {
        const { error } = await supabase.from('yarn_stash').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('yarn_stash').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['yarn'] }); setModalOpen(false); setEditing(null); setForm(emptyForm)
      toast.success(editing ? 'Yarn updated!' : 'Yarn added to stash!')
    },
    onError: () => toast.error('Failed to save'),
  })

  const deleteYarn = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('yarn_stash').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['yarn'] }); toast.success('Removed from stash') },
  })

  const openEdit = (y: YarnStash) => {
    setEditing(y)
    setForm({ name: y.name, brand: y.brand ?? '', color_name: y.color_name ?? '', color_hex: y.color_hex ?? '#a78bfa', weight: y.weight ?? 'Worsted', fiber: y.fiber ?? '', yardage: y.yardage?.toString() ?? '', skeins: y.skeins.toString(), dye_lot: y.dye_lot ?? '', notes: y.notes ?? '' })
    setModalOpen(true)
  }

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }))

  const totalSkeins = yarns?.reduce((s, y) => s + y.skeins, 0) ?? 0

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2 className="page-title">Yarn Stash</h2>
          <p className="text-sm text-gray-500">{totalSkeins.toFixed(1)} skeins · {yarns?.length ?? 0} entries</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(emptyForm); setModalOpen(true) }}>
          <Plus className="w-4 h-4" /> Add Yarn
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-32 animate-pulse bg-gray-100" />)}
        </div>
      ) : yarns && yarns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {yarns.map(y => (
            <Card key={y.id} className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-full shrink-0 border border-white shadow-sm mt-0.5"
                style={{ backgroundColor: y.color_hex ?? '#e5e7eb' }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{y.name}</p>
                {y.brand && <p className="text-xs text-gray-500">{y.brand}</p>}
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {y.weight && <Badge variant="gray">{y.weight}</Badge>}
                  {y.fiber && <Badge variant="purple">{y.fiber}</Badge>}
                  <Badge variant="amber">{y.skeins} skein{y.skeins !== 1 ? 's' : ''}</Badge>
                </div>
                {y.yardage && <p className="text-xs text-gray-400 mt-1">{y.yardage}yd/skein</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(y)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => confirm('Remove?') && deleteYarn.mutate(y.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon="🧶" title="Your stash is empty" description="Start adding yarn to track your collection" action={<Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Add Yarn</Button>} />
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? 'Edit Yarn' : 'Add to Stash'}>
        <div className="space-y-4">
          <Input label="Yarn name *" placeholder="Lion Brand Pound of Love" value={form.name} onChange={f('name')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Brand" placeholder="Lion Brand" value={form.brand} onChange={f('brand')} />
            <Input label="Color name" placeholder="Lavender" value={form.color_name} onChange={f('color_name')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Color swatch</label><input type="color" value={form.color_hex} onChange={e => setForm(p => ({ ...p, color_hex: e.target.value }))} className="w-full h-10 rounded-lg border border-gray-200 cursor-pointer" /></div>
            <Select label="Weight" value={form.weight} onChange={f('weight')}>{WEIGHTS.map(w => <option key={w}>{w}</option>)}</Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Fiber content" placeholder="100% Acrylic" value={form.fiber} onChange={f('fiber')} />
            <Input label="Yardage/skein" type="number" placeholder="900" value={form.yardage} onChange={f('yardage')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Number of skeins" type="number" step="0.5" min="0.5" placeholder="1" value={form.skeins} onChange={f('skeins')} />
            <Input label="Dye lot" placeholder="12345" value={form.dye_lot} onChange={f('dye_lot')} />
          </div>
          <Textarea label="Notes" placeholder="Soft, great for baby items..." value={form.notes} onChange={f('notes')} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={() => upsert.mutate()} loading={upsert.isPending} className="flex-1" disabled={!form.name}>{editing ? 'Update' : 'Add'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
