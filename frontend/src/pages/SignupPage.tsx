import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Flower2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button, Input } from '../components/ui'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', display_name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) return toast.error('Passwords do not match')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { username: form.username, display_name: form.display_name },
      },
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Account created! Check your email to verify.')
      navigate('/login')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500 text-white mb-3">
            <Flower2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Join CrochetHub</h1>
          <p className="text-sm text-gray-500 mt-1">Start your crochet journey today</p>
        </div>

        <div className="card shadow-lg">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Create your account</h2>
          <form onSubmit={handleSignup} className="space-y-4">
            <Input label="Username" placeholder="yarn_lover_ph" value={form.username} onChange={set('username')} required />
            <Input label="Display name" placeholder="Maria Reyes" value={form.display_name} onChange={set('display_name')} required />
            <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            <Input label="Password" type="password" placeholder="min. 6 characters" value={form.password} onChange={set('password')} required />
            <Input label="Confirm password" type="password" placeholder="••••••••" value={form.confirm} onChange={set('confirm')} required />
            <Button type="submit" loading={loading} className="w-full">Create account</Button>
          </form>
          <p className="text-xs text-gray-500 text-center mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-500 hover:text-brand-600 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
