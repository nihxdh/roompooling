import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserIcon, XMarkIcon } from '@heroicons/react/24/outline'

function SeekerLoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isRegister && password !== confirmPassword) return
    // TODO: Implement login/register logic
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-sky-50 via-white to-blue-50 relative">
      <Link
        to="/"
        className="fixed top-4 right-4 z-10 p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 hover:scale-110 transition-all duration-300 animate-fade-in"
        aria-label="Close"
      >
        <XMarkIcon className="h-6 w-6" />
      </Link>
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-sky-500/10 border-2 border-sky-500/30 mb-5 transition-transform duration-300 hover:scale-110">
            <UserIcon className="h-10 w-10 text-sky-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Find your room</h1>
          <p className="text-slate-600 mt-1 text-sm">
            {isRegister ? 'Create an account to get started' : 'Sign in to browse available rooms'}
          </p>
        </div>

        <div className="flex border-b border-slate-200 mb-8">
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            className={`flex-1 pb-3 text-sm font-medium transition-all duration-300 border-b-2 -mb-px ${!isRegister ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            className={`flex-1 pb-3 text-sm font-medium transition-all duration-300 border-b-2 -mb-px ${isRegister ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={isRegister}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none transition-all duration-200"
                placeholder="John Doe"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none transition-all duration-200"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isRegister ? 6 : undefined}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none transition-all duration-200"
              placeholder="••••••••"
            />
          </div>
          {isRegister && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required={isRegister}
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none transition-all duration-200"
                placeholder="••••••••"
              />
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
              )}
            </div>
          )}
          <button
            type="submit"
            disabled={isRegister && password !== confirmPassword}
            className="w-full py-3 px-4 bg-sky-600 text-white font-medium rounded-xl hover:bg-sky-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-6"
          >
            {isRegister ? 'Register' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default SeekerLoginPage
