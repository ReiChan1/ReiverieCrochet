import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Card, Button, Input, Textarea, Select, Modal, StatusBadge, ProgressBar, EmptyState, Badge } from '../components/ui'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { Project } from '../types'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUSES = ['planned', 'in_progress', 'completed', 'frogged']
const STATUS_LABELS: Record<string, string> = {
  planned: 'Planned', in_progress: 'In Progress', completed: 'Completed', frogged: 'Frogged'
}

const emptyForm = {
  title: '', status: 'planned', yarn_name: '', hook_size_mm: '',
  total_rows: '', notes: '', started_at: '', tags: ''
}

export default function ProjectsPage() {
  const { profile } = useAuthStore()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [filter, setFilter] = useState('all')

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', profile!.id)
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data as Project[]
    },
    enabled: !!profile,
  })

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: profile!.id,
        title: form.title,
        status: form.status,
        yarn_name: form.yarn_name || null,
        hook_size_mm: form.hook_size_mm ? parseFloat(form.hook_size_mm) : null,
        total_rows: form.total_rows ? parseInt(form.total_rows) : null,
        notes: form.notes || null,
        started_at: form.started_at || null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      }
      if (editing) {
        const { error } = await supabase.from('projects').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('projects').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      setModalOpen(false)
      setEditing(null)
      setForm(emptyForm)
      toast.success(editing ? 'Project updated!' : 'Project created!')
    },
    onError: () => toast.error('Failed to save project'),
  })

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project deleted')
    },
  })

  const openEdit = (p: Project) => {
    setEditing(p)
    setForm({
      title: p.title, status: p.status, yarn_name: p.yarn_name ?? '',
      hook_size_mm: p.hook_size_mm?.toString() ?? '', total_rows: p.total_rows?.toString() ?? '',
      notes: p.notes ?? '', started_at: p.started_at ?? '', tags: p.tags?.join(', ') ?? '',
    })
    setModalOpen(true)
  }

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const filtered = filter === 'all' ? projects : projects?.filter(p => p.status === filter)

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2 className="page-title">Projects</h2>
          <p className="text-sm text-gray-500">Track all your WIPs from cast on to finish</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(emptyForm); setModalOpen(true) }}>
          <Plus className="w-4 h-4" /> New Project
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', ...STATUSES].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === s ? 'bg-brand-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === 'all' ? 'All' : STATUS_LABELS[s]}
            {s !== 'all' && (
              <span className="ml-1 opacity-70">
                ({projects?.filter(p => p.status === s).length ?? 0})
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-40 animate-pulse bg-gray-100" />)}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => {
            const pct = p.total_rows ? Math.round((p.current_row / p.total_rows) * 100) : 0
            return (
              <Card key={p.id} className="hover:border-brand-200 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 leading-tight pr-2">{p.title}</h3>
                  <StatusBadge status={p.status} />
                </div>
                <div className="text-xs text-gray-400 mb-3">
                  {p.yarn_name && <span>🧶 {p.yarn_name}</span>}
                  {p.hook_size_mm && <span> · 🪝 {p.hook_size_mm}mm</span>}
                  {p.started_at && <span className="block mt-0.5">Started {format(new Date(p.started_at), 'MMM d, yyyy')}</span>}
                </div>
                {p.total_rows && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Row {p.current_row}/{p.total_rows}</span>
                      <span>{pct}%</span>
                    </div>
                    <ProgressBar value={pct} />
                  </div>
                )}
                {p.tags && p.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap mb-3">
                    {p.tags.map(t => <Badge key={t} variant="gray" className="text-[10px]">{t}</Badge>)}
                  </div>
                )}
                <div className="flex gap-2 mt-auto">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)} className="flex-1">
                    <Pencil className="w-3 h-3" /> Edit
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => confirm('Delete this project?') && deleteProject.mutate(p.id)}
                    className="text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon="📋"
          title="No projects yet"
          description="Create your first project to start tracking your crochet journey"
          action={<Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Create Project</Button>}
        />
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? 'Edit Project' : 'New Project'}>
        <div className="space-y-4">
          <Input label="Project title *" placeholder="e.g. Granny Square Blanket" value={form.title} onChange={f('title')} required />
          <Select label="Status" value={form.status} onChange={f('status')}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Yarn name" placeholder="Lion Brand Pound of Love" value={form.yarn_name} onChange={f('yarn_name')} />
            <Input label="Hook size (mm)" type="number" step="0.5" placeholder="5.5" value={form.hook_size_mm} onChange={f('hook_size_mm')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Total rows" type="number" placeholder="60" value={form.total_rows} onChange={f('total_rows')} />
            <Input label="Start date" type="date" value={form.started_at} onChange={f('started_at')} />
          </div>
          <Input label="Tags (comma-separated)" placeholder="blanket, gift, granny square" value={form.tags} onChange={f('tags')} />
          <Textarea label="Notes" placeholder="Pattern notes, reminders..." value={form.notes} onChange={f('notes')} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={() => upsert.mutate()} loading={upsert.isPending} className="flex-1" disabled={!form.title}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
