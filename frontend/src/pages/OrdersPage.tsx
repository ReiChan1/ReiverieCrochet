import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Card, Button, Input, Textarea, Select, Modal, EmptyState, StatusBadge, StatCard } from '../components/ui'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { Order } from '../types'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const STATUSES = ['pending', 'in_progress', 'completed', 'cancelled']
const emptyForm = { client_name: '', client_email: '', item_name: '', yarn_name: '', hook_size: '', price: '', status: 'pending', notes: '', due_date: '' }

export default function OrdersPage() {
  const { profile } = useAuthStore()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Order | null>(null)
  const [form, setForm] = useState(emptyForm)

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('*').eq('crafter_id', profile!.id).order('created_at', { ascending: false })
      if (error) throw error
      return data as Order[]
    },
    enabled: !!profile,
  })

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        crafter_id: profile!.id,
        client_name: form.client_name,
        client_email: form.client_email || null,
        item_name: form.item_name,
        yarn_name: form.yarn_name || null,
        hook_size: form.hook_size || null,
        price: form.price ? parseFloat(form.price) : null,
        status: form.status,
        notes: form.notes || null,
        due_date: form.due_date || null,
      }
      if (editing) {
        const { error } = await supabase.from('orders').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('orders').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      setModalOpen(false); setEditing(null); setForm(emptyForm)
      toast.success(editing ? 'Order updated!' : 'Commission added!')
    },
    onError: () => toast.error('Failed to save'),
  })

  const deleteOrder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('orders').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); toast.success('Deleted') },
  })

  const openEdit = (o: Order) => {
    setEditing(o)
    setForm({ client_name: o.client_name, client_email: o.client_email ?? '', item_name: o.item_name, yarn_name: o.yarn_name ?? '', hook_size: o.hook_size ?? '', price: o.price?.toString() ?? '', status: o.status, notes: o.notes ?? '', due_date: o.due_date ?? '' })
    setModalOpen(true)
  }

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }))

  const totalRevenue = orders?.filter(o => o.status === 'completed').reduce((s, o) => s + (o.price ?? 0), 0) ?? 0
  const activeOrders = orders?.filter(o => o.status === 'in_progress').length ?? 0

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2 className="page-title">Commission Orders</h2>
          <p className="text-sm text-gray-500">Manage your crochet commissions and client orders</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(emptyForm); setModalOpen(true) }}>
          <Plus className="w-4 h-4" /> New Order
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={`₱${totalRevenue.toLocaleString()}`} icon="💰" />
        <StatCard label="Active Orders" value={activeOrders} icon="🔄" />
        <StatCard label="Completed" value={orders?.filter(o => o.status === 'completed').length ?? 0} icon="✅" />
        <StatCard label="Pending" value={orders?.filter(o => o.status === 'pending').length ?? 0} icon="⏳" />
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="card h-20 animate-pulse bg-gray-100" />)}</div>
      ) : orders && orders.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Client', 'Item', 'Yarn', 'Hook', 'Price', 'Due', 'Status', ''].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-medium text-gray-900">{o.client_name}</p>
                      {o.client_email && <p className="text-xs text-gray-400">{o.client_email}</p>}
                    </td>
                    <td className="py-3 px-3 text-gray-700">{o.item_name}</td>
                    <td className="py-3 px-3 text-gray-500">{o.yarn_name ?? '—'}</td>
                    <td className="py-3 px-3 text-gray-500">{o.hook_size ?? '—'}</td>
                    <td className="py-3 px-3 font-semibold text-gray-900">{o.price ? `₱${o.price}` : '—'}</td>
                    <td className="py-3 px-3 text-gray-500 text-xs">{o.due_date ? format(new Date(o.due_date), 'MMM d') : '—'}</td>
                    <td className="py-3 px-3"><StatusBadge status={o.status} /></td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(o)} className="p-1.5 rounded hover:bg-gray-200 text-gray-400"><Pencil className="w-3 h-3" /></button>
                        <button onClick={() => confirm('Delete?') && deleteOrder.mutate(o.id)} className="p-1.5 rounded hover:bg-red-100 text-red-400"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState icon="🧾" title="No orders yet" description="Add your first commission to start tracking client work" action={<Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Add Order</Button>} />
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? 'Edit Order' : 'New Commission Order'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Client name *" placeholder="Maria Santos" value={form.client_name} onChange={f('client_name')} />
            <Input label="Client email" type="email" placeholder="maria@email.com" value={form.client_email} onChange={f('client_email')} />
          </div>
          <Input label="Item *" placeholder="Baby Blanket" value={form.item_name} onChange={f('item_name')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Yarn" placeholder="Lion Brand DK" value={form.yarn_name} onChange={f('yarn_name')} />
            <Input label="Hook size" placeholder="4.5mm" value={form.hook_size} onChange={f('hook_size')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price (₱)" type="number" min="0" placeholder="1500" value={form.price} onChange={f('price')} />
            <Input label="Due date" type="date" value={form.due_date} onChange={f('due_date')} />
          </div>
          <Select label="Status" value={form.status} onChange={f('status')}>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </Select>
          <Textarea label="Notes" placeholder="Special requests, size, color preferences..." value={form.notes} onChange={f('notes')} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={() => upsert.mutate()} loading={upsert.isPending} className="flex-1" disabled={!form.client_name || !form.item_name}>
              {editing ? 'Update' : 'Create Order'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
