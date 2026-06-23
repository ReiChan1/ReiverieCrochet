// src/components/ui/index.tsx
// Shared reusable UI primitives for CrochetHub

import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

// ─── Button ───────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-brand-500 text-white hover:bg-brand-600': variant === 'primary',
          'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50': variant === 'secondary',
          'text-gray-600 hover:bg-gray-100': variant === 'ghost',
          'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
          'px-2.5 py-1.5 text-xs': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
          'px-5 py-2.5 text-base': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
)
Button.displayName = 'Button'

// ─── Input ────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <input
        ref={ref}
        className={clsx(
          'input',
          error && 'border-red-400 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'

// ─── Textarea ─────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <textarea
        ref={ref}
        className={clsx(
          'input min-h-[80px] resize-y',
          error && 'border-red-400',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'

// ─── Select ───────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, children, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <select
        ref={ref}
        className={clsx('input bg-white', error && 'border-red-400', className)}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
)
Select.displayName = 'Select'

// ─── Card ─────────────────────────────────────────────────────
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('card', className)}>{children}</div>
}

// ─── Badge / Tag ──────────────────────────────────────────────
type BadgeVariant = 'purple' | 'teal' | 'amber' | 'coral' | 'pink' | 'green' | 'gray'
const badgeVariants: Record<BadgeVariant, string> = {
  purple: 'bg-brand-50 text-brand-600',
  teal:   'bg-emerald-50 text-emerald-700',
  amber:  'bg-amber-50 text-amber-700',
  coral:  'bg-red-50 text-red-700',
  pink:   'bg-pink-50 text-pink-700',
  green:  'bg-lime-50 text-lime-700',
  gray:   'bg-gray-100 text-gray-600',
}
export function Badge({ children, variant = 'purple', className }: { children: React.ReactNode; variant?: BadgeVariant; className?: string }) {
  return (
    <span className={clsx('badge', badgeVariants[variant], className)}>
      {children}
    </span>
  )
}

// ─── Avatar ───────────────────────────────────────────────────
export function Avatar({ name, avatarUrl, size = 'md' }: { name: string; avatarUrl?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['bg-brand-50 text-brand-600', 'bg-emerald-50 text-emerald-700', 'bg-amber-50 text-amber-700', 'bg-pink-50 text-pink-700']
  const color = colors[name.charCodeAt(0) % colors.length]
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' }
  if (avatarUrl) return <img src={avatarUrl} alt={name} className={clsx('rounded-full object-cover', sizes[size])} />
  return (
    <div className={clsx('rounded-full flex items-center justify-center font-medium flex-shrink-0', color, sizes[size])}>
      {initials}
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────
export function ProgressBar({ value, max = 100, className }: { value: number; max?: number; className?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={clsx('h-1.5 w-full rounded-full bg-gray-100', className)}>
      <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────
import { X } from 'lucide-react'
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: { icon: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-base font-medium text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon?: string }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
    </div>
  )
}

// ─── Loading Spinner ──────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx('animate-spin text-brand-500', className ?? 'w-6 h-6')} />
}

// ─── Status Badge ─────────────────────────────────────────────
const statusMap: Record<string, { label: string; variant: BadgeVariant }> = {
  planned:     { label: 'Planned',     variant: 'gray' },
  in_progress: { label: 'In Progress', variant: 'amber' },
  completed:   { label: 'Completed',   variant: 'teal' },
  frogged:     { label: 'Frogged',     variant: 'coral' },
  pending:     { label: 'Pending',     variant: 'gray' },
  cancelled:   { label: 'Cancelled',   variant: 'coral' },
  accepted:    { label: 'Accepted',    variant: 'teal' },
  Beginner:    { label: 'Beginner',    variant: 'teal' },
  Intermediate:{ label: 'Intermediate',variant: 'amber' },
  Advanced:    { label: 'Advanced',    variant: 'coral' },
}
export function StatusBadge({ status }: { status: string }) {
  const s = statusMap[status] ?? { label: status, variant: 'gray' as BadgeVariant }
  return <Badge variant={s.variant}>{s.label}</Badge>
}
