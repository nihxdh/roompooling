import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  ArrowLeftOnRectangleIcon,
  BuildingOffice2Icon,
  MapPinIcon,
  CurrencyDollarIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  NoSymbolIcon,
  ClockIcon,
  ChevronLeftIcon,
  PhotoIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline'

const API_BASE = import.meta.env.VITE_API_BASE_URL

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}

const STATUS_ICONS = {
  pending: ClockIcon,
  verified: CheckCircleIcon,
  rejected: XCircleIcon,
}

const TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
]

function StatusBadge({ status }) {
  const Icon = STATUS_ICONS[status] || ClockIcon
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
      <Icon className="h-3.5 w-3.5" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

const BOOKING_STATUS_CFG = {
  pending:   { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: ClockIcon, label: 'Pending' },
  confirmed: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircleIcon, label: 'Confirmed' },
  rejected:  { bg: 'bg-red-50 text-red-700 border-red-200', icon: XCircleIcon, label: 'Rejected' },
  cancelled: { bg: 'bg-slate-100 text-slate-500 border-slate-200', icon: NoSymbolIcon, label: 'Cancelled' },
}

function AdminDashboard() {
  const navigate = useNavigate()
  const [section, setSection] = useState('accommodations')
  const [accommodations, setAccommodations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('')
  const [selected, setSelected] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState('')
  const [activeImage, setActiveImage] = useState(0)

  // Bookings state
  const [bookings, setBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingFilter, setBookingFilter] = useState('')

  const token = localStorage.getItem('adminToken')

  const api = useCallback(() => axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${token}` },
  }), [token])

  const fetchAccommodations = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = activeTab ? { status: activeTab } : {}
      const { data } = await api().get('/api/admin/accommodations', { params })
      setAccommodations(data.accommodations || [])
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken')
        navigate('/login/admin', { replace: true })
        return
      }
      setError(err.response?.data?.error || 'Failed to load accommodations')
    } finally {
      setLoading(false)
    }
  }, [activeTab, api, navigate])

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true)
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
    if (!token) {
      navigate('/login/admin', { replace: true })
      return
    }
    fetchAccommodations()
  }, [token, navigate, fetchAccommodations])

  useEffect(() => {
    if (section === 'bookings' && token) fetchBookings()
  }, [section, fetchBookings, token])

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  const openDetail = async (id) => {
    setDetailLoading(true)
    setActiveImage(0)
    try {
      const { data } = await api().get(`/api/admin/accommodations/${id}`)
      setSelected(data.accommodation)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load details')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleVerify = async (id, status) => {
    setVerifyLoading(status)
    try {
      const { data } = await api().put(`/api/admin/accommodations/${id}/verify`, { status })
      setSelected(data.accommodation)
      setAccommodations(prev =>
        prev.map(a => a._id === id ? { ...a, status: data.accommodation.status } : a)
      )
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed')
    } finally {
      setVerifyLoading('')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    navigate('/', { replace: true })
  }

  // ---------- Detail view ----------
  if (selected) {
    const a = selected
    const imageBase = API_BASE || ''
    return (
      <div className="min-h-screen bg-slate-100">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setSelected(null)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5" />
              <span className="font-medium">Back to list</span>
            </button>
            <StatusBadge status={a.status} />
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8">
          {/* Images */}
          {a.images?.length > 0 && (
            <div className="mb-8">
              <div className="rounded-2xl overflow-hidden bg-slate-200 aspect-[16/7] relative">
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
                        className={`w-2.5 h-2.5 rounded-full transition-all ${i === activeImage ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
              {a.images.length > 1 && (
                <div className="flex gap-3 mt-3 overflow-x-auto pb-1">
                  {a.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === activeImage ? 'border-[#2363EB] ring-2 ring-[#2363EB]/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={`${imageBase}${img}`} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left - details */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">{a.name}</h1>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <MapPinIcon className="h-4 w-4" />
                  <span className="text-sm">{a.address}, {a.city}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Price / month</p>
                  <p className="text-lg font-bold text-slate-900">₹{a.price?.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Total Rooms</p>
                  <p className="text-lg font-bold text-slate-900">{a.roomspace?.total_space}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Available</p>
                  <p className="text-lg font-bold text-slate-900">{a.roomspace?.available_space ?? '—'}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Description</h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{a.description}</p>
              </div>

              {a.amenities?.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {a.amenities.map((am, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">
                        {am.name} {am.rate ? `— ₹${am.rate}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right - host info + actions */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Host Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <UserIcon className="h-5 w-5 text-slate-400" />
                    <span className="text-slate-700">{a.host?.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <EnvelopeIcon className="h-5 w-5 text-slate-400" />
                    <span className="text-slate-700 text-sm">{a.host?.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <PhoneIcon className="h-5 w-5 text-slate-400" />
                    <span className="text-slate-700">{a.host?.phone}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Verification</h3>
                <div className="mb-4">
                  <p className="text-sm text-slate-500 mb-2">Current status</p>
                  <StatusBadge status={a.status} />
                </div>
                {a.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleVerify(a._id, 'verified')}
                      disabled={!!verifyLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      {verifyLoading === 'verified' ? 'Verifying...' : 'Verify'}
                    </button>
                    <button
                      onClick={() => handleVerify(a._id, 'rejected')}
                      disabled={!!verifyLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <XCircleIcon className="h-5 w-5" />
                      {verifyLoading === 'rejected' ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                )}
                {a.status === 'verified' && (
                  <button
                    onClick={() => handleVerify(a._id, 'rejected')}
                    disabled={!!verifyLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <XCircleIcon className="h-5 w-5" />
                    {verifyLoading === 'rejected' ? 'Rejecting...' : 'Revoke Verification'}
                  </button>
                )}
                {a.status === 'rejected' && (
                  <button
                    onClick={() => handleVerify(a._id, 'verified')}
                    disabled={!!verifyLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-emerald-200 text-emerald-600 font-medium rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    {verifyLoading === 'verified' ? 'Verifying...' : 'Approve'}
                  </button>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Meta</h3>
                <div className="space-y-2 text-sm text-slate-500">
                  <p>Rating: <span className="text-slate-700 font-medium">{a.rating ?? 0} / 5</span></p>
                  <p>Availability: <span className="text-slate-700 font-medium">{a.availability ? 'Open' : 'Closed'}</span></p>
                  {a.createdAt && <p>Listed: <span className="text-slate-700 font-medium">{new Date(a.createdAt).toLocaleDateString()}</span></p>}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ---------- List view ----------
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800 text-white">
              <BuildingOffice2Icon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-xs text-slate-500">Manage accommodations & bookings</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            Logout
          </button>
        </div>

        {/* Section tabs */}
        <div className="max-w-6xl mx-auto px-6 flex gap-1 pb-0">
          <button
            onClick={() => setSection('accommodations')}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all border-b-2 ${
              section === 'accommodations'
                ? 'border-slate-800 text-slate-900 bg-slate-50'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2"><BuildingOffice2Icon className="h-4 w-4" /> Accommodations</span>
          </button>
          <button
            onClick={() => setSection('bookings')}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all border-b-2 ${
              section === 'bookings'
                ? 'border-slate-800 text-slate-900 bg-slate-50'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2"><CalendarDaysIcon className="h-4 w-4" /> Bookings</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-center gap-2">
            <XCircleIcon className="h-5 w-5 flex-shrink-0" />
            {error}
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ===== BOOKINGS SECTION ===== */}
        {section === 'bookings' ? (
          <div>
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
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
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
                  const imageBase = API_BASE || ''
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
                      {b.message && <p className="text-xs text-slate-400 mt-2 italic">"{b.message}"</p>}
                      <p className="text-[10px] text-slate-300 mt-2">Booked {fmtDate(b.createdAt)}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          /* ===== ACCOMMODATIONS SECTION ===== */
          <div>
            {/* Tabs */}
            <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200 mb-8 w-fit">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mb-4" />
                <p className="text-sm">Loading accommodations...</p>
              </div>
            ) : accommodations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <BuildingOffice2Icon className="h-12 w-12 mb-3" />
                <p className="text-sm font-medium">No accommodations found</p>
                <p className="text-xs mt-1">
                  {activeTab ? `No ${activeTab} accommodations` : 'No accommodations have been listed yet'}
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {accommodations.map(a => {
                  const imageBase = API_BASE || ''
                  const thumb = a.images?.[0] ? `${imageBase}${a.images[0]}` : null
                  return (
                    <button
                      key={a._id}
                      onClick={() => openDetail(a._id)}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden text-left hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
                    >
                      <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={a.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <PhotoIcon className="h-10 w-10 text-slate-300" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <StatusBadge status={a.status} />
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-slate-900 mb-1 truncate">{a.name}</h3>
                        <div className="flex items-center gap-1 text-slate-500 text-sm mb-3">
                          <MapPinIcon className="h-3.5 w-3.5" />
                          <span className="truncate">{a.city}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-slate-700">
                            <CurrencyDollarIcon className="h-4 w-4 text-slate-400" />
                            <span className="text-sm font-medium">₹{a.price?.toLocaleString()}/mo</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500 text-xs">
                            <UserIcon className="h-3.5 w-3.5" />
                            {a.host?.name}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {detailLoading && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 shadow-xl flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            <p className="text-sm text-slate-600">Loading details...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
