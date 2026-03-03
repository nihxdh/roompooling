import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  NoSymbolIcon,
  MapPinIcon,
  CalendarDaysIcon,
  PhotoIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import SeekerSidebar from '../components/SeekerSidebar'

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL

const STATUS_CONFIG = {
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

function SeekerBookings() {
  const navigate = useNavigate()
  const token = localStorage.getItem('seekerToken')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [cancellingId, setCancellingId] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = activeTab ? { status: activeTab } : {}
      const { data } = await axios.get(`${API_BASE}/api/user/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      })
      const list = data.bookings || []
      setBookings(list)
      if (selectedId && !list.some(b => b._id === selectedId)) {
        setSelectedId(null)
        setDetail(null)
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('seekerToken')
        navigate('/login/seeker', { replace: true })
        return
      }
      setError(err.response?.data?.error || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [token, navigate, activeTab])

  const fetchDetail = useCallback(async (id) => {
    if (!id) { setDetail(null); return }
    setDetailLoading(true)
    try {
      const { data } = await axios.get(`${API_BASE}/api/user/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setDetail(data.booking)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('seekerToken')
        navigate('/login/seeker', { replace: true })
        return
      }
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }, [token, navigate])

  useEffect(() => {
    if (!token) { navigate('/login/seeker', { replace: true }); return }
    fetchBookings()
  }, [token, navigate, fetchBookings])

  useEffect(() => {
    if (selectedId) fetchDetail(selectedId)
    else setDetail(null)
  }, [selectedId, fetchDetail])

  const handleCancel = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/user/bookings/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCancellingId(null)
      setDetail(null)
      setSelectedId(null)
      fetchBookings()
    } catch (err) {
      alert(err.response?.data?.error || 'Cancel failed')
      setCancellingId(null)
    }
  }

  const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const imageBase = API_BASE || ''

  return (
    <div className="min-h-screen bg-slate-50">
      <SeekerSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <main className="lg:pl-64 px-6 lg:px-10 pt-6 pb-10">
        <div className="max-w-6xl mx-auto">
          {selectedId ? (
            /* Detail view - full page, no list */
            <>
              <button
                onClick={() => { setSelectedId(null); setDetail(null) }}
                className="fixed top-6 right-6 flex items-center justify-center w-10 h-10 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors z-30"
                aria-label="Close"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
              {detailLoading ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-500">
                  <div className="w-8 h-8 border-2 border-slate-200 border-t-[#8A7BF9] rounded-full animate-spin mb-3" />
                  <p className="text-sm">Loading details...</p>
                </div>
              ) : detail ? (
                <div className="max-w-2xl mx-auto space-y-4">
                  {/* Accommodation header */}
                  {detail.accommodation && (
                    <div
                      className="rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => navigate(`/seeker/accommodation/${detail.accommodation._id}`)}
                    >
                      <div className="aspect-[16/9] bg-slate-100 relative">
                        {detail.accommodation.images?.[0] ? (
                          <img
                            src={`${imageBase}${detail.accommodation.images[0]}`}
                            alt={detail.accommodation.name}
                            className="w-full h-full object-cover"
                            onError={e => { e.target.style.display = 'none' }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <PhotoIcon className="h-12 w-12 text-slate-300" />
                          </div>
                        )}
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
                            <CalendarDaysIcon className="h-4 w-4 text-[#8A7BF9]" />
                            <p className="text-sm font-semibold text-slate-900">{fmt(detail.checkIn)}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">Check-out</p>
                          <div className="flex items-center gap-1.5">
                            <CalendarDaysIcon className="h-4 w-4 text-[#8A7BF9]" />
                            <p className="text-sm font-semibold text-slate-900">{fmt(detail.checkOut)}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">Spaces</p>
                          <p className="text-sm font-semibold text-slate-900">{detail.spaces}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">Total amount</p>
                          <p className="text-base font-bold text-slate-900">₹{detail.totalPrice?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {detail.selectedAmenities?.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-3 border-b border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-900">Selected amenities</h3>
                      </div>
                      <div className="p-5">
                        <div className="flex flex-wrap gap-2">
                          {detail.selectedAmenities.map((am, i) => (
                            <span key={i} className="px-2.5 py-1.5 rounded-lg bg-[#8A7BF9]/10 border border-[#8A7BF9]/20 text-xs text-[#8A7BF9] font-medium">
                              {am.name} — ₹{am.rate}/mo
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {detail.host && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-3 border-b border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-900">Host contact</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">Reach out for queries about your stay</p>
                      </div>
                      <div className="p-5">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <UserIcon className="h-5 w-5 text-slate-500" />
                          </div>
                          <div className="min-w-0 flex-1 space-y-3">
                            <p className="text-base font-semibold text-slate-900">{detail.host.name}</p>
                            {detail.host.email && (
                              <a href={`mailto:${detail.host.email}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#8A7BF9] transition-colors">
                                <EnvelopeIcon className="h-4 w-4 flex-shrink-0" />
                                {detail.host.email}
                              </a>
                            )}
                            {detail.host.phone && (
                              <a href={`tel:${detail.host.phone}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#8A7BF9] transition-colors">
                                <PhoneIcon className="h-4 w-4 flex-shrink-0" />
                                {detail.host.phone}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {['pending', 'confirmed'].includes(detail.status) && (
                    <div className="pt-0">
                      <button
                        onClick={() => setCancellingId(detail._id)}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                      >
                        <NoSymbolIcon className="h-4 w-4" />
                        Cancel booking
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </>
          ) : (
            /* List view */
            <>
              <h1 className="text-slate-900 font-semibold text-xl tracking-tight mb-1">My Bookings</h1>
              <p className="text-slate-500 text-sm mb-6">
                {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
              </p>
              <div className="flex gap-1 bg-white rounded-lg p-1 border border-slate-200 mb-6 w-fit overflow-x-auto">
                {TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.key ? 'bg-[#8A7BF9] text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <div className="w-8 h-8 border-2 border-slate-200 border-t-[#8A7BF9] rounded-full animate-spin mb-3" />
                  <p className="text-sm">Loading bookings...</p>
                </div>
              ) : error ? (
                <div className="text-center py-20 text-red-600 text-sm">{error}</div>
              ) : bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-xl border border-slate-200">
                  <CalendarDaysIcon className="h-12 w-12 mb-3 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600 mb-1">No bookings yet</p>
                  <p className="text-xs text-slate-500 mb-4">Browse accommodations and make your first booking.</p>
                  <button
                    onClick={() => navigate('/seeker/dashboard')}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-[#8A7BF9] hover:opacity-95 rounded-lg transition-colors"
                  >
                    Browse Accommodations
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map(b => {
                    const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending
                    const Icon = cfg.icon
                    const acc = b.accommodation
                    const thumb = acc?.images?.[0] ? `${imageBase}${acc.images[0]}` : null
                    return (
                      <button
                        key={b._id}
                        onClick={() => setSelectedId(b._id)}
                        className="w-full text-left rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-[#8A7BF9] hover:shadow-lg transition-all"
                      >
                        <div className="flex gap-6 p-5">
                          <div className="w-28 h-28 flex-shrink-0 rounded-lg bg-slate-100 overflow-hidden">
                            {thumb ? (
                              <img src={thumb} alt={acc?.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><PhotoIcon className="h-10 w-10 text-slate-300" /></div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-base font-semibold text-slate-900 truncate">{acc?.name || 'Accommodation'}</p>
                            <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1">
                              <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{acc?.city}, {acc?.address}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600 mt-2">
                              <span>{fmt(b.checkIn)}</span>
                              <span>→</span>
                              <span>{fmt(b.checkOut)}</span>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium mt-2 ${cfg.bg}`}>
                              <Icon className="h-3.5 w-3.5" /> {cfg.label}
                            </span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Cancel confirmation modal */}
      {cancellingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCancellingId(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <NoSymbolIcon className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-2">Cancel booking?</h3>
            <p className="text-slate-500 text-sm mb-6">This cannot be undone. The space will be freed for other guests.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setCancellingId(null)} className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">
                Keep
              </button>
              <button onClick={() => handleCancel(cancellingId)} className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg">
                Yes, cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SeekerBookings
