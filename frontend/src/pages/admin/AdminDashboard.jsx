import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  BuildingOffice2Icon,
  MapPinIcon,
  CurrencyDollarIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline'

const PAGE_SIZE = 12

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

function StatusBadge({ status, compact }) {
  const Icon = STATUS_ICONS[status] || ClockIcon
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full font-medium border ${compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'} ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
      <Icon className={compact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function AdminDashboard() {
  const navigate = useNavigate()
  const [accommodations, setAccommodations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('')
  const [selected, setSelected] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState('')
  const [activeImage, setActiveImage] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

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

  useEffect(() => {
    if (!token) {
      navigate('/login/admin', { replace: true })
      return
    }
    fetchAccommodations()
  }, [token, navigate, fetchAccommodations])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

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

  const pagePadding = 'p-6 md:p-8 pt-16 md:pt-8'

  // ---------- Detail view ----------
  if (selected) {
    const a = selected
    const imageBase = API_BASE || ''
    return (
      <div className={pagePadding}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => setSelected(null)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5" />
              <span className="font-medium">Back to list</span>
            </button>
            <StatusBadge status={a.status} />
          </div>

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
                      className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === activeImage ? 'border-slate-800 ring-2 ring-slate-800/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={`${imageBase}${img}`} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
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
        </div>
      </div>
    )
  }

  // ---------- List view ----------
  return (
    <div className={pagePadding}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Accommodations</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {!loading && accommodations.length > 0
                ? `${accommodations.length} listing${accommodations.length !== 1 ? 's' : ''}`
                : 'Manage and verify accommodation listings'}
            </p>
          </div>
          <div className="flex gap-1 bg-slate-100/80 rounded-lg p-1 w-fit">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm flex items-center gap-2">
            <XCircleIcon className="h-4 w-4 flex-shrink-0" />
            {error}
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600 p-1">
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-7 h-7 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading accommodations...</p>
          </div>
        ) : accommodations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-xl border border-slate-200/80 shadow-sm">
            <BuildingOffice2Icon className="h-10 w-10 mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No accommodations found</p>
            <p className="text-xs mt-1 text-slate-400">
              {activeTab ? `No ${activeTab} accommodations` : 'No accommodations have been listed yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {accommodations.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map(a => {
              const imageBase = API_BASE || ''
              const thumb = a.images?.[0] ? `${imageBase}${a.images[0]}` : null
              return (
                <button
                  key={a._id}
                  onClick={() => openDetail(a._id)}
                  className="bg-white rounded-lg border border-slate-200/80 overflow-hidden text-left hover:border-slate-300 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="aspect-[16/9] bg-slate-100 relative overflow-hidden">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={a.name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PhotoIcon className="h-8 w-8 text-slate-300" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <StatusBadge status={a.status} compact />
                    </div>
                  </div>
                  <div className="p-2.5">
                    <h3 className="font-medium text-slate-900 text-sm truncate mb-0.5">{a.name}</h3>
                    <div className="flex items-center gap-1 text-slate-500 text-xs mb-1">
                      <MapPinIcon className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{a.city}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">₹{a.price?.toLocaleString()}/mo</span>
                      <span className="text-slate-400 truncate max-w-[100px]">{a.host?.name}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {(() => {
            const totalPages = Math.ceil(accommodations.length / PAGE_SIZE)
            if (totalPages <= 1) return null
            const start = (currentPage - 1) * PAGE_SIZE
            const end = Math.min(currentPage * PAGE_SIZE, accommodations.length)
            return (
              <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                <p className="text-sm text-slate-500">
                  Showing {start + 1}&ndash;{end} of {accommodations.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <span className="px-3 py-1.5 text-sm font-medium text-slate-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })()}
          </>
        )}
      </div>

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
