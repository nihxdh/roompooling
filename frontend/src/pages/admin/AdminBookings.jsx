import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  CalendarDaysIcon,
  XMarkIcon,
  XCircleIcon,
  CheckCircleIcon,
  NoSymbolIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

const API_BASE = import.meta.env.VITE_API_BASE_URL

const BOOKING_STATUS_CFG = {
  pending:   { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: ClockIcon, label: 'Pending' },
  confirmed: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircleIcon, label: 'Confirmed' },
  rejected:  { bg: 'bg-red-50 text-red-700 border-red-200', icon: XCircleIcon, label: 'Rejected' },
  cancelled: { bg: 'bg-slate-100 text-slate-500 border-slate-200', icon: NoSymbolIcon, label: 'Cancelled' },
}

function AdminBookings() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [bookingFilter, setBookingFilter] = useState('')
  const [error, setError] = useState('')

  const token = localStorage.getItem('adminToken')
  const api = useCallback(() => axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${token}` },
  }), [token])

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true)
    setError('')
    try {
      const params = bookingFilter ? { status: bookingFilter } : {}
      const { data } = await api().get('/api/admin/bookings', { params })
      setBookings(data.bookings || [])
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken')
        navigate('/login/admin', { replace: true })
        return
      }
      setError(err.response?.data?.error || 'Failed to load bookings')
    } finally {
      setBookingsLoading(false)
    }
  }, [api, navigate, bookingFilter])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="p-6 md:p-8 pt-16 md:pt-8">
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

        <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200 mb-6 w-fit overflow-x-auto">
          {[{ key: '', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'confirmed', label: 'Confirmed' }, { key: 'rejected', label: 'Rejected' }, { key: 'cancelled', label: 'Cancelled' }].map(t => (
            <button
              key={t.key}
              onClick={() => setBookingFilter(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                bookingFilter === t.key
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {bookingsLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mb-4" />
            <p className="text-sm">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white rounded-xl border border-slate-200">
            <CalendarDaysIcon className="h-12 w-12 mb-3 text-slate-300" />
            <p className="text-sm font-medium">No bookings found</p>
            <p className="text-xs mt-1">{bookingFilter ? `No ${bookingFilter} bookings` : 'No bookings have been made yet'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(b => {
              const cfg = BOOKING_STATUS_CFG[b.status] || BOOKING_STATUS_CFG.pending
              const BIcon = cfg.icon
              const acc = b.accommodation
              return (
                <div key={b._id} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{acc?.name || 'Accommodation'}</h3>
                      <p className="text-xs text-slate-500">{acc?.address}, {acc?.city}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${cfg.bg}`}>
                      <BIcon className="h-3.5 w-3.5" /> {cfg.label}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs mb-0.5">Seeker</p>
                      <p className="text-slate-700">{b.user?.name} &middot; {b.user?.phone}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs mb-0.5">Host</p>
                      <p className="text-slate-700">{b.host?.name} &middot; {b.host?.phone}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs mb-0.5">Dates</p>
                      <p className="text-slate-700">{fmtDate(b.checkIn)} &rarr; {fmtDate(b.checkOut)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs mb-0.5">Spaces / Total</p>
                      <p className="text-slate-700">{b.spaces} space(s) &middot; <span className="font-semibold">₹{b.totalPrice?.toLocaleString()}</span></p>
                    </div>
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
                  {b.message && <p className="text-xs text-slate-400 mt-2 italic">&quot;{b.message}&quot;</p>}
                  <p className="text-[10px] text-slate-300 mt-2">Booked {fmtDate(b.createdAt)}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminBookings
