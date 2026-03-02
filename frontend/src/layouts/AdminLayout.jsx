import React, { useEffect } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import AdminSidebar from '../components/AdminSidebar'

function AdminLayout() {
  const navigate = useNavigate()
  const token = localStorage.getItem('adminToken')

  useEffect(() => {
    if (!token) {
      navigate('/login/admin', { replace: true })
    }
  }, [token, navigate])

  if (!token) return null

  return (
    <div className="min-h-screen flex bg-slate-100">
      <AdminSidebar />
      <main className="flex-1 overflow-auto min-h-screen md:pl-0">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
