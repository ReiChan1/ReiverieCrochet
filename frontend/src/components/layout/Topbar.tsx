import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const titles: Record<string, string> = {
  '/dashboard':   'Dashboard',
  '/counter':     'Stitch Counter',
  '/projects':    'Projects',
  '/patterns':    'Patterns',
  '/yarn':        'Yarn Stash',
  '/hooks':       'Hook Collection',
  '/social':      'Social Feed',
  '/friends':     'Friends & QR',
  '/marketplace': 'Marketplace',
  '/stats':       'My Stats',
  '/quests':      'Quests & XP',
  '/journal':     'Journal',
  '/portfolio':   'My Portfolio',
  '/orders':      'Commission Orders',
  '/admin':       'Admin Dashboard',
}

export default function Topbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut, profile } = useAuthStore()

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out!')
    navigate('/login')
  }

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-base font-semibold text-gray-900">
        {titles[location.pathname] ?? 'CrochetHub'}
      </h1>

      <div className="flex items-center gap-2">
        {profile && (
          <div className="flex items-center gap-1.5 mr-2 bg-brand-50 rounded-full px-3 py-1">
            <span className="text-xs font-semibold text-brand-600">Lv.{profile.level}</span>
            <div className="w-16 h-1.5 rounded-full bg-brand-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${((profile.xp % 500) / 500) * 100}%` }}
              />
            </div>
          </div>
        )}
        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-500" />
        </button>
        <button
          onClick={handleSignOut}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
