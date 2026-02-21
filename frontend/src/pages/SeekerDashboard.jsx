import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import {
  MapPinIcon,
  CurrencyDollarIcon,
  StarIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import SeekerSidebar from '../components/SeekerSidebar'

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL

function SeekerDashboard() {
  const navigate = useNavigate()
  const token = localStorage.getItem('seekerToken')
  const [accommodations, setAccommodations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  const fetchAccommodations = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/user/accommodations`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setAccommodations(data.accommodations || [])
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('seekerToken')
        navigate('/login/seeker', { replace: true })
        return
      }
      setError(err.response?.data?.error || 'Failed to load accommodations')
    } finally {
      setLoading(false)
    }
  }, [token, navigate])

  useEffect(() => {
    if (!token) {
      navigate('/login/seeker', { replace: true })
      return
    }
    fetchAccommodations()
  }, [token, navigate, fetchAccommodations])

  const filtered = accommodations.filter(a => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      a.name?.toLowerCase().includes(q) ||
      a.city?.toLowerCase().includes(q) ||
      a.address?.toLowerCase().includes(q)
    )
  })

  const imageBase = API_BASE || ''

  return (
    <div className="min-h-screen bg-slate-50">
      <SeekerSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200">
          <div className="px-6 lg:px-10 py-5 flex items-center justify-between gap-4">
            <div className="pl-12 lg:pl-0">
              <h1 className="text-xl font-bold text-slate-900">Find Accommodations</h1>
              <p className="text-xs text-slate-500 mt-0.5">{filtered.length} verified listing{filtered.length !== 1 ? 's' : ''} available</p>
            </div>
          </div>
        </header>

        <main className="px-6 lg:px-10 py-8">
          {/* Search */}
          <div className="mb-8 flex gap-3">
            <div className="relative flex-1 max-w-lg">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, city, or address..."
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm placeholder-slate-400 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <div className="w-10 h-10 border-[3px] border-slate-200 border-t-sky-600 rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium">Loading accommodations...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 text-red-400">
              <p className="text-sm">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <PhotoIcon className="h-12 w-12 mb-3" />
              <p className="text-sm font-medium">No accommodations found</p>
              {search && <p className="text-xs mt-1">Try a different search term</p>}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((a, idx) => {
                const thumb = a.images?.[0] ? `${imageBase}${a.images[0]}` : null
                return (
                  <Link
                    to={`/seeker/accommodation/${a._id}`}
                    key={a._id}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    {/* Image */}
                    <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={a.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PhotoIcon className="h-10 w-10 text-slate-300" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-xs font-semibold text-slate-700 shadow-sm">
                          ₹{a.price?.toLocaleString()}/mo
                        </span>
                      </div>
                      {a.images?.length > 1 && (
                        <div className="absolute bottom-3 right-3">
                          <span className="px-2 py-0.5 rounded-md bg-black/50 text-white text-xs backdrop-blur-sm">
                            {a.images.length} photos
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-5">
                      <h3 className="font-semibold text-slate-900 mb-1.5 truncate group-hover:text-sky-700 transition-colors">{a.name}</h3>
                      <div className="flex items-center gap-1 text-slate-500 text-sm mb-3">
                        <MapPinIcon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{a.address}, {a.city}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="px-2 py-1 rounded-md bg-slate-50 border border-slate-100 font-medium">
                            {a.roomspace?.available_space ?? a.roomspace?.total_space} room{(a.roomspace?.available_space ?? a.roomspace?.total_space) !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {a.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <StarSolid className="h-3.5 w-3.5 text-amber-400" />
                            <span className="text-xs font-medium text-slate-700">{a.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default SeekerDashboard
