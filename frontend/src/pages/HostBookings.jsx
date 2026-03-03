import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  NoSymbolIcon,
  CalendarDaysIcon,
  PhotoIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import HostSidebar from '../components/HostSidebar'

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL

const BOOKING_STATUS = {
  pending:   { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: ClockIcon, label: 'Pending' },
  confirmed: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircleIcon, label: 'Confirmed' },
  rejected:  { bg: 'bg-red-50 text-red-700 border-red-200', icon: XCircleIcon, label: 'Rejected' },
  cancelled: { bg: 'bg-slate-100 text-slate-500 border-slate-200', icon: NoSymbolIcon, label: 'Cancelled' },
}

const TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'cancelled', label: 'Cancelled' },
]

function HostBookings() {
  const navigate = useNavigate()
  const token = localStorage.getItem('hostToken')
  const authHeaders = { Authorization: `Bearer ${token}` }

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [actionLoading, setActionLoading] = useState('')

  const imageBase = API_BASE || ''

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = filter ? { status: filter } : {}
      const { data } = await axios.get(`${API_BASE}/api/host/bookings`, { headers: authHeaders, params })
      setBookings(data.bookings || [])
    } catch (err) {
      if (err.response?.status === 401) { localStorage.removeItem('hostToken'); navigate('/login/host', { replace: true }); return }
      setError(err.response?.data?.error || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [token, navigate, filter])

  useEffect(() => {
    if (!token) { navigate('/login/host', { replace: true }); return }
    fetchBookings()
  }, [token, fetchBookings])

  useEffect(() => {
    setSelectedId(null)
  }, [filter])

  const handleAction = async (id, action) => {
    setActionLoading(`${id}-${action}`)
    try {
      await axios.put(`${API_BASE}/api/host/bookings/${id}/${action}`, {}, { headers: authHeaders })
      setSelectedId(null)
      fetchBookings()
    } catch (err) {
      alert(err.response?.data?.error || `Failed to ${action} booking`)
    } finally {
      setActionLoading('')
    }
  }

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  if (!token) return null

  const selected = selectedId ? bookings.find(b => b._id === selectedId) : null

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <HostSidebar />

      <div className="flex-1 min-w-0">
        {/* Page header */}
        <div className="bg-white border-b border-slate-200/80 px-6 py-5 md:px-8">
          <h1 className="text-lg font-bold text-slate-900">Bookings</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage booking requests from seekers</p>
        </div>

        <div className="px-6 py-6 md:px-8">
          <div className="max-w-6xl mx-auto">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-center gap-2">
                <XCircleIcon className="h-5 w-5 flex-shrink-0" />
                {error}
                <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Filter tabs - admin style */}
            <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200 mb-6 w-fit overflow-x-auto">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    filter === t.key
                      ? 'bg-[#595AFD] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {selectedId && selected ? (
              /* Detail view - Seeker style full-page detail */
              <>
                <button
                  onClick={() => setSelectedId(null)}
                  className="fixed top-20 right-6 md:top-24 md:right-10 z-30 flex items-center justify-center w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
                  aria-label="Close"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
                <div className="max-w-2xl mx-auto space-y-4">
                  {/* Accommodation header - clickable */}
                  {selected.accommodation && (
                    <div
                      className="rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => navigate(`/host/accommodation/${selected.accommodation._id}`)}
                    >
                      <div className="aspect-[16/9] bg-slate-100 relative">
                        {selected.accommodation.images?.[0] ? (
                          <img
                            src={`${imageBase}${selected.accommodation.images[0]}`}
                            alt={selected.accommodation.name}
                            className="w-full h-full object-cover"
                            onError={e => { e.target.style.display = 'none' }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <PhotoIcon className="h-12 w-12 text-slate-300" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${(BOOKING_STATUS[selected.status] || BOOKING_STATUS.pending).bg}`}>
                            {(() => {
                              const StatusIcon = (BOOKING_STATUS[selected.status] || BOOKING_STATUS.pending).icon
                              return StatusIcon ? <StatusIcon className="h-3.5 w-3.5" /> : null
                            })()}
                            {(BOOKING_STATUS[selected.status] || BOOKING_STATUS.pending).label}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Booking summary */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100">
                      <h3 className="text-sm font-semibold text-slate-900">Booking summary</h3>
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">Check-in</p>
                          <div className="flex items-center gap-1.5">
                            <CalendarDaysIcon className="h-4 w-4 text-[#595AFD]" />
                            <p className="text-sm font-semibold text-slate-900">{fmtDate(selected.checkIn)}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">Check-out</p>
                          <div className="flex items-center gap-1.5">
                            <CalendarDaysIcon className="h-4 w-4 text-[#595AFD]" />
                            <p className="text-sm font-semibold text-slate-900">{fmtDate(selected.checkOut)}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">Spaces</p>
                          <p className="text-sm font-semibold text-slate-900">{selected.spaces}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">Total amount</p>
                          <p className="text-base font-bold text-slate-900">₹{selected.totalPrice?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selected.selectedAmenities?.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-3 border-b border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-900">Selected amenities</h3>
                      </div>
                      <div className="p-5">
                        <div className="flex flex-wrap gap-2">
                          {selected.selectedAmenities.map((am, i) => (
                            <span key={i} className="px-2.5 py-1.5 rounded-lg bg-[#595AFD]/10 border border-[#595AFD]/20 text-xs text-[#595AFD] font-medium">
                              {am.name} — ₹{am.rate}/mo
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Seeker contact */}
                  {selected.user && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-3 border-b border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-900">Seeker contact</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">Guest who made this booking</p>
                      </div>
                      <div className="p-5">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <UserIcon className="h-5 w-5 text-slate-500" />
                          </div>
                          <div className="min-w-0 flex-1 space-y-3">
                            <p className="text-base font-semibold text-slate-900">{selected.user.name}</p>
                            {selected.user.occupation && (
                              <p className="text-sm text-slate-500">{selected.user.occupation}</p>
                            )}
                            {selected.user.email && (
                              <a href={`mailto:${selected.user.email}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#595AFD] transition-colors">
                                <EnvelopeIcon className="h-4 w-4 flex-shrink-0" />
                                {selected.user.email}
                              </a>
                            )}
                            {selected.user.phone && (
                              <a href={`tel:${selected.user.phone}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#595AFD] transition-colors">
                                <PhoneIcon className="h-4 w-4 flex-shrink-0" />
                                {selected.user.phone}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selected.message && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-3 border-b border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-900">Message from seeker</h3>
                      </div>
                      <div className="p-5">
                        <p className="text-sm text-slate-600 italic">&quot;{selected.message}&quot;</p>
                      </div>
                    </div>
                  )}

                  {selected.status === 'pending' && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleAction(selected._id, 'confirm')}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        {actionLoading === `${selected._id}-confirm` ? 'Confirming...' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => handleAction(selected._id, 'reject')}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <XCircleIcon className="h-4 w-4" />
                        {actionLoading === `${selected._id}-reject` ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* List view - admin style cards */
              <>
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-28 text-slate-400">
                    <div className="w-8 h-8 border-2 border-slate-200 border-t-[#595AFD] rounded-full animate-spin mb-4" />
                    <p className="text-sm">Loading bookings...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-28">
                    <XCircleIcon className="h-12 w-12 text-red-300 mb-3" />
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-28 text-slate-400 bg-white rounded-xl border border-slate-200">
                    <CalendarDaysIcon className="h-12 w-12 mb-3 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600 mb-1">No booking requests</p>
                    <p className="text-xs text-slate-500">{filter ? `No ${filter} bookings` : 'Booking requests from seekers will appear here.'}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map(b => {
                      const cfg = BOOKING_STATUS[b.status] || BOOKING_STATUS.pending
                      const BStatusIcon = cfg.icon
                      const acc = b.accommodation
                      return (
                        <button
                          key={b._id}
                          onClick={() => setSelectedId(b._id)}
                          className="w-full text-left bg-white rounded-xl border border-slate-200 p-5 hover:border-[#595AFD]/50 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <h3 className="text-base font-bold text-slate-900">{acc?.name || 'Accommodation'}</h3>
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPinIcon className="h-3.5 w-3.5 flex-shrink-0" />
                                {acc?.address}, {acc?.city}
                              </p>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${cfg.bg}`}>
                              <BStatusIcon className="h-3.5 w-3.5" /> {cfg.label}
                            </span>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                            <div>
                              <p className="text-slate-400 text-xs mb-0.5">Seeker</p>
                              <p className="text-slate-700">{b.user?.name} &middot; {b.user?.phone}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-xs mb-0.5">Dates</p>
                              <p className="text-slate-700">{fmtDate(b.checkIn)} &rarr; {fmtDate(b.checkOut)}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-xs mb-0.5">Spaces / Total</p>
                              <p className="text-slate-700">{b.spaces} space(s) &middot; <span className="font-semibold">₹{b.totalPrice?.toLocaleString()}</span></p>
                            </div>
                            {b.user?.occupation && (
                              <div>
                                <p className="text-slate-400 text-xs mb-0.5">Occupation</p>
                                <p className="text-slate-700">{b.user.occupation}</p>
                              </div>
                            )}
                          </div>

                          {b.selectedAmenities?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {b.selectedAmenities.map((am, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-md bg-[#595AFD]/10 border border-[#595AFD]/20 text-[11px] text-[#595AFD] font-medium">
                                  {am.name} — ₹{am.rate}
                                </span>
                              ))}
                            </div>
                          )}

                          {b.message && <p className="text-xs text-slate-400 mt-2 italic">&quot;{b.message}&quot;</p>}

                          <p className="text-[10px] text-slate-300 mt-2">Booked {fmtDate(b.createdAt)}</p>
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HostBookings
