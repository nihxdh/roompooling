import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ShieldCheckIcon, XMarkIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline'

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL

function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await axios.post(`${API_BASE}/api/admin/login`, { email, password })
      if (data.success && data.token) {
        localStorage.setItem('adminToken', data.token)
        navigate('/admin/dashboard', { replace: true })
      } else {
        setError(data.error || 'Login failed. Please try again.')
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative">
      <Link
        to="/"
        className="fixed top-4 right-4 z-10 p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 hover:scale-110 transition-all duration-300"
        aria-label="Close"
      >
        <XMarkIcon className="h-6 w-6" />
      </Link>

      <div className="w-full max-w-sm relative z-10 animate-slide-up">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center shadow-lg">
            <ShieldCheckIcon className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Admin Console</h1>
          <p className="text-slate-500 text-sm">Secure access to the management dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2.5" role="alert">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-xs font-bold">!</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-800/10 focus:border-slate-800 outline-none text-sm transition-all duration-200 disabled:opacity-60"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-800/10 focus:border-slate-800 outline-none text-sm transition-all duration-200 disabled:opacity-60"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 active:scale-[0.98] transition-all duration-200 text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-slate-800/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">Protected area. Authorized personnel only.</p>
      </div>
    </div>
  )
}

export default AdminLoginPage
