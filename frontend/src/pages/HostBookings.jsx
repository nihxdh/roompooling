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
} from '@heroicons/react/24/outline'
import HostSidebar from '../components/HostSidebar'

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL

const BOOKING_STATUS = {
  pending:   { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: ClockIcon, label: 'Pending' },
  confirmed: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircleIcon, label: 'Confirmed' },
  rejected:  { bg: 'bg-red-50 text-red-700 border-red-200', icon: XCircleIcon, label: 'Rejected' },
  cancelled: { bg: 'bg-slate-100 text-slate-500 border-slate-200', icon: NoSymbolIcon, label: 'Cancelled' },
}

function HostBookings() {
  const navigate = useNavigate()
  const token = localStorage.getItem('hostToken')
  const authHeaders = { Authorization: `Bearer ${token}` }

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')
  const [actionLoading, setActionLoading] = useState('')

  const imageBase = API_BASE || ''

  const fetchBookings = useCallback(async () => {
    setLoading(true)
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

  const handleAction = async (id, action) => {
    setActionLoading(`${id}-${action}`)
    try {
      await axios.put(`${API_BASE}/api/host/bookings/${id}/${action}`, {}, { headers: authHeaders })
      fetchBookings()
    } catch (err) {
      alert(err.response?.data?.error || `Failed to ${action} booking`)
    } finally {
      setActionLoading('')
    }
  }

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  if (!token) return null

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
          {/* Filter tabs */}
          <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200 mb-6 w-fit overflow-x-auto shadow-sm">
            {[{ key: '', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'confirmed', label: 'Confirmed' }, { key: 'rejected', label: 'Rejected' }, { key: 'cancelled', label: 'Cancelled' }].map(t => (
              <button key={t.key} onClick={() => setFilter(t.key)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  filter === t.key
                    ? 'bg-[#2363EB] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-28 text-slate-400">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-[#2363EB] rounded-full animate-spin mb-4" />
              <p className="text-sm">Loading bookings...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-28">
              <XCircleIcon className="h-12 w-12 text-red-300 mb-3" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 text-slate-400">
              <CalendarDaysIcon className="h-12 w-12 mb-3 text-slate-300" />
              <p className="text-sm font-semibold text-slate-500 mb-1">No booking requests</p>
              <p className="text-xs">{filter ? `No ${filter} bookings` : 'Booking requests from seekers will appear here.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map(b => {
                const cfg = BOOKING_STATUS[b.status] || BOOKING_STATUS.pending
                const BStatusIcon = cfg.icon
                const acc = b.accommodation
                const thumb = acc?.images?.[0] ? `${imageBase}${acc.images[0]}` : null
                return (
                  <div key={b._id} className="bg-white rounded-xl border border-slate-200/80 overflow-hidden flex flex-col sm:flex-row shadow-sm">
                    <div className="sm:w-40 h-28 sm:h-auto bg-slate-100 flex-shrink-0 overflow-hidden">
                      {thumb ? (
                        <img src={thumb} alt={acc?.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><PhotoIcon className="h-7 w-7 text-slate-300" /></div>
                      )}
                    </div>
                    <div className="flex-1 p-4 flex flex-col">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{acc?.name || 'Accommodation'}</h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">{acc?.address}, {acc?.city}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border flex-shrink-0 ${cfg.bg}`}>
                          <BStatusIcon className="h-3 w-3" /> {cfg.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mb-2">
                        <span className="flex items-center gap-1"><UserIcon className="h-3 w-3 text-slate-400" /> {b.user?.name}</span>
                        <span className="flex items-center gap-1"><PhoneIcon className="h-3 w-3 text-slate-400" /> {b.user?.phone}</span>
                        {b.user?.occupation && <span className="text-[11px] text-slate-400">{b.user.occupation}</span>}
                      </div>

                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                        <span><span className="text-slate-400">In:</span> {fmtDate(b.checkIn)}</span>
                        <span><span className="text-slate-400">Out:</span> {fmtDate(b.checkOut)}</span>
                        <span><span className="text-slate-400">Spaces:</span> {b.spaces}</span>
                        <span><span className="text-slate-400">Total:</span> <span className="font-bold text-slate-900">₹{b.totalPrice?.toLocaleString()}</span></span>
                      </div>

                      {b.selectedAmenities?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {b.selectedAmenities.map((am, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-sky-50 border border-sky-100 text-[10px] text-sky-700">
                              {am.name} — ₹{am.rate}
                            </span>
                          ))}
                        </div>
                      )}

                      {b.message && <p className="text-[11px] text-slate-400 mt-2 italic">"{b.message}"</p>}

                      {b.status === 'pending' && (
                        <div className="mt-auto pt-3 flex gap-2">
                          <button onClick={() => handleAction(b._id, 'confirm')} disabled={!!actionLoading}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50">
                            <CheckCircleIcon className="h-3.5 w-3.5" />
                            {actionLoading === `${b._id}-confirm` ? 'Confirming...' : 'Confirm'}
                          </button>
                          <button onClick={() => handleAction(b._id, 'reject')} disabled={!!actionLoading}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50">
                            <XCircleIcon className="h-3.5 w-3.5" />
                            {actionLoading === `${b._id}-reject` ? 'Rejecting...' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HostBookings
