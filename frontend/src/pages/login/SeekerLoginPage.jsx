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
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regAddress, setRegAddress] = useState('')
  const [regDob, setRegDob] = useState('')
  const [regGender, setRegGender] = useState('')
  const [regOccupation, setRegOccupation] = useState('Other')
  const [regPassword, setRegPassword] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState('')
  const [registerSuccess, setRegisterSuccess] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [emailError, setEmailError] = useState('')
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

  const switchTab = (toRegister) => {
    setIsRegister(toRegister)
    setLoginError('')
    setRegisterError('')
    setRegisterSuccess('')
    setPhoneError('')
    setRegPhoneError('')
    setRegEmailError('')
    setPassword('')
    setRegPassword('')
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLoginError('')
    setPhoneError('')
    if (!validatePhone(phone)) {
      setPhoneError('Enter a valid 10-digit phone number')
      return
    }
    setLoginLoading(true)
    try {
      const { data } = await axios.post(`${API_BASE}/api/user/login`, { phone, otp, password: password || undefined })
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
    setRegPhoneError('')
    setRegEmailError('')
    if (!validateEmail(regEmail)) {
      setRegEmailError('Enter a valid email address')
      return
    }
    if (!validatePhone(regPhone)) {
      setRegPhoneError('Enter a valid 10-digit phone number')
      return
    }
    if (!regPassword || regPassword.length < 6) {
      setRegisterError('Password must be at least 6 characters')
      return
    }
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
        password: regPassword,
      })
      if (data.success) {
        setRegisterSuccess('Registration successful! You can now login with your phone number, OTP 1234, and password.')
        setRegName('')
        setRegEmail('')
        setRegPhone('')
        setRegAddress('')
        setRegDob('')
        setRegGender('')
        setRegOccupation('Other')
        setRegPassword('')
      } else {
        setRegisterError(data.error || 'Registration failed.')
      }
    } catch (err) {
      setRegisterError(err.response?.data?.error || err.message || 'Registration failed.')
    } finally {
      setRegisterLoading(false)
    }
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#8A7BF9]/20 focus:border-[#8A7BF9] outline-none transition-all duration-200 disabled:opacity-60 text-sm'

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
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#8A7BF9] to-[#B4A3FD] flex items-center justify-center">
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
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value, setPhone, setPhoneError)}
                      required
                      disabled={loginLoading}
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border bg-white focus:ring-2 focus:ring-[#8A7BF9]/20 focus:border-[#8A7BF9] outline-none transition-all duration-200 disabled:opacity-60 text-sm ${phoneError ? 'border-red-300' : 'border-slate-200'}`}
                      placeholder="9876543210"
                    />
                  </div>
                  {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#8A7BF9]/20 focus:border-[#8A7BF9] outline-none transition-all duration-200 disabled:opacity-60 text-sm tracking-widest"
                    placeholder="••••"
                  />
                  <p className="text-slate-400 text-xs mt-1.5">Use OTP <span className="font-mono font-medium text-slate-500">1234</span> for demo</p>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loginLoading}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#8A7BF9]/20 focus:border-[#8A7BF9] outline-none transition-all duration-200 disabled:opacity-60 text-sm"
                    placeholder="••••••"
                  />
                  <p className="text-slate-400 text-xs mt-1.5">Required if you set one during registration</p>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-[#8A7BF9] to-[#B4A3FD] text-white font-semibold rounded-xl hover:opacity-95 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#8A7BF9]/25 mt-2"
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
                    className="text-[#8A7BF9] font-semibold hover:underline"
                  >
                    Register here
                  </button>
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Register view — same layout as login, scroll only on form side */
        <div className="flex w-full min-h-screen overflow-hidden">
          {/* Image panel — same as login */}
          <div className="hidden lg:flex lg:w-2/5 flex-shrink-0 items-center justify-center h-screen overflow-hidden">
            <img
              src={seekerLoginImg}
              alt="Seeker illustration"
              className="h-full w-full object-cover drop-shadow-xl"
            />
          </div>

          {/* Registration form panel — same width as login, scrolls only here */}
          <div className="w-full lg:w-3/5 flex flex-col min-h-screen overflow-y-auto bg-slate-50">
            <div className="flex flex-col justify-center flex-1 px-8 lg:px-20 py-8">
              <div className="w-full max-w-md mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#8A7BF9]/20 to-[#B4A3FD]/20">
                  <UserIcon className="h-6 w-6 text-[#8A7BF9]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Create Account</h1>
                  <p className="text-slate-500 text-sm">Sign up to find your perfect room</p>
                </div>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                {registerError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-3" role="alert">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-200 flex items-center justify-center text-red-600 text-xs font-bold">!</span>
                    {registerError}
                  </div>
                )}

                <div>
                  <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input id="reg-name" type="text" value={regName} onChange={(e) => setRegName(e.target.value)} required disabled={registerLoading} className={inputClass} placeholder="Enter your full name" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                    <input
                      id="reg-email"
                      type="email"
                      value={regEmail}
                      onChange={(e) => { setRegEmail(e.target.value); setRegEmailError('') }}
                      onBlur={() => handleEmailBlur(regEmail, setRegEmailError)}
                      required
                      disabled={registerLoading}
                      className={`${inputClass} ${regEmailError ? 'border-red-300' : ''}`}
                      placeholder="Enter your email address"
                    />
                    {regEmailError && <p className="text-red-500 text-xs mt-1">{regEmailError}</p>}
                  </div>
                  <div>
                    <label htmlFor="reg-phone" className="block text-sm font-medium text-slate-700 mb-1.5">Phone <span className="text-slate-400 font-normal">(login)</span></label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">+91</span>
                      <input
                        id="reg-phone"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={regPhone}
                        onChange={(e) => handlePhoneChange(e.target.value, setRegPhone, setRegPhoneError)}
                        required
                        disabled={registerLoading}
                        className={`${inputClass} pl-12 ${regPhoneError ? 'border-red-300' : ''}`}
                        placeholder="10-digit mobile number"
                      />
                    </div>
                    {regPhoneError && <p className="text-red-500 text-xs mt-1">{regPhoneError}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-address" className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
                  <input id="reg-address" type="text" value={regAddress} onChange={(e) => setRegAddress(e.target.value)} required disabled={registerLoading} className={inputClass} placeholder="Enter your full address" />
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

                <div>
                  <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <input
                    id="reg-password"
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    disabled={registerLoading}
                    minLength={6}
                    className={inputClass}
                    placeholder="At least 6 characters"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-[#8A7BF9] to-[#B4A3FD] text-white font-semibold rounded-xl hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#8A7BF9]/25"
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
                    className="text-[#8A7BF9] font-semibold hover:underline"
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

export default SeekerLoginPage
