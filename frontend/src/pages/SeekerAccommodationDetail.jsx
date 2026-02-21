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

  useEffect(() => {
    if (!token) {
      navigate('/login/seeker', { replace: true })
      return
    }
    fetchDetail()
  }, [token, navigate, fetchDetail])

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
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Spaces needed</label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={a.roomspace?.available_space || 1}
                        value={bookingForm.spaces}
                        onChange={e => setBookingForm(p => ({ ...p, spaces: e.target.value }))}
                        disabled={bookingSubmitting}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all disabled:opacity-50"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">{a.roomspace?.available_space} space(s) available</p>
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
                      disabled={bookingSubmitting}
                      className="w-full py-3 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-sky-600/25"
                    >
                      {bookingSubmitting ? 'Submitting...' : 'Request Booking'}
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
