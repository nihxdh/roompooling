import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { UserIcon, XMarkIcon } from '@heroicons/react/24/outline'
import SuccessModal from '../../components/SuccessModal'
import seekerLoginImg from '../../assets/seekerLogin.png'

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL

function SeekerLoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const navigate = useNavigate()

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regAddress, setRegAddress] = useState('')
  const [regDob, setRegDob] = useState('')
  const [regGender, setRegGender] = useState('')
  const [regOccupation, setRegOccupation] = useState('Other')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState('')
  const [registerSuccess, setRegisterSuccess] = useState('')

  const switchTab = (toRegister) => {
    setIsRegister(toRegister)
    setLoginError('')
    setRegisterError('')
    setRegisterSuccess('')
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const { data } = await axios.post(`${API_BASE}/api/user/login`, { phone, otp })
      if (data.success && data.token) {
        localStorage.setItem('seekerToken', data.token)
        navigate('/seeker/dashboard', { replace: true })
      } else {
        setLoginError(data.error || 'Login failed.')
      }
    } catch (err) {
      setLoginError(err.response?.data?.error || err.message || 'Login failed.')
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
      const { data } = await axios.post(`${API_BASE}/api/user/register`, {
        name: regName,
        email: regEmail,
        phone: regPhone,
        address: regAddress,
        dob: regDob,
        gender: regGender,
        occupation: regOccupation,
      })
      if (data.success) {
        setRegisterSuccess('Registration successful! You can now login with your phone number and OTP 1234.')
        setRegName('')
        setRegEmail('')
        setRegPhone('')
        setRegAddress('')
        setRegDob('')
        setRegGender('')
        setRegOccupation('Other')
      } else {
        setRegisterError(data.error || 'Registration failed.')
      }
    } catch (err) {
      setRegisterError(err.response?.data?.error || err.message || 'Registration failed.')
    } finally {
      setRegisterLoading(false)
    }
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all duration-200 disabled:opacity-60 text-sm'

  return (
    <div className="min-h-screen flex relative overflow-x-hidden">
      <Link
        to="/"
        className="fixed top-4 right-4 z-10 p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 hover:scale-110 transition-all duration-300 animate-fade-in"
        aria-label="Close"
      >
        <XMarkIcon className="h-6 w-6" />
      </Link>

      <SuccessModal message={registerSuccess} onClose={() => setRegisterSuccess('')} />

      {!isRegister ? (
        <>
          {/* Image panel */}
          <div className="hidden lg:flex lg:w-2/5 items-center justify-center animate-slide-in-right h-screen">
            <img
              src={seekerLoginImg}
              alt="Seeker illustration"
              className="h-full w-full object-cover drop-shadow-xl"
            />
          </div>

          {/* Login form panel */}
          <div className="w-full lg:w-3/5 flex flex-col justify-center px-8 lg:px-20 bg-slate-50 animate-slide-in-left overflow-y-auto min-h-screen">
            <div className="w-full max-w-md mx-auto">
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-sky-600 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-lg font-bold text-slate-900 tracking-tight">Room Pool</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Find your room</h2>
                <p className="text-slate-500 text-sm">Sign in to browse available accommodations.</p>
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
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all duration-200 disabled:opacity-60 text-sm"
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all duration-200 disabled:opacity-60 text-sm tracking-widest"
                    placeholder="••••"
                  />
                  <p className="text-slate-400 text-xs mt-1.5">Use OTP <span className="font-mono font-medium text-slate-500">1234</span> for demo</p>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 px-4 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-600/25 mt-2"
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
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchTab(true)}
                    className="text-sky-600 font-semibold hover:underline"
                  >
                    Register here
                  </button>
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Register view — full-width centered form */
        <div className="w-full flex flex-col items-center justify-center p-8 bg-slate-100 min-h-screen overflow-y-auto">
          <div className="w-full max-w-lg">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500/10">
                <UserIcon className="h-6 w-6 text-sky-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Create Account</h1>
                <p className="text-slate-500 text-sm">Sign up to find your perfect room</p>
              </div>
            </div>

            <form onSubmit={handleRegisterSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="p-8 md:p-12 space-y-5">
                {registerError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-3" role="alert">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-200 flex items-center justify-center text-red-600 text-xs font-bold">!</span>
                    {registerError}
                  </div>
                )}

                <div>
                  <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input id="reg-name" type="text" value={regName} onChange={(e) => setRegName(e.target.value)} required disabled={registerLoading} className={inputClass} placeholder="John Doe" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                    <input id="reg-email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required disabled={registerLoading} className={inputClass} placeholder="john@example.com" />
                  </div>
                  <div>
                    <label htmlFor="reg-phone" className="block text-sm font-medium text-slate-700 mb-1.5">Phone <span className="text-slate-400 font-normal">(login)</span></label>
                    <input id="reg-phone" type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} required disabled={registerLoading} className={inputClass} placeholder="9876543210" />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-address" className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
                  <input id="reg-address" type="text" value={regAddress} onChange={(e) => setRegAddress(e.target.value)} required disabled={registerLoading} className={inputClass} placeholder="Street, locality, city" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reg-dob" className="block text-sm font-medium text-slate-700 mb-1.5">Date of Birth</label>
                    <input id="reg-dob" type="date" value={regDob} onChange={(e) => setRegDob(e.target.value)} required disabled={registerLoading} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="reg-gender" className="block text-sm font-medium text-slate-700 mb-1.5">Gender</label>
                    <select id="reg-gender" value={regGender} onChange={(e) => setRegGender(e.target.value)} required disabled={registerLoading} className={inputClass}>
                      <option value="" disabled>Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-occupation" className="block text-sm font-medium text-slate-700 mb-1.5">Occupation</label>
                  <select id="reg-occupation" value={regOccupation} onChange={(e) => setRegOccupation(e.target.value)} disabled={registerLoading} className={inputClass}>
                    <option value="Student">Student</option>
                    <option value="Employee">Employee</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="px-8 md:px-12 py-6 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="w-full sm:w-auto px-8 py-3 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-600/25"
                >
                  {registerLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Registering...
                    </span>
                  ) : 'Register'}
                </button>
                <p className="text-slate-600 text-sm">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchTab(false)}
                    className="text-sky-600 font-semibold hover:underline"
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

export default SeekerLoginPage
