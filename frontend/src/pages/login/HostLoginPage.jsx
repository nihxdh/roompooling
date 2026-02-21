import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { BuildingOffice2Icon, XMarkIcon } from '@heroicons/react/24/outline'
import SuccessModal from '../../components/SuccessModal'
import hostLoginImg from '../../assets/hostLogin.png'

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL

function HostLoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const navigate = useNavigate()

  // Login state
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Register state
  const [hostName, setHostName] = useState('')
  const [hostEmail, setHostEmail] = useState('')
  const [hostPhone, setHostPhone] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState('')
  const [registerSuccess, setRegisterSuccess] = useState('')

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const { data } = await axios.post(`${API_BASE}/api/host/login`, { phone, otp })
      if (data.success && data.token) {
        localStorage.setItem('hostToken', data.token)
        navigate('/host/dashboard', { replace: true })
      } else {
        setLoginError(data.error || 'Login failed.')
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Login failed.'
      localStorage.removeItem('hostToken')
      setLoginError(msg)
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setRegisterError('')
    setRegisterSuccess('')
    setRegisterLoading(true)
    try {
      const { data } = await axios.post(`${API_BASE}/api/host/register`, {
        name: hostName,
        email: hostEmail,
        phone: hostPhone
      })
      if (data.success) {
        setRegisterSuccess('Registration successful! You can now login with your phone number and OTP 9876.')
        setHostName('')
        setHostEmail('')
        setHostPhone('')
      } else {
        setRegisterError(data.error || 'Registration failed.')
      }
    } catch (err) {
      setRegisterError(err.response?.data?.error || err.message || 'Registration failed.')
    } finally {
      setRegisterLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-x-hidden">
      <Link
        to="/"
        className="fixed top-4 right-4 z-10 p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 hover:scale-110 transition-all duration-300 animate-fade-in"
        aria-label="Close"
      >
        <XMarkIcon className="h-6 w-6" />
      </Link>

      {!isRegister ? (
        <>
          <div className="hidden lg:flex lg:w-2/5 items-center justify-center animate-slide-in-right h-screen">
            <img
              src={hostLoginImg}
              alt="Host illustration"
              className="h-full w-full object-cover drop-shadow-xl"
            />
          </div>
          <div className="w-full lg:w-3/5 flex flex-col justify-center px-8 lg:px-20 bg-slate-50 animate-slide-in-left overflow-y-auto min-h-screen">
            <div className="w-full max-w-md mx-auto">
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-[#2363EB] flex items-center justify-center">
                    <BuildingOffice2Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-lg font-bold text-slate-900 tracking-tight">Room Pool</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
                <p className="text-slate-500 text-sm">Sign in to manage your accommodation listings.</p>
              </div>

              {loginError && (
                <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2.5" role="alert">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-xs font-bold">!</span>
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">+91</span>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      disabled={loginLoading}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all duration-200 disabled:opacity-60 text-sm"
                      placeholder="9876543210"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-slate-700 mb-1.5">One-Time Password</label>
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    disabled={loginLoading}
                    maxLength={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all duration-200 disabled:opacity-60 text-sm tracking-widest"
                    placeholder="••••"
                  />
                  <p className="text-slate-400 text-xs mt-1.5">Use OTP <span className="font-mono font-medium text-slate-500">9876</span> for demo</p>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 px-4 bg-[#2363EB] text-white font-semibold rounded-xl hover:bg-[#1b50c7] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#2363EB]/25 mt-2"
                >
                  {loginLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : 'Sign In'}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                <p className="text-slate-500 text-sm">
                  New host?{' '}
                  <button
                    type="button"
                    onClick={() => { setIsRegister(true); setLoginError(''); setRegisterError(''); setRegisterSuccess('') }}
                    className="text-[#2363EB] font-semibold hover:underline"
                  >
                    Register here
                  </button>
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="w-full flex flex-col items-center justify-center p-8 bg-slate-100 min-h-screen overflow-y-auto">
          <div className="w-full max-w-lg">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#2363EB]/10">
                <BuildingOffice2Icon className="h-6 w-6 text-[#2363EB]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Host Registration</h1>
                <p className="text-slate-500 text-sm">Create your host account to list accommodations</p>
              </div>
            </div>

            <SuccessModal message={registerSuccess} onClose={() => setRegisterSuccess('')} />

            <form onSubmit={handleRegisterSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="p-8 md:p-12 space-y-6">
                {registerError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-3" role="alert">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-200 flex items-center justify-center text-red-600 text-xs font-bold">!</span>
                    {registerError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    required
                    disabled={registerLoading}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={hostEmail}
                    onChange={(e) => setHostEmail(e.target.value)}
                    required
                    disabled={registerLoading}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone <span className="text-slate-400 font-normal">(used for login)</span></label>
                  <input
                    type="tel"
                    value={hostPhone}
                    onChange={(e) => setHostPhone(e.target.value)}
                    required
                    disabled={registerLoading}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <div className="px-8 md:px-12 py-6 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="w-full sm:w-auto px-8 py-3 bg-[#2363EB] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registerLoading ? 'Registering...' : 'Register'}
                </button>
                <p className="text-slate-600 text-sm">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => { setIsRegister(false); setRegisterError(''); setRegisterSuccess('') }}
                    className="text-[#2363EB] font-medium hover:underline"
                  >
                    Login
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default HostLoginPage
