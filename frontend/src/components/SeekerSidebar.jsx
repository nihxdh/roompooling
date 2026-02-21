import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  HomeIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

const NAV_ITEMS = [
  { to: '/seeker/dashboard', label: 'Accommodations', icon: HomeIcon },
  { to: '/seeker/bookings', label: 'My Bookings', icon: CalendarDaysIcon },
  { to: '/seeker/chat', label: 'Messages', icon: ChatBubbleLeftRightIcon },
  { to: '/seeker/profile', label: 'My Profile', icon: UserCircleIcon },
]

function SeekerSidebar({ mobileOpen, setMobileOpen }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('seekerToken')
    navigate('/', { replace: true })
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center">
          <MagnifyingGlassIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-base font-bold text-slate-900 tracking-tight">Room Pool</span>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Seeker</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-2 space-y-1">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen?.(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen?.(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/30" onClick={() => setMobileOpen?.(false)} />
          <div className="relative w-64 bg-white shadow-xl animate-slide-in-right">
            <button
              onClick={() => setMobileOpen?.(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}

export default SeekerSidebar
