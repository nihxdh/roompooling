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
  const [cancellingId, setCancellingId] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const params = activeTab ? { status: activeTab } : {}
      const { data } = await axios.get(`${API_BASE}/api/user/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      })
      setBookings(data.bookings || [])
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

  useEffect(() => {
    if (!token) { navigate('/login/seeker', { replace: true }); return }
    fetchBookings()
  }, [token, navigate, fetchBookings])

  const handleCancel = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/user/bookings/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCancellingId(null)
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

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200">
          <div className="px-6 lg:px-10 py-4">
            <h1 className="text-lg font-bold text-slate-900 pl-10 lg:pl-0">My Bookings</h1>
          </div>
        </header>

        <main className="px-6 lg:px-10 py-8 max-w-5xl">
          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200 mb-8 w-fit overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <div className="w-10 h-10 border-[3px] border-slate-200 border-t-sky-600 rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium">Loading bookings...</p>
            </div>
          ) : error ? (
            <div className="text-center py-24 text-red-500 text-sm">{error}</div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <CalendarDaysIcon className="h-14 w-14 mb-3 text-slate-300" />
              <p className="text-base font-semibold text-slate-500 mb-1">No bookings yet</p>
              <p className="text-sm">Browse accommodations and make your first booking.</p>
              <button
                onClick={() => navigate('/seeker/dashboard')}
                className="mt-4 px-5 py-2.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors"
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
                  <div key={b._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col sm:flex-row">
                    {/* Thumbnail */}
                    <div className="sm:w-48 h-36 sm:h-auto bg-slate-100 flex-shrink-0 relative overflow-hidden">
                      {thumb ? (
                        <img src={thumb} alt={acc?.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><PhotoIcon className="h-8 w-8 text-slate-300" /></div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 p-5 flex flex-col">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h3
                            className="text-base font-bold text-slate-900 hover:text-sky-700 cursor-pointer transition-colors"
                            onClick={() => navigate(`/seeker/accommodation/${acc?._id}`)}
                          >
                            {acc?.name || 'Accommodation'}
                          </h3>
                          <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                            <MapPinIcon className="h-3.5 w-3.5" />
                            <span>{acc?.address}, {acc?.city}</span>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${cfg.bg}`}>
                          <Icon className="h-3.5 w-3.5" /> {cfg.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600 mt-1">
                        <span><span className="text-slate-400">Check-in:</span> {fmt(b.checkIn)}</span>
                        <span><span className="text-slate-400">Check-out:</span> {fmt(b.checkOut)}</span>
                        <span><span className="text-slate-400">Spaces:</span> {b.spaces}</span>
                        <span><span className="text-slate-400">Total:</span> <span className="font-semibold text-slate-900">₹{b.totalPrice?.toLocaleString()}</span></span>
                      </div>

                      {b.selectedAmenities?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {b.selectedAmenities.map((am, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-sky-50 border border-sky-100 text-[11px] text-sky-700">
                              {am.name} — ₹{am.rate}
                            </span>
                          ))}
                        </div>
                      )}

                      {b.host && (
                        <p className="text-xs text-slate-400 mt-2">Host: {b.host.name} &middot; {b.host.phone}</p>
                      )}
                      {b.message && (
                        <p className="text-xs text-slate-400 mt-1 italic">"{b.message}"</p>
                      )}

                      {/* Actions */}
                      {['pending', 'confirmed'].includes(b.status) && (
                        <div className="mt-auto pt-3">
                          <button
                            onClick={() => setCancellingId(b._id)}
                            className="px-4 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            Cancel Booking
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>

      {/* Cancel confirmation modal */}
      {cancellingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCancellingId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <NoSymbolIcon className="h-7 w-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Cancel Booking?</h3>
            <p className="text-slate-500 text-sm mb-6">This action cannot be undone. If the booking was confirmed, the space will be freed.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setCancellingId(null)} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                Keep It
              </button>
              <button onClick={() => handleCancel(cancellingId)} className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SeekerBookings
