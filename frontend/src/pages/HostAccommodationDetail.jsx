import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import {
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  NoSymbolIcon,
  MapPinIcon,
  PhotoIcon,
  PlusIcon,
  UserIcon,
  PhoneIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CurrencyRupeeIcon,
  HomeModernIcon,
  CalendarDaysIcon,
  ArrowLeftIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'
import HostSidebar from '../components/HostSidebar'

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL

const statusBadge = {
  pending:  { bg: 'bg-amber-50 text-amber-600 border border-amber-200', icon: ClockIcon, label: 'Pending Verification' },
  verified: { bg: 'bg-emerald-50 text-emerald-600 border border-emerald-200', icon: CheckCircleIcon, label: 'Verified' },
  rejected: { bg: 'bg-red-50 text-red-600 border border-red-200', icon: XCircleIcon, label: 'Rejected' },
}

const BOOKING_STATUS = {
  pending:   { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: ClockIcon, label: 'Pending' },
  confirmed: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircleIcon, label: 'Confirmed' },
  rejected:  { bg: 'bg-red-50 text-red-700 border-red-200', icon: XCircleIcon, label: 'Rejected' },
  cancelled: { bg: 'bg-slate-100 text-slate-500 border-slate-200', icon: NoSymbolIcon, label: 'Cancelled' },
}

const HOUSE_RULE_FIELDS = [
  { key: 'genderAllowed', label: 'Gender Allowed', options: ['Male Only', 'Female Only', 'Any'] },
  { key: 'foodPolicy', label: 'Food Policy', options: ['Veg Only', 'Non-Veg Allowed', 'No Restriction'] },
  { key: 'guestsAllowed', label: 'Guests', options: ['Allowed', 'Occasionally', 'Not Allowed'] },
  { key: 'noisePolicy', label: 'Noise', options: ['Quiet Zone', 'Moderate', 'No Restriction'] },
  { key: 'preferredOccupation', label: 'Preferred Occupation', options: ['Student', 'Employee', 'Any'] },
]

const HOUSE_RULE_TOGGLES = [
  { key: 'smokingAllowed', label: 'Smoking Allowed' },
  { key: 'drinkingAllowed', label: 'Drinking Allowed' },
  { key: 'petFriendly', label: 'Pet Friendly' },
]

const defaultHouseRules = {
  genderAllowed: 'Any', foodPolicy: 'No Restriction', smokingAllowed: false,
  drinkingAllowed: false, guestsAllowed: 'Allowed', petFriendly: false,
  noisePolicy: 'Moderate', preferredOccupation: 'Any',
}

const RULE_LABELS = {
  genderAllowed: 'Gender', foodPolicy: 'Food', smokingAllowed: 'Smoking',
  drinkingAllowed: 'Drinking', guestsAllowed: 'Guests', petFriendly: 'Pets',
  noisePolicy: 'Noise', preferredOccupation: 'Occupation',
}

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
const toInputDate = (d) => {
  const dt = d ? new Date(d) : new Date()
  return dt.toISOString().split('T')[0]
}

function HostAccommodationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem('hostToken')
  const authHeaders = { Authorization: `Bearer ${token}` }
  const imageBase = API_BASE || ''

  const [acc, setAcc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imgIdx, setImgIdx] = useState(0)

  // Edit modal
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({})
  const [newImages, setNewImages] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Bookings
  const [bookings, setBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingFilter, setBookingFilter] = useState('')
  const [actionLoading, setActionLoading] = useState('')

  // Availability
  const [availDate, setAvailDate] = useState(toInputDate())
  const [availability, setAvailability] = useState(null)
  const [availLoading, setAvailLoading] = useState(false)

  const fetchAccommodation = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/host/accommodations/${id}`, { headers: authHeaders })
      setAcc(data.accommodation)
    } catch (err) {
      if (err.response?.status === 401) { localStorage.removeItem('hostToken'); navigate('/login/host', { replace: true }); return }
      setError(err.response?.data?.error || 'Failed to load accommodation')
    } finally {
      setLoading(false)
    }
  }, [id, token])

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true)
    try {
      const params = bookingFilter ? { status: bookingFilter } : {}
      const { data } = await axios.get(`${API_BASE}/api/host/accommodations/${id}/bookings`, { headers: authHeaders, params })
      setBookings(data.bookings || [])
    } catch {
      setBookings([])
    } finally {
      setBookingsLoading(false)
    }
  }, [id, token, bookingFilter])

  const fetchAvailability = useCallback(async (date) => {
    setAvailLoading(true)
    try {
      const { data } = await axios.get(`${API_BASE}/api/host/accommodations/${id}/availability`, {
        headers: authHeaders,
        params: { date }
      })
      setAvailability(data)
    } catch {
      setAvailability(null)
    } finally {
      setAvailLoading(false)
    }
  }, [id, token])

  useEffect(() => {
    if (!token) { navigate('/login/host', { replace: true }); return }
    fetchAccommodation()
  }, [token, fetchAccommodation])

  useEffect(() => {
    if (acc) {
      fetchBookings()
      fetchAvailability(availDate)
    }
  }, [acc, fetchBookings])

  const handleAvailDateChange = (date) => {
    setAvailDate(date)
    fetchAvailability(date)
  }

  const handleBookingAction = async (bookingId, action) => {
    setActionLoading(`${bookingId}-${action}`)
    try {
      await axios.put(`${API_BASE}/api/host/bookings/${bookingId}/${action}`, {}, { headers: authHeaders })
      fetchBookings()
      fetchAvailability(availDate)
    } catch (err) {
      alert(err.response?.data?.error || `Failed to ${action} booking`)
    } finally {
      setActionLoading('')
    }
  }

  // Edit modal
  const openEdit = () => {
    if (!acc) return
    setForm({
      name: acc.name || '',
      address: acc.address || '',
      city: acc.city || '',
      price: acc.price?.toString() || '',
      description: acc.description || '',
      totalSpace: acc.roomspace?.total_space?.toString() || '',
      amenities: (acc.amenities || []).map(am => ({ name: am.name || '', rate: am.rate?.toString() || '' })),
      reviews: JSON.stringify(acc.reviews || []),
      houseRules: { ...defaultHouseRules, ...(acc.houseRules || {}) },
    })
    setExistingImages(acc.images || [])
    setNewImages([])
    setFormError('')
    setShowModal(true)
  }

  const handleFormChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setFormError('')
    if (existingImages.length === 0 && newImages.length === 0) {
      setFormError('At least one image is required.')
      return
    }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('address', form.address)
      fd.append('city', form.city)
      fd.append('price', form.price)
      fd.append('description', form.description)
      const tsNum = parseInt(form.totalSpace, 10)
      fd.append('roomspace', JSON.stringify({ total_space: tsNum, available_space: tsNum }))
      const cleanAmenities = (form.amenities || []).filter(am => am.name.trim() && am.rate !== '')
      fd.append('amenities', JSON.stringify(cleanAmenities))
      fd.append('reviews', form.reviews || '[]')
      fd.append('houseRules', JSON.stringify(form.houseRules || defaultHouseRules))
      fd.append('existingImages', JSON.stringify(existingImages))
      for (const img of newImages) fd.append('images', img)

      await axios.put(`${API_BASE}/api/host/accommodations/${id}`, fd, { headers: authHeaders })
      setShowModal(false)
      setLoading(true)
      fetchAccommodation()
    } catch (err) {
      setFormError(err.response?.data?.error || err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE}/api/host/accommodations/${id}`, { headers: authHeaders })
      navigate('/host/dashboard', { replace: true })
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed')
      setShowDeleteConfirm(false)
    }
  }

  if (!token) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-[#2363EB] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading accommodation...</p>
        </div>
      </div>
    )
  }

  if (error || !acc) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-12 w-12 text-red-300 mx-auto mb-3" />
          <p className="text-red-600 text-sm mb-4">{error || 'Accommodation not found'}</p>
          <button onClick={() => navigate('/host/dashboard')} className="text-sm text-[#2363EB] hover:underline">Back to Dashboard</button>
        </div>
      </div>
    )
  }

  const badge = statusBadge[acc.status] || statusBadge.pending
  const StatusIcon = badge.icon
  const imgs = acc.images || []
  const hasMultiple = imgs.length > 1

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <HostSidebar />

      <div className="flex-1 min-w-0">
        {/* Page header */}
        <div className="bg-white border-b border-slate-200/80 px-6 py-4 md:px-8 flex items-center justify-between">
          <button onClick={() => navigate('/host/dashboard')} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors group">
            <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Listings
          </button>
          <div className="flex items-center gap-2">
            <button onClick={openEdit} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
              <PencilSquareIcon className="h-3.5 w-3.5" /> Edit
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
              <TrashIcon className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* ===== IMAGE GALLERY ===== */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <div className="flex gap-3" style={{ height: '300px' }}>
            {/* Main image */}
            <div className="relative flex-1 rounded-xl overflow-hidden bg-slate-100">
              {imgs.length > 0 ? (
                <img
                  src={`${imageBase}${imgs[imgIdx]}`}
                  alt={acc.name}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100">
                  <PhotoIcon className="h-12 w-12 text-slate-300" />
                </div>
              )}

              {hasMultiple && (
                <>
                  <button onClick={() => setImgIdx(i => (i - 1 + imgs.length) % imgs.length)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-all flex items-center justify-center">
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <button onClick={() => setImgIdx(i => (i + 1) % imgs.length)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-all flex items-center justify-center">
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </>
              )}

              <div className="absolute top-3 right-3">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-sm ${badge.bg}`}>
                  <StatusIcon className="h-3 w-3" /> {badge.label}
                </span>
              </div>

              {imgs.length > 1 && (
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                  <span className="text-white text-[11px] font-medium">{imgIdx + 1} / {imgs.length}</span>
                </div>
              )}
            </div>

            {/* Side thumbnails */}
            {imgs.length > 1 && (
              <div className="hidden sm:flex flex-col gap-2 w-24 overflow-y-auto">
                {imgs.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`flex-shrink-0 w-full rounded-lg overflow-hidden border-2 transition-all h-[70px] ${
                      i === imgIdx
                        ? 'border-[#2363EB] shadow-md ring-1 ring-[#2363EB]/30'
                        : 'border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300'
                    }`}>
                    <img src={`${imageBase}${img}`} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile thumbnail strip */}
          {imgs.length > 1 && (
            <div className="flex sm:hidden gap-1.5 mt-3 overflow-x-auto pb-1">
              {imgs.map((img, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={`flex-shrink-0 w-14 h-10 rounded-md overflow-hidden border-2 transition-all ${
                    i === imgIdx ? 'border-[#2363EB] shadow' : 'border-slate-200 opacity-50 hover:opacity-100'
                  }`}>
                  <img src={`${imageBase}${img}`} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ===== INFO CARD ===== */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6">
            <h1 className="text-xl font-bold text-slate-900 mb-1">{acc.name}</h1>
            <div className="flex items-center gap-1.5 text-slate-400 text-sm mb-5">
              <MapPinIcon className="h-4 w-4 flex-shrink-0" />
              <span>{acc.city}</span>
            </div>

            {/* Stats — only Price and Total Rooms */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100/50">
                <div className="flex items-center gap-2 mb-1">
                  <CurrencyRupeeIcon className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-medium text-blue-600/70">Price / month</span>
                </div>
                <p className="text-xl font-bold text-slate-900">₹{acc.price?.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100/50">
                <div className="flex items-center gap-2 mb-1">
                  <HomeModernIcon className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-600/70">Total Rooms</span>
                </div>
                <p className="text-xl font-bold text-slate-900">{acc.roomspace?.total_space}</p>
              </div>
            </div>

            {/* Date-based availability checker */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <CalendarDaysIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-600">Check availability for:</span>
                  <input
                    type="date"
                    value={availDate}
                    onChange={e => handleAvailDateChange(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none"
                  />
                </div>
                <div className="flex items-center gap-4">
                  {availLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-200 border-t-[#2363EB] rounded-full animate-spin" />
                  ) : availability ? (
                    <>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-medium">Booked</p>
                        <p className="text-lg font-bold text-amber-600">{availability.booked}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-medium">Available</p>
                        <p className={`text-lg font-bold ${availability.available > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{availability.available}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-medium">Total</p>
                        <p className="text-lg font-bold text-slate-700">{availability.total}</p>
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400">Select a date</span>
                  )}
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Address</h3>
              <div className="flex items-start gap-2 text-sm text-slate-600">
                <MapPinIcon className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <span>{acc.address}, {acc.city}</span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Description</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{acc.description}</p>
            </div>

            {/* Amenities */}
            {acc.amenities?.length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {acc.amenities.map((am, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">
                      {am.name}
                      <span className="text-xs text-slate-400 font-medium ml-1">₹{am.rate}/mo</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* House Rules */}
            {acc.houseRules && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">House Rules</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(acc.houseRules).filter(([, v]) => v !== undefined).map(([key, val]) => (
                    <div key={key} className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-medium">{RULE_LABELS[key] || key}</p>
                      <p className="text-sm font-semibold text-slate-700 mt-0.5">{typeof val === 'boolean' ? (val ? 'Yes' : 'No') : val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== BOOKING HISTORY ===== */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900">Booking History</h2>
            <div className="flex gap-1 bg-slate-50 rounded-lg p-0.5 border border-slate-200 overflow-x-auto">
              {[{ key: '', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'confirmed', label: 'Confirmed' }, { key: 'rejected', label: 'Rejected' }, { key: 'cancelled', label: 'Cancelled' }].map(t => (
                <button key={t.key} onClick={() => setBookingFilter(t.key)}
                  className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap ${
                    bookingFilter === t.key
                      ? 'bg-[#2363EB] text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {bookingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-[#2363EB] rounded-full animate-spin" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDaysIcon className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-500">No bookings found</p>
                <p className="text-xs text-slate-400 mt-0.5">{bookingFilter ? `No ${bookingFilter} bookings for this accommodation` : 'No booking requests yet for this accommodation.'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map(b => {
                  const cfg = BOOKING_STATUS[b.status] || BOOKING_STATUS.pending
                  const BIcon = cfg.icon
                  return (
                    <div key={b._id} className="border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <UserIcon className="h-4 w-4 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{b.user?.name}</p>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                              <span className="flex items-center gap-1"><PhoneIcon className="h-3 w-3" /> {b.user?.phone}</span>
                              {b.user?.occupation && <span>{b.user.occupation}</span>}
                            </div>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border flex-shrink-0 ${cfg.bg}`}>
                          <BIcon className="h-3 w-3" /> {cfg.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500 ml-11">
                        <span><span className="text-slate-400">Check-in:</span> {fmtDate(b.checkIn)}</span>
                        <span><span className="text-slate-400">Check-out:</span> {fmtDate(b.checkOut)}</span>
                        <span><span className="text-slate-400">Spaces:</span> {b.spaces}</span>
                        <span><span className="text-slate-400">Total:</span> <span className="font-bold text-slate-900">₹{b.totalPrice?.toLocaleString()}</span></span>
                      </div>

                      {b.selectedAmenities?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 ml-11">
                          {b.selectedAmenities.map((am, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-sky-50 border border-sky-100 text-[10px] text-sky-700">
                              {am.name} — ₹{am.rate}
                            </span>
                          ))}
                        </div>
                      )}

                      {b.status === 'pending' && (
                        <div className="mt-3 ml-11 flex gap-2">
                          <button onClick={() => handleBookingAction(b._id, 'confirm')} disabled={!!actionLoading}
                            className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50">
                            <CheckCircleIcon className="h-3 w-3" />
                            {actionLoading === `${b._id}-confirm` ? 'Confirming...' : 'Confirm'}
                          </button>
                          <button onClick={() => handleBookingAction(b._id, 'reject')} disabled={!!actionLoading}
                            className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50">
                            <XCircleIcon className="h-3 w-3" />
                            {actionLoading === `${b._id}-reject` ? 'Rejecting...' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ===== EDIT MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-base font-bold text-slate-900">Edit Accommodation</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors">
                <XMarkIcon className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{formError}</div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Accommodation Name</label>
                <input type="text" value={form.name} onChange={e => handleFormChange('name', e.target.value)} required disabled={saving}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all disabled:opacity-60 text-sm"
                  placeholder="e.g. Cozy Room Downtown" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Address</label>
                  <input type="text" value={form.address} onChange={e => handleFormChange('address', e.target.value)} required disabled={saving}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all disabled:opacity-60 text-sm"
                    placeholder="Street, locality" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">City</label>
                  <input type="text" value={form.city} onChange={e => handleFormChange('city', e.target.value)} required disabled={saving}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all disabled:opacity-60 text-sm"
                    placeholder="City" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Price (per month)</label>
                  <input type="number" value={form.price} onChange={e => handleFormChange('price', e.target.value)} required min="0" disabled={saving}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all disabled:opacity-60 text-sm"
                    placeholder="5000" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Total Rooms</label>
                  <input type="number" value={form.totalSpace} onChange={e => handleFormChange('totalSpace', e.target.value)} required min="1" disabled={saving}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all disabled:opacity-60 text-sm"
                    placeholder="e.g. 4" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => handleFormChange('description', e.target.value)} required disabled={saving} rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all disabled:opacity-60 text-sm resize-none"
                  placeholder="Describe your accommodation..." />
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Amenities</label>
                <div className="space-y-2">
                  {(form.amenities || []).map((am, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input type="text" value={am.name}
                        onChange={e => { const arr = [...form.amenities]; arr[i] = { ...arr[i], name: e.target.value }; handleFormChange('amenities', arr) }}
                        placeholder="e.g. WiFi, AC" disabled={saving}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all disabled:opacity-60 text-sm" />
                      <input type="number" value={am.rate}
                        onChange={e => { const arr = [...form.amenities]; arr[i] = { ...arr[i], rate: e.target.value }; handleFormChange('amenities', arr) }}
                        placeholder="₹/mo" min="0" disabled={saving}
                        className="w-24 px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all disabled:opacity-60 text-sm" />
                      <button type="button" onClick={() => handleFormChange('amenities', form.amenities.filter((_, j) => j !== i))} disabled={saving}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => handleFormChange('amenities', [...(form.amenities || []), { name: '', rate: '' }])} disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2363EB] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50">
                    <PlusIcon className="h-3.5 w-3.5" /> Add Amenity
                  </button>
                </div>
              </div>

              {/* House Rules */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">House Rules</label>
                <div className="bg-slate-50 rounded-xl p-4 space-y-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    {HOUSE_RULE_FIELDS.map(({ key, label, options }) => (
                      <div key={key}>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1.5">{label}</label>
                        <div className="flex flex-wrap gap-1.5">
                          {options.map(opt => (
                            <button key={opt} type="button"
                              onClick={() => setForm(p => ({ ...p, houseRules: { ...p.houseRules, [key]: opt } }))}
                              disabled={saving}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border ${
                                form.houseRules?.[key] === opt
                                  ? 'bg-[#2363EB] text-white border-[#2363EB]'
                                  : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                              } disabled:opacity-50`}>
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-4 pt-3 border-t border-slate-200">
                    {HOUSE_RULE_TOGGLES.map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <button type="button"
                          onClick={() => setForm(p => ({ ...p, houseRules: { ...p.houseRules, [key]: !p.houseRules?.[key] } }))}
                          disabled={saving}
                          className={`w-9 h-5 rounded-full transition-all duration-200 flex-shrink-0 relative ${
                            form.houseRules?.[key] ? 'bg-[#2363EB]' : 'bg-slate-300'
                          } disabled:opacity-50`}>
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
                            form.houseRules?.[key] ? 'left-[18px]' : 'left-0.5'
                          }`} />
                        </button>
                        <span className="text-[11px] font-medium text-slate-500">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Images</label>

                {existingImages.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[11px] text-slate-400 mb-2">Current images ({existingImages.length})</p>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {existingImages.map((img, i) => (
                        <div key={img} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square bg-slate-100">
                          <img src={`${imageBase}${img}`} alt={`Image ${i + 1}`} className="w-full h-full object-cover"
                            onError={e => { e.target.src = ''; e.target.className = 'hidden' }} />
                          <button type="button" onClick={() => setExistingImages(prev => prev.filter((_, j) => j !== i))} disabled={saving}
                            className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow hover:bg-red-700 disabled:opacity-50">
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {newImages.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[11px] text-slate-400 mb-2">New images ({newImages.length})</p>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {newImages.map((file, i) => (
                        <div key={i} className="relative group rounded-lg overflow-hidden border border-blue-200 aspect-square bg-blue-50">
                          <img src={URL.createObjectURL(file)} alt={`New ${i + 1}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setNewImages(prev => prev.filter((_, j) => j !== i))} disabled={saving}
                            className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow hover:bg-red-700 disabled:opacity-50">
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                          <div className="absolute bottom-0 inset-x-0 bg-blue-600/80 text-white text-[9px] text-center py-px">New</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:border-slate-300 transition-colors">
                  <label className="block cursor-pointer text-center">
                    <input type="file" accept="image/*" multiple onChange={e => setNewImages(prev => [...prev, ...Array.from(e.target.files)])} disabled={saving} className="sr-only" />
                    <PhotoIcon className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
                    <span className="text-xs font-medium text-slate-500">Add more images</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">Max 5MB each. JPG, PNG, WebP.</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} disabled={saving}
                  className="px-5 py-2.5 text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-[#2363EB] hover:bg-[#1b50c7] rounded-xl transition-colors disabled:opacity-50 shadow-md shadow-[#2363EB]/20">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <TrashIcon className="h-7 w-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Delete Accommodation?</h3>
            <p className="text-slate-400 text-sm mb-6">This action cannot be undone. All data for this listing will be permanently removed.</p>
            <div className="flex gap-2.5 justify-center">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-5 py-2.5 text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} className="px-5 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors">
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default HostAccommodationDetail
