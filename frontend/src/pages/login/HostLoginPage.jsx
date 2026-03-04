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
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Register state
  const [hostName, setHostName] = useState('')
  const [hostEmail, setHostEmail] = useState('')
  const [hostPhone, setHostPhone] = useState('')
  const [hostPassword, setHostPassword] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState('')
  const [registerSuccess, setRegisterSuccess] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [regPhoneError, setRegPhoneError] = useState('')
  const [regEmailError, setRegEmailError] = useState('')

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const handlePhoneChange = (val, setter, setError) => {
    const digits = val.replace(/\D/g, '').slice(0, 10)
    setter(digits)
    setError(digits.length > 0 && digits.length !== 10 ? 'Phone must be 10 digits' : '')
  }
  const handleEmailBlur = (email, setError) => {
    if (!email) setError('')
    else setError(EMAIL_REGEX.test(email) ? '' : 'Enter a valid email address')
  }
  const validatePhone = (val) => /^\d{10}$/.test(val)
  const validateEmail = (val) => EMAIL_REGEX.test(val)

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLoginError('')
    setPhoneError('')
    if (!validatePhone(phone)) {
      setPhoneError('Enter a valid 10-digit phone number')
      return
    }
    if (!password || password.length < 6) {
      setLoginError('Password is required')
      return
    }
    setLoginLoading(true)
    try {
      const { data } = await axios.post(`${API_BASE}/api/host/login`, { phone, password })
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
    setRegPhoneError('')
    setRegEmailError('')
    if (!validateEmail(hostEmail)) {
      setRegEmailError('Enter a valid email address')
      return
    }
    if (!validatePhone(hostPhone)) {
      setRegPhoneError('Enter a valid 10-digit phone number')
      return
    }
    if (!hostPassword || hostPassword.length < 6) {
      setRegisterError('Password must be at least 6 characters')
      return
    }
    setRegisterLoading(true)
    try {
      const { data } = await axios.post(`${API_BASE}/api/host/register`, {
        name: hostName,
        email: hostEmail,
        phone: hostPhone,
        password: hostPassword
      })
      if (data.success) {
        setRegisterSuccess('Registration successful! You can now login with your phone number and password.')
        setHostName('')
        setHostEmail('')
        setHostPhone('')
        setHostPassword('')
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
                  <div className="w-11 h-11 rounded-xl bg-[#595AFD] flex items-center justify-center">
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
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value, setPhone, setPhoneError)}
                      required
                      disabled={loginLoading}
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border bg-white focus:ring-2 focus:ring-[#595AFD]/20 focus:border-[#595AFD] outline-none transition-all duration-200 disabled:opacity-60 text-sm ${phoneError ? 'border-red-300' : 'border-slate-200'}`}
                      placeholder="9876543210"
                    />
                  </div>
                  {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loginLoading}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#595AFD]/20 focus:border-[#595AFD] outline-none transition-all duration-200 disabled:opacity-60 text-sm"
                    placeholder="••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 px-4 bg-[#595AFD] text-white font-semibold rounded-xl hover:bg-[#4B4CE6] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#595AFD]/25 mt-2"
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
                    onClick={() => { setIsRegister(true); setLoginError(''); setRegisterError(''); setRegisterSuccess(''); setPhoneError(''); setRegPhoneError(''); setRegEmailError(''); setPassword('') }}
                    className="text-[#595AFD] font-semibold hover:underline"
                  >
                    Register here
                  </button>
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex w-full min-h-screen overflow-hidden">
          {/* Image panel — same as login */}
          <div className="hidden lg:flex lg:w-2/5 flex-shrink-0 items-center justify-center h-screen overflow-hidden">
            <img
              src={hostLoginImg}
              alt="Host illustration"
              className="h-full w-full object-cover drop-shadow-xl"
            />
          </div>

          {/* Registration form panel */}
          <div className="w-full lg:w-3/5 flex flex-col min-h-screen overflow-y-auto bg-slate-50">
            <div className="flex flex-col justify-center flex-1 px-8 lg:px-20 py-8">
              <div className="w-full max-w-md mx-auto">
                <div className="flex items-center gap-3 mb-8">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#595AFD]/10">
                    <BuildingOffice2Icon className="h-6 w-6 text-[#595AFD]" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">Host Registration</h1>
                    <p className="text-slate-500 text-sm">Create your host account to list accommodations</p>
                  </div>
                </div>

                <SuccessModal message={registerSuccess} onClose={() => setRegisterSuccess('')} />

                <form onSubmit={handleRegisterSubmit} className="space-y-5">
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
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#595AFD]/20 focus:border-[#595AFD] outline-none transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={hostEmail}
                      onChange={(e) => { setHostEmail(e.target.value); setRegEmailError('') }}
                      onBlur={() => handleEmailBlur(hostEmail, setRegEmailError)}
                      required
                      disabled={registerLoading}
                      className={`w-full px-4 py-3.5 rounded-xl border bg-white focus:ring-2 focus:ring-[#595AFD]/20 focus:border-[#595AFD] outline-none transition-all ${regEmailError ? 'border-red-300' : 'border-slate-200'}`}
                      placeholder="john@example.com"
                    />
                    {regEmailError && <p className="text-red-500 text-xs mt-1">{regEmailError}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone <span className="text-slate-400 font-normal">(used for login)</span></label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">+91</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={hostPhone}
                        onChange={(e) => handlePhoneChange(e.target.value, setHostPhone, setRegPhoneError)}
                        required
                        disabled={registerLoading}
                        className={`w-full pl-12 pr-4 py-3.5 rounded-xl border bg-white focus:ring-2 focus:ring-[#595AFD]/20 focus:border-[#595AFD] outline-none transition-all ${regPhoneError ? 'border-red-300' : 'border-slate-200'}`}
                        placeholder="9876543210"
                      />
                    </div>
                    {regPhoneError && <p className="text-red-500 text-xs mt-1">{regPhoneError}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                    <input
                      type="password"
                      value={hostPassword}
                      onChange={(e) => setHostPassword(e.target.value)}
                      required
                      disabled={registerLoading}
                      minLength={6}
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#595AFD]/20 focus:border-[#595AFD] outline-none transition-all"
                      placeholder="At least 6 characters"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <button
                      type="submit"
                      disabled={registerLoading}
                      className="w-full sm:w-auto px-8 py-3 bg-[#595AFD] text-white font-semibold rounded-xl hover:bg-[#4B4CE6] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#595AFD]/25"
                    >
                      {registerLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Registering...
                        </span>
                      ) : 'Register'}
                    </button>
                    <p className="text-slate-600 text-sm">
                      Already registered?{' '}
                      <button
                        type="button"
                        onClick={() => { setIsRegister(false); setRegisterError(''); setRegisterSuccess(''); setPhoneError(''); setRegPhoneError(''); setRegEmailError(''); setHostPassword('') }}
                        className="text-[#595AFD] font-semibold hover:underline"
                      >
                        Login
                      </button>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HostLoginPage
