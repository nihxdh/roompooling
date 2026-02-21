import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  ArrowLeftOnRectangleIcon,
  BuildingOffice2Icon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  NoSymbolIcon,
  MapPinIcon,
  PhotoIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  PhoneIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import ChatWindow from '../components/ChatWindow'

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL

const statusBadge = {
  pending: { bg: 'bg-amber-100 text-amber-700', icon: ClockIcon, label: 'Pending' },
  verified: { bg: 'bg-emerald-100 text-emerald-700', icon: CheckCircleIcon, label: 'Verified' },
  rejected: { bg: 'bg-red-100 text-red-700', icon: XCircleIcon, label: 'Rejected' },
}

const BOOKING_STATUS = {
  pending:   { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: ClockIcon, label: 'Pending' },
  confirmed: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircleIcon, label: 'Confirmed' },
  rejected:  { bg: 'bg-red-50 text-red-700 border-red-200', icon: XCircleIcon, label: 'Rejected' },
  cancelled: { bg: 'bg-slate-100 text-slate-500 border-slate-200', icon: NoSymbolIcon, label: 'Cancelled' },
}

const emptyForm = {
  name: '', address: '', city: '', price: '', description: '',
  totalSpace: '', amenities: [], reviews: '[]',
}

function HostDashboard() {
  const navigate = useNavigate()
  const token = localStorage.getItem('hostToken')

  const [activeSection, setActiveSection] = useState('accommodations')
  const [accommodations, setAccommodations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [images, setImages] = useState([])
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Delete confirm
  const [deletingId, setDeletingId] = useState(null)

  // Bookings state
  const [bookings, setBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingFilter, setBookingFilter] = useState('')
  const [actionLoading, setActionLoading] = useState('')

  // Messages state
  const [hostConversations, setHostConversations] = useState([])
  const [hostConvLoading, setHostConvLoading] = useState(false)
  const [activeHostConv, setActiveHostConv] = useState(null)
  const [showConvList, setShowConvList] = useState(true)

  const authHeaders = { Authorization: `Bearer ${token}` }

  const fetchAccommodations = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/host/accommodations`, { headers: authHeaders })
      setAccommodations(data.accommodations || [])
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('hostToken')
        navigate('/login/host', { replace: true })
        return
      }
      setError(err.response?.data?.error || 'Failed to load accommodations')
    } finally {
      setLoading(false)
    }
  }, [token, navigate])

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true)
    try {
      const params = bookingFilter ? { status: bookingFilter } : {}
      const { data } = await axios.get(`${API_BASE}/api/host/bookings`, { headers: authHeaders, params })
      setBookings(data.bookings || [])
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('hostToken')
        navigate('/login/host', { replace: true })
        return
      }
      setError(err.response?.data?.error || 'Failed to load bookings')
    } finally {
      setBookingsLoading(false)
    }
  }, [token, navigate, bookingFilter])

  useEffect(() => {
    if (!token) { navigate('/login/host', { replace: true }); return }
    fetchAccommodations()
  }, [token, navigate, fetchAccommodations])

  const fetchHostConversations = useCallback(async () => {
    setHostConvLoading(true)
    try {
      const { data } = await axios.get(`${API_BASE}/api/host/conversations`, { headers: authHeaders })
      setHostConversations(data.conversations || [])
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('hostToken')
        navigate('/login/host', { replace: true })
      }
    } finally {
      setHostConvLoading(false)
    }
  }, [token, navigate])

  useEffect(() => {
    if (activeSection === 'bookings' && token) fetchBookings()
    if (activeSection === 'messages' && token) fetchHostConversations()
  }, [activeSection, fetchBookings, fetchHostConversations, token])

  const handleBookingAction = async (id, action) => {
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

  const handleLogout = () => {
    localStorage.removeItem('hostToken')
    navigate('/', { replace: true })
  }

  // -- Create / Edit modal helpers --

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm })
    setImages([])
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (a) => {
    setEditingId(a._id)
    setForm({
      name: a.name || '',
      address: a.address || '',
      city: a.city || '',
      price: a.price?.toString() || '',
      description: a.description || '',
      totalSpace: a.roomspace?.total_space?.toString() || '',
      amenities: (a.amenities || []).map(am => ({ name: am.name || '', rate: am.rate?.toString() || '' })),
      reviews: JSON.stringify(a.reviews || []),
    })
    setImages([])
    setFormError('')
    setShowModal(true)
  }

  const handleFormChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!editingId && images.length === 0) {
      setFormError('At least one image is required for a new accommodation.')
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
      for (const img of images) fd.append('images', img)

      if (editingId) {
        await axios.put(`${API_BASE}/api/host/accommodations/${editingId}`, fd, {
          headers: authHeaders
        })
      } else {
        await axios.post(`${API_BASE}/api/host/accommodations`, fd, {
          headers: authHeaders
        })
      }
      setShowModal(false)
      setLoading(true)
      fetchAccommodations()
    } catch (err) {
      setFormError(err.response?.data?.error || err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/host/accommodations/${id}`, { headers: authHeaders })
      setDeletingId(null)
      setAccommodations(prev => prev.filter(a => a._id !== id))
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed')
      setDeletingId(null)
    }
  }

  if (!token) return null
  const imageBase = API_BASE || ''

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#2363EB] text-white">
              <BuildingOffice2Icon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Host Dashboard</h1>
              <p className="text-xs text-slate-500">Manage your accommodations & bookings</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeSection === 'accommodations' && (
              <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#2363EB] hover:bg-[#1b50c7] rounded-lg transition-colors shadow-lg shadow-[#2363EB]/25">
                <PlusIcon className="h-4 w-4" /> Add Accommodation
              </button>
            )}
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <ArrowLeftOnRectangleIcon className="h-5 w-5" /> Logout
            </button>
          </div>
        </div>

        {/* Section tabs */}
        <div className="max-w-6xl mx-auto px-6 flex gap-1 pb-0">
          <button
            onClick={() => setActiveSection('accommodations')}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all border-b-2 ${
              activeSection === 'accommodations'
                ? 'border-[#2363EB] text-[#2363EB] bg-slate-50'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2"><BuildingOffice2Icon className="h-4 w-4" /> Accommodations</span>
          </button>
          <button
            onClick={() => setActiveSection('bookings')}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all border-b-2 ${
              activeSection === 'bookings'
                ? 'border-[#2363EB] text-[#2363EB] bg-slate-50'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2"><CalendarDaysIcon className="h-4 w-4" /> Booking Requests</span>
          </button>
          <button
            onClick={() => setActiveSection('messages')}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all border-b-2 ${
              activeSection === 'messages'
                ? 'border-[#2363EB] text-[#2363EB] bg-slate-50'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2"><ChatBubbleLeftRightIcon className="h-4 w-4" /> Messages</span>
          </button>
        </div>
      </header>

      {/* ===== MESSAGES SECTION (full-width, outside main container) ===== */}
      {activeSection === 'messages' && (
        <div className="flex" style={{ height: 'calc(100vh - 120px)' }}>
          {/* Conversation list */}
          <div className={`${activeHostConv && !showConvList ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-slate-200 bg-white`}>
            {hostConvLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-[#2363EB] rounded-full animate-spin" />
              </div>
            ) : hostConversations.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 px-6 text-center">
                <ChatBubbleLeftRightIcon className="h-12 w-12 mb-3 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">No messages yet</p>
                <p className="text-xs mt-1">Seeker messages will appear here</p>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1">
                {hostConversations.map(c => {
                  const isActive = activeHostConv?._id === c._id
                  return (
                    <button
                      key={c._id}
                      onClick={() => { setActiveHostConv(c); setShowConvList(false) }}
                      className={`w-full px-4 py-3.5 flex gap-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 ${
                        isActive ? 'bg-blue-50 border-l-2 border-l-[#2363EB]' : ''
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="h-5 w-5 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900 truncate">{c.seeker?.name || 'Seeker'}</p>
                          <span className="text-[10px] text-slate-400 flex-shrink-0">
                            {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{c.accommodation?.name || 'Accommodation'}</p>
                        {c.lastMessage && <p className="text-xs text-slate-400 truncate mt-0.5">{c.lastMessage}</p>}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Chat area */}
          <div className={`${!activeHostConv || showConvList ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-slate-50`}>
            {activeHostConv ? (
              <>
                <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center gap-3">
                  <button
                    onClick={() => setShowConvList(true)}
                    className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{activeHostConv.seeker?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{activeHostConv.accommodation?.name}</p>
                  </div>
                </div>
                <ChatWindow
                  conversationId={activeHostConv._id}
                  token={token}
                  role="host"
                  apiPrefix="host"
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                Select a conversation to start chatting
              </div>
            )}
          </div>
        </div>
      )}

      <main className={`max-w-6xl mx-auto px-6 py-8 ${activeSection === 'messages' ? 'hidden' : ''}`}>
        {/* ===== BOOKINGS SECTION ===== */}
        {activeSection === 'bookings' ? (
          <div>
            {/* Filter tabs */}
            <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200 mb-6 w-fit overflow-x-auto">
              {[{ key: '', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'confirmed', label: 'Confirmed' }, { key: 'rejected', label: 'Rejected' }, { key: 'cancelled', label: 'Cancelled' }].map(t => (
                <button
                  key={t.key}
                  onClick={() => setBookingFilter(t.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    bookingFilter === t.key
                      ? 'bg-[#2363EB] text-white shadow-sm'
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
                <CalendarDaysIcon className="h-14 w-14 mb-3 text-slate-300" />
                <p className="text-base font-semibold text-slate-500 mb-1">No booking requests</p>
                <p className="text-sm">{bookingFilter ? `No ${bookingFilter} bookings` : 'Booking requests from seekers will appear here.'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map(b => {
                  const cfg = BOOKING_STATUS[b.status] || BOOKING_STATUS.pending
                  const StatusIcon = cfg.icon
                  const acc = b.accommodation
                  const thumb = acc?.images?.[0] ? `${imageBase}${acc.images[0]}` : null
                  return (
                    <div key={b._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col sm:flex-row">
                      <div className="sm:w-44 h-32 sm:h-auto bg-slate-100 flex-shrink-0 overflow-hidden">
                        {thumb ? (
                          <img src={thumb} alt={acc?.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><PhotoIcon className="h-8 w-8 text-slate-300" /></div>
                        )}
                      </div>
                      <div className="flex-1 p-5 flex flex-col">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <h3 className="text-base font-bold text-slate-900">{acc?.name || 'Accommodation'}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{acc?.address}, {acc?.city}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${cfg.bg}`}>
                            <StatusIcon className="h-3.5 w-3.5" /> {cfg.label}
                          </span>
                        </div>

                        {/* Seeker info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-2">
                          <span className="flex items-center gap-1"><UserIcon className="h-3.5 w-3.5 text-slate-400" /> {b.user?.name}</span>
                          <span className="flex items-center gap-1"><PhoneIcon className="h-3.5 w-3.5 text-slate-400" /> {b.user?.phone}</span>
                          {b.user?.occupation && <span className="text-xs text-slate-400">{b.user.occupation}</span>}
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
                          <span><span className="text-slate-400">Check-in:</span> {fmtDate(b.checkIn)}</span>
                          <span><span className="text-slate-400">Check-out:</span> {fmtDate(b.checkOut)}</span>
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

                        {b.message && <p className="text-xs text-slate-400 mt-2 italic">"{b.message}"</p>}

                        {b.status === 'pending' && (
                          <div className="mt-auto pt-3 flex gap-2">
                            <button
                              onClick={() => handleBookingAction(b._id, 'confirm')}
                              disabled={!!actionLoading}
                              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <CheckCircleIcon className="h-3.5 w-3.5" />
                              {actionLoading === `${b._id}-confirm` ? 'Confirming...' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => handleBookingAction(b._id, 'reject')}
                              disabled={!!actionLoading}
                              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                            >
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
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mb-4" />
            <p className="text-sm">Loading accommodations...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24">
            <XCircleIcon className="h-12 w-12 text-red-300 mb-3" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        ) : accommodations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <BuildingOffice2Icon className="h-16 w-16 mb-4 text-slate-300" />
            <p className="text-lg font-semibold text-slate-500 mb-2">No accommodations yet</p>
            <p className="text-sm mb-6">Create your first listing to get started.</p>
            <button onClick={openCreate} className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#2363EB] hover:bg-[#1b50c7] rounded-lg transition-colors">
              <PlusIcon className="h-4 w-4" /> Add Accommodation
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {accommodations.map(a => {
              const badge = statusBadge[a.status] || statusBadge.pending
              const Icon = badge.icon
              return (
                <div key={a._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
                  {/* Image */}
                  <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden">
                    {a.images?.length > 0 ? (
                      <img src={`${imageBase}${a.images[0]}`} alt={a.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><PhotoIcon className="h-10 w-10 text-slate-300" /></div>
                    )}
                    <div className="absolute top-2.5 right-2.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg}`}>
                        <Icon className="h-3.5 w-3.5" /> {badge.label}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-base font-bold text-slate-900 mb-1 line-clamp-1">{a.name}</h3>
                    <div className="flex items-center gap-1 text-slate-500 text-xs mb-3">
                      <MapPinIcon className="h-3.5 w-3.5" /> {a.address}, {a.city}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center mb-4">
                      <div className="bg-slate-50 rounded-lg py-2">
                        <p className="text-[10px] text-slate-500">Price/mo</p>
                        <p className="text-sm font-bold text-slate-900">₹{a.price?.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg py-2">
                        <p className="text-[10px] text-slate-500">Rooms</p>
                        <p className="text-sm font-bold text-slate-900">{a.roomspace?.total_space}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg py-2">
                        <p className="text-[10px] text-slate-500">Available</p>
                        <p className="text-sm font-bold text-slate-900">{a.roomspace?.available_space ?? '—'}</p>
                      </div>
                    </div>

                    <div className="mt-auto flex gap-2">
                      <button onClick={() => openEdit(a)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                        <PencilSquareIcon className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button onClick={() => setDeletingId(a._id)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                        <TrashIcon className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-slate-900">{editingId ? 'Edit Accommodation' : 'Add Accommodation'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <XMarkIcon className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-5">
              {formError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{formError}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Accommodation Name</label>
                <input type="text" value={form.name} onChange={e => handleFormChange('name', e.target.value)} required disabled={saving}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all disabled:opacity-60 text-sm"
                  placeholder="e.g. Cozy Room Downtown" />
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
                  <input type="text" value={form.address} onChange={e => handleFormChange('address', e.target.value)} required disabled={saving}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all disabled:opacity-60 text-sm"
                    placeholder="Street, locality" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                  <input type="text" value={form.city} onChange={e => handleFormChange('city', e.target.value)} required disabled={saving}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all disabled:opacity-60 text-sm"
                    placeholder="City" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Price (per month)</label>
                  <input type="number" value={form.price} onChange={e => handleFormChange('price', e.target.value)} required min="0" disabled={saving}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all disabled:opacity-60 text-sm"
                    placeholder="5000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Total Rooms</label>
                  <input type="number" value={form.totalSpace} onChange={e => handleFormChange('totalSpace', e.target.value)} required min="1" disabled={saving}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all disabled:opacity-60 text-sm"
                    placeholder="e.g. 4" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => handleFormChange('description', e.target.value)} required disabled={saving} rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all disabled:opacity-60 text-sm resize-none"
                  placeholder="Describe your accommodation..." />
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Amenities</label>
                <div className="space-y-2">
                  {(form.amenities || []).map((am, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={am.name}
                        onChange={e => {
                          const arr = [...form.amenities]
                          arr[i] = { ...arr[i], name: e.target.value }
                          handleFormChange('amenities', arr)
                        }}
                        placeholder="e.g. WiFi, AC, Laundry"
                        disabled={saving}
                        className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all disabled:opacity-60 text-sm"
                      />
                      <input
                        type="number"
                        value={am.rate}
                        onChange={e => {
                          const arr = [...form.amenities]
                          arr[i] = { ...arr[i], rate: e.target.value }
                          handleFormChange('amenities', arr)
                        }}
                        placeholder="Rate/mo"
                        min="0"
                        disabled={saving}
                        className="w-28 px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#2363EB]/20 focus:border-[#2363EB] outline-none transition-all disabled:opacity-60 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const arr = form.amenities.filter((_, j) => j !== i)
                          handleFormChange('amenities', arr)
                        }}
                        disabled={saving}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleFormChange('amenities', [...(form.amenities || []), { name: '', rate: '' }])}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#2363EB] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <PlusIcon className="h-3.5 w-3.5" /> Add Amenity
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">Each amenity has a name and a monthly rate (₹). Seekers can select these when booking.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Images {editingId ? '(upload to replace existing)' : ''}
                </label>
                <div className="p-5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/30 hover:border-slate-300 transition-colors">
                  <label className="block cursor-pointer text-center">
                    <input type="file" accept="image/*" multiple onChange={e => setImages(Array.from(e.target.files))} disabled={saving} className="sr-only" />
                    <PhotoIcon className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <span className="text-sm font-medium text-slate-600">Click to upload images</span>
                    <span className="block text-xs text-slate-400 mt-1">Max 10 files, 5MB each. JPG, PNG, WebP.</span>
                    {images.length > 0 && <span className="block text-[#2363EB] font-medium text-sm mt-2">{images.length} file(s) selected</span>}
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} disabled={saving}
                  className="px-6 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-[#2363EB] hover:bg-[#1b50c7] rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-[#2363EB]/25">
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Submit for Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeletingId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <TrashIcon className="h-7 w-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Accommodation?</h3>
            <p className="text-slate-500 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeletingId(null)} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deletingId)} className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HostDashboard
