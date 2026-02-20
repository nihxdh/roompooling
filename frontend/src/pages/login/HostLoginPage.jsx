import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { BuildingOffice2Icon, XMarkIcon } from '@heroicons/react/24/outline'

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
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [totalSpace, setTotalSpace] = useState('')
  const [hostName, setHostName] = useState('')
  const [hostEmail, setHostEmail] = useState('')
  const [hostPhone, setHostPhone] = useState('')
  const [images, setImages] = useState([])
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState('')
  const [registerSuccess, setRegisterSuccess] = useState('')

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const { data } = await axios.post(`${API_BASE}/api/accommodation/login`, {
        phone,
        otp
      })
      if (data.success && data.token) {
        localStorage.setItem('hostToken', data.token)
        navigate('/host/dashboard', { replace: true })
      } else {
        setLoginError(data.error || 'Login failed.')
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Login failed.'
      setLoginError(msg)
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setRegisterError('')
    setRegisterSuccess('')
    if (images.length === 0) {
      setRegisterError('At least one image is required')
      return
    }
    setRegisterLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('address', address)
      formData.append('city', city)
      formData.append('price', price)
      formData.append('description', description)
      const totalSpaceNum = parseInt(totalSpace, 10)
      formData.append('roomspace', JSON.stringify({
        total_space: totalSpaceNum,
        available_space: totalSpaceNum
      }))
      formData.append('host', JSON.stringify({
        name: hostName,
        email: hostEmail,
        phone: hostPhone
      }))
      formData.append('amenities', JSON.stringify([]))
      formData.append('reviews', JSON.stringify([]))
      for (let i = 0; i < images.length; i++) {
        formData.append('images', images[i])
      }

      const { data } = await axios.post(`${API_BASE}/api/accommodation`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (data.success) {
        setRegisterSuccess('Accommodation submitted for verification. You can now login with your phone number and OTP 9876.')
        setName('')
        setAddress('')
        setCity('')
        setPrice('')
        setDescription('')
        setTotalSpace('')
        setHostName('')
        setHostEmail('')
        setHostPhone('')
        setImages([])
      } else {
        setRegisterError(data.error || 'Registration failed.')
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Registration failed.'
      setRegisterError(msg)
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
        /* Login view - split layout with blue panel */
        <>
          <div className="hidden lg:flex lg:w-1/2 bg-[#2363EB] flex-col justify-center items-center p-12 animate-slide-in-right">
            <BuildingOffice2Icon className="h-24 w-24 text-white/90 mb-6" />
            <h2 className="text-2xl font-bold text-white text-center">
              List your spaces.<br />Connect with seekers.
            </h2>
            <p className="text-white/80 mt-4 text-center max-w-xs">
              Manage your rooms and bookings in one place.
            </p>
          </div>
          <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 bg-slate-50 animate-slide-in-left overflow-y-auto">
            <div className="w-full max-w-xl mx-auto">
              <div className="flex items-center gap-2 mb-8 lg:hidden">
                <BuildingOffice2Icon className="h-10 w-10 text-[#2363EB]" />
                <span className="font-bold text-slate-900">Host</span>
              </div>

              {/* Login form - phone + OTP */}
              <form onSubmit={handleLoginSubmit} className="bg-white rounded-xl border border-slate-200 shadow-lg p-10">
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Host Sign In</h2>
              <p className="text-slate-500 text-sm mb-6">Enter your phone and OTP to access your dashboard.</p>
              {loginError && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm" role="alert">
                  {loginError}
                </div>
              )}
              <div className="mb-5">
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={loginLoading}
                  className="w-full px-4 py-3.5 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all duration-200 disabled:opacity-60"
                  placeholder="e.g. 9876543210"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="otp" className="block text-sm font-medium text-slate-700 mb-2">
                  OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  disabled={loginLoading}
                  className="w-full px-4 py-3.5 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all duration-200 disabled:opacity-60"
                  placeholder="Enter OTP"
                />
                <p className="text-slate-500 text-xs mt-1">Use OTP 9876 for demo</p>
              </div>
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 px-4 bg-[#2363EB] text-white font-medium rounded-lg hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loginLoading ? 'Signing in...' : 'Login'}
              </button>

              <p className="text-center text-slate-600 text-sm mt-6">
                New to room pool?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true)
                    setLoginError('')
                    setRegisterError('')
                    setRegisterSuccess('')
                  }}
                  className="text-[#2363EB] font-medium hover:underline"
                >
                  List your accommodation
                </button>
              </p>
            </form>
            </div>
          </div>
        </>
      ) : (
        /* Registration view - full width, no blue panel */
        <div className="w-full flex flex-col items-center justify-center p-8 bg-slate-100 min-h-screen overflow-y-auto">
          <div className="w-full max-w-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#2363EB]/10">
                <BuildingOffice2Icon className="h-6 w-6 text-[#2363EB]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">List your accommodation</h1>
                <p className="text-slate-500 text-sm">Submit your property for verification</p>
              </div>
            </div>

            {/* Success message overlay - fixed with z-index */}
            {registerSuccess && (
              <div
                className="fixed inset-0 z-[100] flex items-start justify-center pt-8 px-4 pointer-events-none"
                role="alert"
              >
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 shadow-lg max-w-md pointer-events-auto">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">✓</span>
                  <p className="text-emerald-800 text-sm font-medium">{registerSuccess}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="p-8 md:p-12 space-y-10">
                {registerError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-3" role="alert">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-200 flex items-center justify-center text-red-600 text-xs font-bold">!</span>
                    {registerError}
                  </div>
                )}

                {/* Host details - first */}
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-0.5 bg-[#2363EB] rounded-full" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Your Details</h3>
                  </div>
                  <div className="grid md:grid-cols-3 gap-5">
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
                </div>

                {/* Property details - second */}
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-0.5 bg-[#2363EB] rounded-full" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Property Details</h3>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Accommodation Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={registerLoading}
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all"
                        placeholder="e.g. Cozy Room Downtown"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          required
                          disabled={registerLoading}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all"
                          placeholder="Street, locality"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          required
                          disabled={registerLoading}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all"
                          placeholder="City"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Price (per month)</label>
                        <input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          required
                          min="0"
                          disabled={registerLoading}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all"
                          placeholder="5000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Total Rooms</label>
                        <input
                          type="number"
                          value={totalSpace}
                          onChange={(e) => setTotalSpace(e.target.value)}
                          required
                          min="1"
                          disabled={registerLoading}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all"
                          placeholder="e.g. 4"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        disabled={registerLoading}
                        rows={4}
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all resize-none"
                        placeholder="Describe your accommodation, nearby amenities, and what makes it special..."
                      />
                    </div>
                  </div>
                </div>

                {/* Photos */}
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-0.5 bg-[#2363EB] rounded-full" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Photos</h3>
                  </div>
                  <div className="p-6 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/30 hover:border-slate-300 hover:bg-slate-50/50 transition-colors">
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => setImages(Array.from(e.target.files))}
                        disabled={registerLoading}
                        className="sr-only"
                      />
                      <span className="flex flex-col items-center gap-2 text-slate-600">
                        <span className="text-sm font-medium text-slate-700">Drop images here or click to upload</span>
                        <span className="text-xs">Min. 1 image, max 10. JPG, PNG, WebP. Max 5MB each.</span>
                        {images.length > 0 && (
                          <span className="text-[#2363EB] font-medium text-sm">{images.length} file(s) selected</span>
                        )}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="px-8 md:px-12 py-6 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="w-full sm:w-auto px-8 py-3 bg-[#2363EB] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registerLoading ? 'Submitting...' : 'Submit Accommodation'}
                </button>
                <p className="text-slate-600 text-sm">
                Already have accommodation?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false)
                    setRegisterError('')
                    setRegisterSuccess('')
                  }}
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
