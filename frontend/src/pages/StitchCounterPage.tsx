import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Card, Button, Select, Textarea } from '../components/ui'
import { Plus, Minus, RotateCcw, ChevronRight, Check, Save } from 'lucide-react'
import type { Project, StitchSession } from '../types'
import toast from 'react-hot-toast'

export default function StitchCounterPage() {
  const { profile } = useAuthStore()
  const qc = useQueryClient()

  const [count, setCount] = useState(0)
  const [rowNumber, setRowNumber] = useState(1)
  const [selectedProject, setSelectedProject] = useState('')
  const [notes, setNotes] = useState('')
  const [rowHistory, setRowHistory] = useState<{ row: number; stitches: number }[]>([])

  // Load active projects
  const { data: projects } = useQuery({
    queryKey: ['projects-active', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, title')
        .eq('user_id', profile!.id)
        .in('status', ['in_progress', 'planned'])
        .order('updated_at', { ascending: false })
      return (data ?? []) as Pick<Project, 'id' | 'title'>[]
    },
    enabled: !!profile,
  })

  // Load today's sessions
  const { data: todaySessions } = useQuery({
    queryKey: ['sessions-today', profile?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('stitch_sessions')
        .select('*')
        .eq('user_id', profile!.id)
        .gte('recorded_at', today)
        .order('recorded_at', { ascending: true })
      return (data ?? []) as StitchSession[]
    },
    enabled: !!profile,
  })

  // Save session
  const saveSession = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('stitch_sessions').insert({
        user_id: profile!.id,
        project_id: selectedProject || null,
        row_number: rowNumber,
        stitch_count: count,
        notes: notes || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      setRowHistory(h => [...h, { row: rowNumber, stitches: count }])
      setRowNumber(r => r + 1)
      setCount(0)
      setNotes('')
      qc.invalidateQueries({ queryKey: ['sessions-today'] })
      toast.success(`Row ${rowNumber} saved! ${count} stitches`)
      // Award XP
      if (profile) supabase.rpc('update_xp', { p_user_id: profile.id, p_xp: Math.floor(count / 10) })
    },
    onError: () => toast.error('Failed to save row'),
  })

  const adjust = useCallback((n: number) => setCount(c => Math.max(0, c + n)), [])
  const reset = () => { setCount(0) }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === '+' || e.key === '=') adjust(1)
      if (e.key === '-') adjust(-1)
      if (e.key === 'Enter') saveSession.mutate()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [adjust, saveSession])

  const todayTotal = (todaySessions ?? []).reduce((sum, s) => sum + s.stitch_count, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Counter */}
        <div className="lg:col-span-2">
          <Card>
            {/* Display */}
            <div className="bg-brand-50 rounded-xl p-8 text-center mb-6">
              <p className="text-xs font-medium text-brand-400 uppercase tracking-wider mb-1">Row {rowNumber}</p>
              <div className="text-7xl font-semibold text-brand-600 tabular-nums leading-none mb-2">
                {count.toString().padStart(3, '0')}
              </div>
              <p className="text-xs text-brand-400">stitches this row</p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <button onClick={() => adjust(-10)} className="w-12 h-12 rounded-full border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">
                −10
              </button>
              <button onClick={() => adjust(-1)} className="w-12 h-12 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors">
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => adjust(1)}
                className="w-20 h-20 rounded-full bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-200 flex items-center justify-center transition-colors"
              >
                <Plus className="w-8 h-8" />
              </button>
              <button onClick={() => adjust(1)} className="w-12 h-12 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors">
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
              <button onClick={() => adjust(10)} className="w-12 h-12 rounded-full border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">
                +10
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="secondary" onClick={reset} className="flex-1">
                <RotateCcw className="w-4 h-4" /> Reset
              </Button>
              <Button onClick={() => saveSession.mutate()} loading={saveSession.isPending} className="flex-1">
                <Save className="w-4 h-4" /> Save Row {rowNumber}
              </Button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-3">
              Keyboard: <kbd className="bg-gray-100 px-1 rounded">+</kbd> add · <kbd className="bg-gray-100 px-1 rounded">−</kbd> remove · <kbd className="bg-gray-100 px-1 rounded">Enter</kbd> save row
            </p>
          </Card>
        </div>

        {/* Sidebar settings + history */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Session Settings</h3>
            <div className="space-y-3">
              <Select
                label="Link to Project"
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
              >
                <option value="">— No project —</option>
                {projects?.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </Select>
              <Textarea
                label="Row notes (optional)"
                placeholder="e.g. sc 24, dc2tog, ch2..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="min-h-[60px]"
              />
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Today's Total</h3>
            <div className="text-3xl font-semibold text-brand-500 mb-1">{todayTotal.toLocaleString()}</div>
            <p className="text-xs text-gray-400">{todaySessions?.length ?? 0} rows logged today</p>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Row History</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {rowHistory.length === 0 && todaySessions?.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">No rows yet — start counting!</p>
              )}
              {[...rowHistory].reverse().map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-3 h-3 text-brand-500 shrink-0" />
                  <span className="text-gray-500">Row {r.row}</span>
                  <ChevronRight className="w-3 h-3 text-gray-300" />
                  <span className="font-medium text-gray-700">{r.stitches} st</span>
                </div>
              ))}
              {todaySessions?.map(s => (
                <div key={s.id} className="flex items-center gap-2 text-sm opacity-60">
                  <Check className="w-3 h-3 text-brand-500 shrink-0" />
                  <span className="text-gray-500">Row {s.row_number}</span>
                  <ChevronRight className="w-3 h-3 text-gray-300" />
                  <span className="font-medium text-gray-700">{s.stitch_count} st</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
