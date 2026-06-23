import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Card, Button, Input, Textarea, Select, Modal, EmptyState } from '../components/ui'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { JournalEntry } from '../types'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const MOODS = [
  { value: 'relaxed',   label: '😌 Relaxed' },
  { value: 'focused',   label: '🎯 Focused' },
  { value: 'happy',     label: '😊 Happy' },
  { value: 'frustrated',label: '😤 Frustrated' },
  { value: 'creative',  label: '✨ Creative' },
]

const emptyForm = {
  content: '', mood: 'happy', yarn_used: '', hook_size: '',
  stitches_today: '0', entry_date: new Date().toISOString().split('T')[0],
}

export default function JournalPage() {
  const { profile } = useAuthStore()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<JournalEntry | null>(null)
  const [form, setForm] = useState(emptyForm)

  const { data: entries, isLoading } = useQuery({
    queryKey: ['journal', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', profile!.id)
        .order('entry_date', { ascending: false })
      if (error) throw error
      return data as JournalEntry[]
    },
    enabled: !!profile,
  })

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: profile!.id,
        content: form.content,
        mood: form.mood,
        yarn_used: form.yarn_used || null,
        hook_size: form.hook_size || null,
        stitches_today: parseInt(form.stitches_today) || 0,
        entry_date: form.entry_date,
      }
      if (editing) {
        const { error } = await supabase.from('journal_entries').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('journal_entries').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal'] })
      setModalOpen(false); setEditing(null); setForm(emptyForm)
      toast.success(editing ? 'Entry updated!' : 'Journal entry saved!')
    },
    onError: () => toast.error('Failed to save entry'),
  })

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('journal_entries').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journal'] }); toast.success('Entry deleted') },
  })

  const openEdit = (e: JournalEntry) => {
    setEditing(e)
    setForm({
      content: e.content, mood: e.mood ?? 'happy', yarn_used: e.yarn_used ?? '',
      hook_size: e.hook_size ?? '', stitches_today: e.stitches_today.toString(), entry_date: e.entry_date,
    })
    setModalOpen(true)
  }

  const f = (k: keyof typeof form) => (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: ev.target.value }))

  const moodLabel = (m: string | null) => MOODS.find(x => x.value === m)?.label ?? '😊'
  const totalStitches = entries?.reduce((s, e) => s + e.stitches_today, 0) ?? 0

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2 className="page-title">Crochet Journal</h2>
          <p className="text-sm text-gray-500">{entries?.length ?? 0} entries · {totalStitches.toLocaleString()} stitches logged</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ ...emptyForm, entry_date: new Date().toISOString().split('T')[0] }); setModalOpen(true) }}>
          <Plus className="w-4 h-4" /> New Entry
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="card h-32 animate-pulse bg-gray-100" />)}</div>
      ) : entries && entries.length > 0 ? (
        <div className="space-y-4">
          {entries.map(e => (
            <Card key={e.id} className="hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-base">{moodLabel(e.mood)}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {format(new Date(e.entry_date), 'MMMM d, yyyy')}
                    </span>
                    {e.stitches_today > 0 && (
                      <span className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-medium">
                        {e.stitches_today.toLocaleString()} stitches
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{e.content}</p>
                  {(e.yarn_used || e.hook_size) && (
                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                      {e.yarn_used && <span>🧶 {e.yarn_used}</span>}
                      {e.hook_size && <span>🪝 {e.hook_size}</span>}
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => openEdit(e)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => confirm('Delete entry?') && deleteEntry.mutate(e.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon="📓" title="No journal entries yet" description="Record your crochet sessions, mood, and progress" action={<Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Write First Entry</Button>} />
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? 'Edit Journal Entry' : 'New Journal Entry'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" value={form.entry_date} onChange={f('entry_date')} />
            <Select label="Mood" value={form.mood} onChange={f('mood')}>
              {MOODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </Select>
          </div>
          <Textarea label="What did you work on? *" placeholder="Continued on the granny square blanket. Finally figured out the corner joins!" value={form.content} onChange={f('content')} rows={4} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Yarn used" placeholder="Lion Brand Pound of Love" value={form.yarn_used} onChange={f('yarn_used')} />
            <Input label="Hook size" placeholder="5.5mm" value={form.hook_size} onChange={f('hook_size')} />
          </div>
          <Input label="Stitches today" type="number" min="0" placeholder="0" value={form.stitches_today} onChange={f('stitches_today')} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={() => upsert.mutate()} loading={upsert.isPending} className="flex-1" disabled={!form.content.trim()}>
              {editing ? 'Update' : 'Save Entry'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
