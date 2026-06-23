import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Flower2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button, Input } from '../components/ui'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill in all fields')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Welcome back!')
      navigate('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500 text-white mb-3">
            <Flower2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">CrochetHub</h1>
          <p className="text-sm text-gray-500 mt-1">Your complete crochet world</p>
        </div>

        {/* Card */}
        <div className="card shadow-lg">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Sign in to your account</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <Button type="submit" loading={loading} className="w-full">
              Sign in
            </Button>
          </form>
          <p className="text-xs text-gray-500 text-center mt-4">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-500 hover:text-brand-600 font-medium">
              Sign up
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Made with 🧶 for the crochet community
        </p>
      </div>
    </div>
  )
}
