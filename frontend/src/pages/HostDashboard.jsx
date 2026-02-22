import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  BuildingOffice2Icon,
  PlusIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MapPinIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline'
import HostSidebar from '../components/HostSidebar'

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL

const statusBadge = {
  pending:  { bg: 'bg-amber-50 text-amber-600 border border-amber-200', icon: ClockIcon, label: 'Pending' },
  verified: { bg: 'bg-emerald-50 text-emerald-600 border border-emerald-200', icon: CheckCircleIcon, label: 'Verified' },
  rejected: { bg: 'bg-red-50 text-red-600 border border-red-200', icon: XCircleIcon, label: 'Rejected' },
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

const emptyForm = {
  name: '', address: '', city: '', price: '', description: '',
  totalSpace: '', amenities: [], reviews: '[]',
  houseRules: { ...defaultHouseRules },
}

function HostDashboard() {
  const navigate = useNavigate()
  const token = localStorage.getItem('hostToken')

  const [accommodations, setAccommodations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [images, setImages] = useState([])
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const authHeaders = { Authorization: `Bearer ${token}` }

  const fetchAccommodations = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/host/accommodations`, { headers: authHeaders })
      setAccommodations(data.accommodations || [])
    } catch (err) {
      if (err.response?.status === 401) { localStorage.removeItem('hostToken'); navigate('/login/host', { replace: true }); return }
      setError(err.response?.data?.error || 'Failed to load accommodations')
    } finally {
      setLoading(false)
    }
  }, [token, navigate])

  useEffect(() => {
    if (!token) { navigate('/login/host', { replace: true }); return }
    fetchAccommodations()
  }, [token, navigate, fetchAccommodations])

  const openCreate = () => {
    setForm({ ...emptyForm })
    setImages([])
    setFormError('')
    setShowModal(true)
  }

  const handleFormChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError('')
    if (images.length === 0) { setFormError('At least one image is required.'); return }
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
      for (const img of images) fd.append('images', img)

      await axios.post(`${API_BASE}/api/host/accommodations`, fd, { headers: authHeaders })
      setShowModal(false)
      setLoading(true)
      fetchAccommodations()
    } catch (err) {
      setFormError(err.response?.data?.error || err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (!token) return null
  const imageBase = API_BASE || ''

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <HostSidebar />

      <div className="flex-1 min-w-0">
        {/* Page header */}
        <div className="bg-white border-b border-slate-200/80 px-6 py-5 md:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Accommodations</h1>
            <p className="text-xs text-slate-400 mt-0.5">Manage your property listings</p>
          </div>
          <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2363EB] hover:bg-[#1b50c7] rounded-xl transition-colors shadow-md shadow-[#2363EB]/20">
            <PlusIcon className="h-3.5 w-3.5" /> New Listing
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 md:px-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-28 text-slate-400">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-[#2363EB] rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium">Loading accommodations...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-28">
              <XCircleIcon className="h-12 w-12 text-red-300 mb-3" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          ) : accommodations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 text-slate-400">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
                <BuildingOffice2Icon className="h-10 w-10 text-slate-300" />
              </div>
              <p className="text-lg font-semibold text-slate-600 mb-1">No accommodations yet</p>
              <p className="text-sm text-slate-400 mb-6">Create your first listing to get started.</p>
              <button onClick={openCreate} className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#2363EB] hover:bg-[#1b50c7] rounded-xl transition-colors shadow-lg shadow-[#2363EB]/20">
                <PlusIcon className="h-4 w-4" /> Add Accommodation
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {accommodations.map(a => {
                const badge = statusBadge[a.status] || statusBadge.pending
                const Icon = badge.icon
                const thumb = a.images?.[0] ? `${imageBase}${a.images[0]}` : null
                return (
                  <button key={a._id} onClick={() => navigate(`/host/accommodation/${a._id}`)}
                    className="group bg-white rounded-xl border border-slate-200/80 overflow-hidden text-left hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2363EB]/30">
                    <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden">
                      {thumb ? (
                        <img src={thumb} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e => { e.target.style.display = 'none' }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><PhotoIcon className="h-8 w-8 text-slate-300" /></div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm ${badge.bg}`}>
                          <Icon className="h-3 w-3" /> {badge.label}
                        </span>
                      </div>
                      {a.images?.length > 1 && (
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium">
                          {a.images.length} photos
                        </div>
                      )}
                    </div>
                    <div className="p-3.5">
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mb-0.5">{a.name}</h3>
                      <div className="flex items-center gap-1 text-slate-400 text-xs mb-2">
                        <MapPinIcon className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{a.city}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-900">₹{a.price?.toLocaleString()}<span className="text-[10px] font-normal text-slate-400">/mo</span></p>
                        <span className="text-[11px] text-slate-400">{a.roomspace?.available_space ?? 0}/{a.roomspace?.total_space} rooms</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== CREATE MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-base font-bold text-slate-900">New Accommodation</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors">
                <XMarkIcon className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5">
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

                {images.length > 0 && (
                  <div className="mb-3">
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {images.map((file, i) => (
                        <div key={i} className="relative group rounded-lg overflow-hidden border border-blue-200 aspect-square bg-blue-50">
                          <img src={URL.createObjectURL(file)} alt={`New ${i + 1}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))} disabled={saving}
                            className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow hover:bg-red-700 disabled:opacity-50">
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:border-slate-300 transition-colors">
                  <label className="block cursor-pointer text-center">
                    <input type="file" accept="image/*" multiple onChange={e => setImages(prev => [...prev, ...Array.from(e.target.files)])} disabled={saving} className="sr-only" />
                    <PhotoIcon className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
                    <span className="text-xs font-medium text-slate-500">Upload images</span>
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
                  {saving ? 'Saving...' : 'Submit for Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default HostDashboard
