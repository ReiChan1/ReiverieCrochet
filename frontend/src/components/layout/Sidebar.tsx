import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard, Calculator, Layers, BookOpen,
  Sparkles, Wrench, Users, UserPlus, ShoppingBag,
  BarChart2, Trophy, PenLine, Briefcase, Receipt, Shield, Flower2
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const navGroups = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard',   label: 'Dashboard',      icon: LayoutDashboard },
      { to: '/counter',     label: 'Stitch Counter', icon: Calculator, badge: 'Live' },
      { to: '/projects',    label: 'Projects',        icon: Layers },
      { to: '/patterns',    label: 'Patterns',        icon: BookOpen },
    ],
  },
  {
    label: 'Stash',
    items: [
      { to: '/yarn',  label: 'Yarn Stash',      icon: Sparkles },
      { to: '/hooks', label: 'Hook Collection', icon: Wrench },
    ],
  },
  {
    label: 'Community',
    items: [
      { to: '/social',      label: 'Social Feed',  icon: Users },
      { to: '/friends',     label: 'Friends & QR', icon: UserPlus },
      { to: '/marketplace', label: 'Marketplace',  icon: ShoppingBag },
    ],
  },
  {
    label: 'Growth',
    items: [
      { to: '/stats',   label: 'My Stats',   icon: BarChart2 },
      { to: '/quests',  label: 'Quests & XP',icon: Trophy },
      { to: '/journal', label: 'Journal',    icon: PenLine },
    ],
  },
  {
    label: 'Business',
    items: [
      { to: '/portfolio', label: 'Portfolio', icon: Briefcase },
      { to: '/orders',    label: 'Orders',    icon: Receipt },
    ],
  },
]

export default function Sidebar() {
  const { profile } = useAuthStore()

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Flower2 className="w-5 h-5 text-brand-500" />
          <span className="text-base font-semibold text-gray-900">CrochetHub</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 ml-7">Your complete crochet world</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {group.label}
            </p>
            {group.items.map(({ to, label, icon: Icon, badge }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span className="text-[10px] font-semibold bg-brand-500 text-white px-1.5 py-0.5 rounded-full">
                    {badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}

        {/* Admin */}
        {profile?.is_admin && (
          <div className="mb-4">
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Admin</p>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-red-50 text-red-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <Shield className="w-4 h-4 shrink-0" />
              <span className="flex-1">Admin</span>
              <span className="text-[10px] font-semibold bg-red-500 text-white px-1.5 py-0.5 rounded-full">!</span>
            </NavLink>
          </div>
        )}
      </nav>

      {/* User profile at bottom */}
      {profile && (
        <div className="px-3 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-xs font-semibold text-brand-600">
              {profile.display_name?.slice(0, 2).toUpperCase() ?? 'ME'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{profile.display_name}</p>
              <p className="text-[10px] text-gray-400">Lv.{profile.level} · {profile.xp.toLocaleString()} XP</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
