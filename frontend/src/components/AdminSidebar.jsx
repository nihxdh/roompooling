import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  BuildingOffice2Icon,
  CalendarDaysIcon,
  UsersIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'

const NAV_ITEMS = [
  { key: 'accommodations', label: 'Accommodations', icon: BuildingOffice2Icon, path: '/admin/dashboard' },
  { key: 'bookings', label: 'Bookings', icon: CalendarDaysIcon, path: '/admin/bookings' },
  { key: 'users', label: 'Users', icon: UsersIcon, path: '/admin/users' },
]

function AdminSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    navigate('/', { replace: true })
  }

  const isActive = (item) => location.pathname.startsWith(item.path)

  const handleNav = (path) => {
    navigate(path)
    setMobileOpen(false)
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 text-white">
            <ShieldCheckIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">Admin</h1>
            <p className="text-[10px] text-slate-400">Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <button
              key={item.key}
              onClick={() => handleNav(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-slate-800/10 text-slate-800'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? 'text-slate-800' : 'text-slate-400'}`} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="px-3 pb-5 pt-3 border-t border-slate-100 mt-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <ArrowLeftOnRectangleIcon className="h-[18px] w-[18px]" />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-40 md:hidden p-2 bg-white rounded-xl border border-slate-200 shadow-sm text-slate-600 hover:bg-slate-50"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative w-60 h-full bg-white shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      <aside className="hidden md:flex w-56 flex-shrink-0 bg-white border-r border-slate-200/80 h-screen sticky top-0">
        {sidebarContent}
      </aside>
    </>
  )
}

export default AdminSidebar
