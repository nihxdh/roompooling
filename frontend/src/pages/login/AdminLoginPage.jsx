import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Cog6ToothIcon, XMarkIcon } from '@heroicons/react/24/outline'

// Base URL from environment - no hardcoding
const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL

function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('') // Clear previous errors
    setLoading(true)

    try {
      // POST request to admin login endpoint
      const { data } = await axios.post(`${API_BASE}/api/admin/login`, {
        email,
        password
      })

      // Success: store token and redirect
      if (data.success && data.token) {
        localStorage.setItem('adminToken', data.token)
        navigate('/admin/dashboard', { replace: true })
      } else {
        setError(data.error || 'Login failed. Please try again.')
      }
    } catch (err) {
      // Handle backend error response (4xx, 5xx)
      const backendMessage = err.response?.data?.error
      setError(backendMessage || err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-100 relative">
      <Link
        to="/"
        className="fixed top-4 right-4 z-10 p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 hover:scale-110 transition-all duration-300 animate-fade-in"
        aria-label="Close"
      >
        <XMarkIcon className="h-6 w-6" />
      </Link>

      <div className="w-full max-w-sm animate-slide-up">
        {/* Card with top accent bar */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-slate-200 hover:shadow-xl transition-shadow duration-300">
          <div className="h-1 bg-slate-800" />
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-slate-800 text-white transition-transform duration-300 hover:scale-110">
                <Cog6ToothIcon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Admin</h1>
                <p className="text-slate-500 text-sm">Dashboard access</p>
              </div>
            </div>

            {/* Backend error message */}
            {error && (
              <div
                className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
                role="alert"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-sm mt-6 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLoginPage
