import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import {
  MapPinIcon,
  ChevronLeftIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  PhotoIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import SeekerSidebar from '../components/SeekerSidebar'

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL

function SeekerAccommodationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem('seekerToken')
  const [accommodation, setAccommodation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImage, setActiveImage] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)

  const [bookingForm, setBookingForm] = useState({ checkIn: '', checkOut: '', spaces: 1, selectedAmenities: [] })
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [dateAvailability, setDateAvailability] = useState(null)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)

  const [compat, setCompat] = useState(null)
  const [compatLoading, setCompatLoading] = useState(true)
  const [compatExpanded, setCompatExpanded] = useState(false)

  const fetchDetail = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/user/accommodations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setAccommodation(data.accommodation)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('seekerToken')
        navigate('/login/seeker', { replace: true })
        return
      }
      setError(err.response?.data?.error || 'Accommodation not found')
    } finally {
      setLoading(false)
    }
  }, [id, token, navigate])

  const fetchCompatibility = useCallback(async () => {
    setCompatLoading(true)
    try {
      const { data } = await axios.get(`${API_BASE}/api/user/accommodations/${id}/compatibility`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCompat(data)
    } catch { setCompat(null) }
    finally { setCompatLoading(false) }
  }, [id, token])

  useEffect(() => {
    if (!token) {
      navigate('/login/seeker', { replace: true })
      return
    }
    fetchDetail()
    fetchCompatibility()
  }, [token, navigate, fetchDetail, fetchCompatibility])

  useEffect(() => {
    if (!bookingForm.checkIn || !bookingForm.checkOut || !token) {
      setDateAvailability(null)
      return
    }
    if (new Date(bookingForm.checkOut) <= new Date(bookingForm.checkIn)) {
      setDateAvailability(null)
      return
    }

    const controller = new AbortController()
    const fetchAvailability = async () => {
      setAvailabilityLoading(true)
      try {
        const { data } = await axios.get(
          `${API_BASE}/api/user/accommodations/${id}/availability`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { checkIn: bookingForm.checkIn, checkOut: bookingForm.checkOut },
            signal: controller.signal,
          }
        )
        setDateAvailability(data)
      } catch (err) {
        if (!controller.signal.aborted) setDateAvailability(null)
      } finally {
        if (!controller.signal.aborted) setAvailabilityLoading(false)
      }
    }
    fetchAvailability()
    return () => controller.abort()
  }, [bookingForm.checkIn, bookingForm.checkOut, id, token])

  const handleBooking = async (e) => {
    e.preventDefault()
    setBookingError('')
    setBookingSuccess(false)
    setBookingSubmitting(true)
    try {
      await axios.post(
        `${API_BASE}/api/user/bookings`,
        {
          accommodationId: id,
          checkIn: bookingForm.checkIn,
          checkOut: bookingForm.checkOut,
          spaces: Number(bookingForm.spaces),
          selectedAmenities: bookingForm.selectedAmenities,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setBookingSuccess(true)
      setBookingForm({ checkIn: '', checkOut: '', spaces: 1, selectedAmenities: [] })
      fetchDetail()
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('seekerToken')
        navigate('/login/seeker', { replace: true })
        return
      }
      setBookingError(err.response?.data?.error || 'Booking failed')
    } finally {
      setBookingSubmitting(false)
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const imageBase = API_BASE || ''
  const a = accommodation

  return (
    <div className="min-h-screen bg-slate-50">
      <SeekerSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200">
          <div className="px-6 lg:px-10 py-4 flex items-center gap-4">
            <button
              onClick={() => navigate('/seeker/dashboard')}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors pl-10 lg:pl-0"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
          </div>
        </header>

        <main className="px-6 lg:px-10 py-8 max-w-4xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <div className="w-10 h-10 border-[3px] border-slate-200 border-t-sky-600 rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium">Loading...</p>
            </div>
          ) : error ? (
            <div className="text-center py-24 text-red-500 text-sm">{error}</div>
          ) : a ? (
            <div className="space-y-6">
              {/* Image gallery */}
              {a.images?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="aspect-[16/8] bg-slate-100 relative overflow-hidden">
                    <img
                      src={`${imageBase}${a.images[activeImage]}`}
                      alt={a.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                    {a.images.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {a.images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveImage(i)}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${i === activeImage ? 'bg-white scale-125 shadow' : 'bg-white/50 hover:bg-white/80'}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  {a.images.length > 1 && (
                    <div className="flex gap-2 p-3 overflow-x-auto">
                      {a.images.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImage(i)}
                          className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === activeImage ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                          <img src={`${imageBase}${img}`} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Title + location */}
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1.5">{a.name}</h1>
                <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{a.address}, {a.city}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">Price / month</p>
                  <p className="text-lg font-bold text-slate-900">₹{a.price?.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">Total Rooms</p>
                  <p className="text-lg font-bold text-slate-900">{a.roomspace?.total_space}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">Available</p>
                  <p className="text-lg font-bold text-emerald-600">{a.roomspace?.available_space ?? '—'}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">Rating</p>
                  <div className="flex items-center justify-center gap-1">
                    <StarSolid className="h-4 w-4 text-amber-400" />
                    <span className="text-lg font-bold text-slate-900">{a.rating || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Description</h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">{a.description}</p>
              </div>

              {/* Amenities */}
              {a.amenities?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {a.amenities.map((am, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-100 text-sm text-sky-700">
                        {am.name} {am.rate ? `— ₹${am.rate}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* House Rules */}
              {a.houseRules && Object.values(a.houseRules).some(v => v !== undefined && v !== null) && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ShieldCheckIcon className="h-4 w-4 text-violet-500" /> House Rules
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {a.houseRules.genderAllowed && a.houseRules.genderAllowed !== 'Any' && (
                      <div className="px-3 py-2 rounded-xl bg-slate-50 text-center">
                        <p className="text-[10px] text-slate-400 mb-0.5">Gender</p>
                        <p className="text-xs font-semibold text-slate-700">{a.houseRules.genderAllowed}</p>
                      </div>
                    )}
                    {a.houseRules.foodPolicy && a.houseRules.foodPolicy !== 'No Restriction' && (
                      <div className="px-3 py-2 rounded-xl bg-slate-50 text-center">
                        <p className="text-[10px] text-slate-400 mb-0.5">Food</p>
                        <p className="text-xs font-semibold text-slate-700">{a.houseRules.foodPolicy}</p>
                      </div>
                    )}
                    {a.houseRules.smokingAllowed !== undefined && (
                      <div className="px-3 py-2 rounded-xl bg-slate-50 text-center">
                        <p className="text-[10px] text-slate-400 mb-0.5">Smoking</p>
                        <p className="text-xs font-semibold text-slate-700">{a.houseRules.smokingAllowed ? 'Allowed' : 'Not Allowed'}</p>
                      </div>
                    )}
                    {a.houseRules.drinkingAllowed !== undefined && (
                      <div className="px-3 py-2 rounded-xl bg-slate-50 text-center">
                        <p className="text-[10px] text-slate-400 mb-0.5">Drinking</p>
                        <p className="text-xs font-semibold text-slate-700">{a.houseRules.drinkingAllowed ? 'Allowed' : 'Not Allowed'}</p>
                      </div>
                    )}
                    {a.houseRules.guestsAllowed && (
                      <div className="px-3 py-2 rounded-xl bg-slate-50 text-center">
                        <p className="text-[10px] text-slate-400 mb-0.5">Guests</p>
                        <p className="text-xs font-semibold text-slate-700">{a.houseRules.guestsAllowed}</p>
                      </div>
                    )}
                    {a.houseRules.petFriendly !== undefined && (
                      <div className="px-3 py-2 rounded-xl bg-slate-50 text-center">
                        <p className="text-[10px] text-slate-400 mb-0.5">Pets</p>
                        <p className="text-xs font-semibold text-slate-700">{a.houseRules.petFriendly ? 'Friendly' : 'Not Allowed'}</p>
                      </div>
                    )}
                    {a.houseRules.noisePolicy && (
                      <div className="px-3 py-2 rounded-xl bg-slate-50 text-center">
                        <p className="text-[10px] text-slate-400 mb-0.5">Noise</p>
                        <p className="text-xs font-semibold text-slate-700">{a.houseRules.noisePolicy}</p>
                      </div>
                    )}
                    {a.houseRules.preferredOccupation && a.houseRules.preferredOccupation !== 'Any' && (
                      <div className="px-3 py-2 rounded-xl bg-slate-50 text-center">
                        <p className="text-[10px] text-slate-400 mb-0.5">Preferred</p>
                        <p className="text-xs font-semibold text-slate-700">{a.houseRules.preferredOccupation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Compatibility Section */}
              {compatLoading ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin" />
                    <p className="text-sm text-slate-400">Analyzing compatibility...</p>
                  </div>
                </div>
              ) : compat && (
                <div className={`rounded-2xl border overflow-hidden ${compat.overallScore >= 70 ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white' : compat.overallScore >= 40 ? 'border-sky-200 bg-gradient-to-br from-sky-50/50 to-white' : 'border-slate-200 bg-white'}`}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                          <SparklesIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Compatibility Analysis</h3>
                          <p className="text-xs text-slate-400">Based on your preferences & roommates</p>
                        </div>
                      </div>
                      {/* Score Circle */}
                      {(() => {
                        const score = compat.overallScore
                        const r = 26, circ = 2 * Math.PI * r, offset = circ - (score / 100) * circ
                        const color = score >= 80 ? '#10b981' : score >= 60 ? '#0ea5e9' : score >= 40 ? '#f59e0b' : '#ef4444'
                        return (
                          <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                            <svg width="64" height="64" className="-rotate-90">
                              <circle cx="32" cy="32" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
                              <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-1000" />
                            </svg>
                            <span className="absolute text-lg font-bold text-slate-900">{score}</span>
                          </div>
                        )
                      })()}
                    </div>

                    {/* Insights */}
                    {compat.insights?.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {compat.insights.slice(0, compatExpanded ? undefined : 3).map((ins, i) => {
                          const isMatch = ins.type === 'match'
                          const isWarn = ins.type === 'warning'
                          const Icon = isMatch ? CheckCircleIcon : isWarn ? ExclamationTriangleIcon : InformationCircleIcon
                          const colors = isMatch ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : isWarn ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-blue-50 border-blue-100 text-blue-700'
                          return (
                            <div key={i} className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-medium ${colors}`}>
                              <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                              <span>{ins.message}</span>
                            </div>
                          )
                        })}
                        {compat.insights.length > 3 && (
                          <button
                            onClick={() => setCompatExpanded(p => !p)}
                            className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors pl-1"
                          >
                            <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${compatExpanded ? 'rotate-180' : ''}`} />
                            {compatExpanded ? 'Show less' : `Show ${compat.insights.length - 3} more`}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Roommate Breakdown */}
                    {compat.roommates?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <UserGroupIcon className="h-3.5 w-3.5" /> Current Roommates ({compat.roommates.length})
                        </h4>
                        <div className="space-y-2.5">
                          {compat.roommates.map((rm, i) => {
                            const s = rm.score
                            const barColor = s >= 80 ? 'bg-emerald-500' : s >= 60 ? 'bg-sky-500' : s >= 40 ? 'bg-amber-500' : 'bg-red-500'
                            return (
                              <div key={i} className="bg-white rounded-xl border border-slate-100 p-3.5">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                                      <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-800">{rm.name}</span>
                                    {rm.occupation && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{rm.occupation}</span>}
                                  </div>
                                  <span className={`text-sm font-bold ${s >= 70 ? 'text-emerald-600' : s >= 40 ? 'text-amber-600' : 'text-red-500'}`}>{s}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                                  <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${s}%` }} />
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {rm.matchingTraits?.map((t, j) => (
                                    <span key={j} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-medium">{t}</span>
                                  ))}
                                  {rm.conflictingTraits?.map((t, j) => (
                                    <span key={j} className="px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-[10px] font-medium">{t}</span>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {!compat.roommates?.length && compat.overallScore > 0 && (
                      <p className="text-xs text-slate-400 italic">No current roommates — score is based on house rules compatibility.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Host info */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Host Information</h3>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-slate-500" />
                    </div>
                    <span className="text-sm text-slate-700">{a.host?.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                      <EnvelopeIcon className="h-4 w-4 text-slate-500" />
                    </div>
                    <span className="text-sm text-slate-700">{a.host?.email}</span>
                  </div>
                    <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                      <PhoneIcon className="h-4 w-4 text-slate-500" />
                    </div>
                    <span className="text-sm text-slate-700">{a.host?.phone}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/seeker/chat?host=${a.host?._id}&accommodation=${a._id}`)}
                  className="mt-4 flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-lg shadow-sky-600/25"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4" /> Chat with Host
                </button>
              </div>

              {/* Book Now */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CalendarDaysIcon className="h-4 w-4" /> Book This Accommodation
                </h3>

                {a.roomspace?.available_space === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-red-500 font-medium text-sm">No spaces currently available</p>
                    <p className="text-slate-400 text-xs mt-1">Check back later or browse other listings</p>
                  </div>
                ) : bookingSuccess ? (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                      <svg className="h-6 w-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="text-emerald-700 font-semibold text-sm">Booking Request Submitted!</p>
                    <p className="text-slate-400 text-xs mt-1">The host will review and confirm your booking.</p>
                    <button
                      onClick={() => navigate('/seeker/bookings')}
                      className="mt-4 px-5 py-2 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
                    >
                      View My Bookings
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleBooking} className="space-y-4">
                    {bookingError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{bookingError}</div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Check-in</label>
                        <input
                          type="date"
                          required
                          min={todayStr}
                          value={bookingForm.checkIn}
                          onChange={e => setBookingForm(p => ({ ...p, checkIn: e.target.value }))}
                          disabled={bookingSubmitting}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Check-out</label>
                        <input
                          type="date"
                          required
                          min={bookingForm.checkIn || todayStr}
                          value={bookingForm.checkOut}
                          onChange={e => setBookingForm(p => ({ ...p, checkOut: e.target.value }))}
                          disabled={bookingSubmitting}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all disabled:opacity-50"
                        />
                      </div>
                    </div>
                    {/* Date-specific availability indicator */}
                    {bookingForm.checkIn && bookingForm.checkOut && new Date(bookingForm.checkOut) > new Date(bookingForm.checkIn) && (
                      <div className={`p-3 rounded-xl border text-sm flex items-center gap-2 ${
                        availabilityLoading
                          ? 'bg-slate-50 border-slate-200 text-slate-500'
                          : dateAvailability?.available === 0
                            ? 'bg-red-50 border-red-200 text-red-700'
                            : dateAvailability
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                        {availabilityLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin flex-shrink-0" />
                            <span>Checking availability...</span>
                          </>
                        ) : dateAvailability?.available === 0 ? (
                          <>
                            <XCircleIcon className="h-4 w-4 flex-shrink-0" />
                            <span><strong>No spaces available</strong> for the selected dates. All {dateAvailability.total} space(s) are booked. Try different dates.</span>
                          </>
                        ) : dateAvailability ? (
                          <>
                            <CheckCircleIcon className="h-4 w-4 flex-shrink-0" />
                            <span><strong>{dateAvailability.available}</strong> of {dateAvailability.total} space(s) available for these dates</span>
                          </>
                        ) : null}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Spaces needed</label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={dateAvailability?.available || a.roomspace?.available_space || 1}
                        value={bookingForm.spaces}
                        onChange={e => setBookingForm(p => ({ ...p, spaces: e.target.value }))}
                        disabled={bookingSubmitting || dateAvailability?.available === 0}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all disabled:opacity-50"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        {dateAvailability
                          ? `${dateAvailability.available} space(s) available for selected dates`
                          : `${a.roomspace?.available_space ?? '—'} space(s) generally available`}
                      </p>
                    </div>
                    {/* Amenity selection */}
                    {a.amenities?.length > 0 && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-2">Select Amenities</label>
                        <div className="space-y-2">
                          {a.amenities.map((am, i) => {
                            const isSelected = bookingForm.selectedAmenities.some(s => s.name === am.name)
                            return (
                              <label
                                key={i}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-sky-300 bg-sky-50 ring-1 ring-sky-200'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={bookingSubmitting}
                                    onChange={() => {
                                      setBookingForm(p => {
                                        const exists = p.selectedAmenities.some(s => s.name === am.name)
                                        return {
                                          ...p,
                                          selectedAmenities: exists
                                            ? p.selectedAmenities.filter(s => s.name !== am.name)
                                            : [...p.selectedAmenities, { name: am.name, rate: am.rate }]
                                        }
                                      })
                                    }}
                                    className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                  />
                                  <span className="text-sm text-slate-700">{am.name}</span>
                                </div>
                                <span className="text-sm font-medium text-slate-900">₹{am.rate}/mo</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Price breakdown */}
                    {bookingForm.checkIn && bookingForm.checkOut && new Date(bookingForm.checkOut) > new Date(bookingForm.checkIn) && (() => {
                      const msPerMonth = 1000 * 60 * 60 * 24 * 30
                      const months = Math.max(1, Math.ceil((new Date(bookingForm.checkOut) - new Date(bookingForm.checkIn)) / msPerMonth))
                      const amenitiesRate = bookingForm.selectedAmenities.reduce((s, am) => s + am.rate, 0)
                      const sp = Number(bookingForm.spaces) || 1
                      const baseTotal = a.price * months * sp
                      const amenitiesTotal = amenitiesRate * months * sp
                      const grandTotal = baseTotal + amenitiesTotal
                      return (
                        <div className="bg-slate-50 rounded-xl p-3.5 space-y-1.5 text-sm">
                          <div className="flex justify-between text-slate-500">
                            <span>Rent (₹{a.price?.toLocaleString()} x {months}mo x {sp})</span>
                            <span>₹{baseTotal.toLocaleString()}</span>
                          </div>
                          {amenitiesTotal > 0 && (
                            <div className="flex justify-between text-slate-500">
                              <span>Amenities (₹{amenitiesRate.toLocaleString()} x {months}mo x {sp})</span>
                              <span>₹{amenitiesTotal.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                            <span>Estimated Total</span>
                            <span>₹{grandTotal.toLocaleString()}</span>
                          </div>
                        </div>
                      )
                    })()}

                    <button
                      type="submit"
                      disabled={bookingSubmitting || dateAvailability?.available === 0 || availabilityLoading}
                      className="w-full py-3 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-sky-600/25"
                    >
                      {bookingSubmitting ? 'Submitting...' : dateAvailability?.available === 0 ? 'No Spaces Available' : 'Request Booking'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  )
}

export default SeekerAccommodationDetail
