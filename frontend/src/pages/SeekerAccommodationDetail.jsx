import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import {
  MapPinIcon,
  XMarkIcon,
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
            params: {
              checkIn: bookingForm.checkIn,
              checkOut: bookingForm.checkOut,
              spaces: bookingForm.spaces || 1,
              selectedAmenities: JSON.stringify(bookingForm.selectedAmenities || []),
            },
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
  }, [bookingForm.checkIn, bookingForm.checkOut, bookingForm.spaces, bookingForm.selectedAmenities, id, token])

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

      <main className="lg:pl-64 px-6 lg:px-10 pt-6 pb-10">
        <button
          onClick={() => navigate('/seeker/dashboard')}
          className="fixed top-6 right-6 flex items-center justify-center w-10 h-10 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors z-30"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin mb-3" />
              <p className="text-sm">Loading...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-600 text-sm">{error}</div>
          ) : a ? (
            <div className="space-y-6">
              {/* Image gallery */}
              {a.images?.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="aspect-[16/9] bg-slate-100 relative overflow-hidden">
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
                            className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === activeImage ? 'border-[#8A7BF9] ring-2 ring-[#8A7BF9]/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
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
                <h1 className="text-xl font-semibold text-slate-900 tracking-tight mb-1.5">{a.name}</h1>
                <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{a.address}, {a.city}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">Price / month</p>
                  <p className="text-lg font-bold text-slate-900">₹{a.price?.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">Total Rooms</p>
                  <p className="text-lg font-bold text-slate-900">{a.roomspace?.total_space}</p>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">Available</p>
                  <p className="text-lg font-bold text-emerald-600">{a.roomspace?.available_space ?? '—'}</p>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">Rating</p>
                  <div className="flex items-center justify-center gap-1">
                    <StarSolid className="h-4 w-4 text-amber-400" />
                    <span className="text-lg font-bold text-slate-900">{a.rating || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Description</h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">{a.description}</p>
              </div>

              {/* Amenities */}
              {a.amenities?.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {a.amenities.map((am, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-lg bg-[#8A7BF9]/10 border border-[#8A7BF9]/20 text-sm text-[#8A7BF9]">
                        {am.name} {am.rate ? `— ₹${am.rate}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* House Rules */}
              {a.houseRules && Object.values(a.houseRules).some(v => v !== undefined && v !== null) && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ShieldCheckIcon className="h-4 w-4 text-[#8A7BF9]" /> House Rules
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
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-8 h-8 border-2 border-slate-200 border-t-[#8A7BF9] rounded-full animate-spin" />
                    <p className="text-sm text-slate-500">Analyzing compatibility...</p>
                  </div>
                </div>
              ) : compat && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Header with score */}
                  <div className="px-6 py-5 border-b border-slate-100">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[#8A7BF9]/10 flex items-center justify-center">
                          <SparklesIcon className="h-6 w-6 text-[#8A7BF9]" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">Compatibility Analysis</h3>
                          <p className="text-xs text-slate-500 mt-0.5">Based on your profile, preferences & existing roommates</p>
                        </div>
                      </div>
                      {(() => {
                        const score = compat.overallScore ?? compat.score ?? 0
                        const r = 28, circ = 2 * Math.PI * r, offset = circ - (score / 100) * circ
                        const color = score >= 80 ? '#10b981' : score >= 60 ? '#8A7BF9' : score >= 40 ? '#f59e0b' : '#ef4444'
                        const label = score >= 80 ? 'Great match' : score >= 60 ? 'Good fit' : score >= 40 ? 'Consider' : 'Low match'
                        return (
                          <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
                              <p className="text-2xl font-bold text-slate-900">{score}<span className="text-sm font-normal text-slate-400">/100</span></p>
                            </div>
                            <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                              <svg width="64" height="64" className="-rotate-90">
                                <circle cx="32" cy="32" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
                                <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-1000" />
                              </svg>
                              <span className="absolute text-base font-bold text-slate-900">{score}</span>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Insights */}
                  {compat.insights?.length > 0 && (
                    <div className="px-6 py-5 border-b border-slate-100">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Key insights</h4>
                      <div className="space-y-2">
                        {compat.insights.slice(0, compatExpanded ? undefined : 3).map((ins, i) => {
                          const isMatch = ins.type === 'match'
                          const isWarn = ins.type === 'warning'
                          const Icon = isMatch ? CheckCircleIcon : isWarn ? ExclamationTriangleIcon : InformationCircleIcon
                          const bgColors = isMatch ? 'bg-emerald-50' : isWarn ? 'bg-amber-50' : 'bg-slate-50'
                          const iconColors = isMatch ? 'text-emerald-600' : isWarn ? 'text-amber-600' : 'text-slate-600'
                          return (
                            <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-lg ${bgColors} border border-transparent`}>
                              <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${iconColors}`} />
                              <span className="text-sm text-slate-700 leading-snug">{ins.message ?? ins.text}</span>
                            </div>
                          )
                        })}
                        {compat.insights.length > 3 && (
                          <button
                            onClick={() => setCompatExpanded(p => !p)}
                            className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#8A7BF9] hover:text-[#7A6BE9] transition-colors"
                          >
                            <ChevronDownIcon className={`h-4 w-4 transition-transform ${compatExpanded ? 'rotate-180' : ''}`} />
                            {compatExpanded ? 'Show less' : `Show ${compat.insights.length - 3} more insights`}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Roommate Breakdown */}
                  {compat.roommates?.length > 0 && (
                    <div className="px-6 py-5">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <UserGroupIcon className="h-4 w-4" />
                        Current roommates ({compat.roommates.length})
                      </h4>
                      <div className="space-y-4">
                        {compat.roommates.map((rm, i) => {
                          const s = rm.score
                          const barColor = s >= 80 ? 'bg-emerald-500' : s >= 60 ? 'bg-[#8A7BF9]' : s >= 40 ? 'bg-amber-500' : 'bg-red-500'
                          const scoreColor = s >= 70 ? 'text-emerald-600' : s >= 40 ? 'text-amber-600' : 'text-red-500'
                          return (
                            <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                    <UserIcon className="h-4 w-4 text-slate-400" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">{rm.name}</p>
                                    {rm.occupation && (
                                      <p className="text-xs text-slate-500">{rm.occupation}</p>
                                    )}
                                  </div>
                                </div>
                                <span className={`text-sm font-bold ${scoreColor}`}>{s}% match</span>
                              </div>
                              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
                                <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${s}%` }} />
                              </div>
                              {(rm.matchingTraits?.length > 0 || rm.conflictingTraits?.length > 0) && (
                                <div className="flex flex-wrap gap-1.5">
                                  {rm.matchingTraits?.map((t, j) => (
                                    <span key={j} className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">{t}</span>
                                  ))}
                                  {rm.conflictingTraits?.map((t, j) => (
                                    <span key={j} className="px-2 py-1 rounded-md bg-red-50 text-red-600 text-xs font-medium border border-red-100">{t}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {!compat.roommates?.length && (compat.overallScore ?? compat.score ?? 0) > 0 && (
                    <div className="px-6 py-5 border-t border-slate-100">
                      <p className="text-xs text-slate-500">No current roommates. Score reflects house rules & preferences compatibility.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Host info */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Host Information</h3>
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
                  className="mt-4 flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#8A7BF9] hover:opacity-95 rounded-lg transition-colors"
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
                      className="mt-4 px-5 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      View My Bookings
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleBooking} className="space-y-4">
                    {bookingError && (
                      <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">{bookingError}</div>
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
                          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-200 focus:border-slate-300 outline-none transition-all disabled:opacity-50"
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
                          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-200 focus:border-slate-300 outline-none transition-all disabled:opacity-50"
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
                            <div className="w-4 h-4 border-2 border-slate-300 border-t-[#8A7BF9] rounded-full animate-spin flex-shrink-0" />
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
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-200 focus:border-slate-300 outline-none transition-all disabled:opacity-50"
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
                                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-indigo-300 bg-indigo-50'
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
                                    className="w-4 h-4 rounded border-slate-300 text-[#8A7BF9] focus:ring-[#8A7BF9]"
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

                    {/* Price breakdown: segment-based split among co-tenants for overlapping dates */}
                    {bookingForm.checkIn && bookingForm.checkOut && new Date(bookingForm.checkOut) > new Date(bookingForm.checkIn) && (() => {
                      const days = Math.ceil((new Date(bookingForm.checkOut) - new Date(bookingForm.checkIn)) / (1000 * 60 * 60 * 24)) || 1
                      const sp = Number(bookingForm.spaces) || 1
                      const booked = dateAvailability?.booked ?? 0
                      const totalSpaces = booked + sp
                      const est = dateAvailability?.estimatedPrice ?? null
                      return (
                        <div className="bg-slate-50 rounded-xl p-3.5 space-y-1.5 text-sm">
                          <p className="text-slate-500 text-xs">
                            Rent split among {totalSpaces} space{totalSpaces !== 1 ? 's' : ''} for overlapping dates · {days} days · ₹{a.price?.toLocaleString()}/mo
                          </p>
                          {bookingForm.selectedAmenities?.length > 0 && (
                            <p className="text-slate-500 text-xs">+ Amenities (prorated)</p>
                          )}
                          <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
                            <span className="font-bold text-slate-900">Estimated Total</span>
                            <span className="font-bold text-slate-900">₹{(est ?? 0).toLocaleString()}</span>
                          </div>
                          {availabilityLoading && (
                            <p className="text-xs text-slate-400">Calculating...</p>
                          )}
                        </div>
                      )
                    })()}

                    <button
                      type="submit"
                      disabled={bookingSubmitting || dateAvailability?.available === 0 || availabilityLoading}
                      className="w-full py-3 text-sm font-medium text-white bg-[#8A7BF9] hover:opacity-95 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {bookingSubmitting ? 'Submitting...' : dateAvailability?.available === 0 ? 'No Spaces Available' : 'Request Booking'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}

export default SeekerAccommodationDetail
