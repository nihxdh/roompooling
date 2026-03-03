import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import {
  MapPinIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
  HomeModernIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import SeekerSidebar from '../components/SeekerSidebar'

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL

function getScoreColor(score) {
  if (score >= 80) return { ring: 'ring-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50', stroke: '#10b981' }
  if (score >= 60) return { ring: 'ring-[#8A7BF9]', text: 'text-[#8A7BF9]', bg: 'bg-[#8A7BF9]/10', stroke: '#8A7BF9' }
  if (score >= 40) return { ring: 'ring-amber-400', text: 'text-amber-600', bg: 'bg-amber-50', stroke: '#f59e0b' }
  return { ring: 'ring-red-400', text: 'text-red-500', bg: 'bg-red-50', stroke: '#ef4444' }
}

function MiniScoreRing({ score }) {
  const c = getScoreColor(score)
  const r = 12, circ = 2 * Math.PI * r, offset = circ - (score / 100) * circ
  return (
    <div className="relative w-8 h-8 flex items-center justify-center flex-shrink-0">
      <svg width="32" height="32" className="-rotate-90">
        <circle cx="16" cy="16" r={r} fill="none" stroke="#e2e8f0" strokeWidth="2" />
        <circle cx="16" cy="16" r={r} fill="none" stroke={c.stroke} strokeWidth="2" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-700" />
      </svg>
      <span className={`absolute text-[10px] font-bold ${c.text}`}>{score}</span>
    </div>
  )
}

function SeekerDashboard() {
  const navigate = useNavigate()
  const token = localStorage.getItem('seekerToken')
  const [accommodations, setAccommodations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [smartMode, setSmartMode] = useState(false)

  const fetchAccommodations = useCallback(async (smart = false) => {
    setLoading(true)
    setError('')
    try {
      const params = smart ? { smart: true } : {}
      const { data } = await axios.get(`${API_BASE}/api/user/accommodations`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
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
    fetchAccommodations(smartMode)
  }, [token, navigate, fetchAccommodations, smartMode])

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

      <main className="lg:pl-64 px-6 lg:px-10 pt-6 pb-10">
        <div className="max-w-7xl mx-auto">
          {/* Page title + search inline */}
          <div className="mb-6">
            <h1 className="text-slate-900 font-semibold text-xl tracking-tight mb-1">Find Accommodations</h1>
            <p className="text-slate-500 text-sm mb-4">
              {filtered.length} verified listing{filtered.length !== 1 ? 's' : ''} available
              {smartMode && ' · Sorted by compatibility'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, city, or address..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm placeholder-slate-400 focus:ring-2 focus:ring-slate-200 focus:border-slate-300 outline-none transition-all"
                />
              </div>
              <button
                onClick={() => setSmartMode(p => !p)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
                  smartMode
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <SparklesIcon className="h-4 w-4" />
                {smartMode ? 'Smart Match On' : 'Smart Match'}
              </button>
            </div>
          </div>

          {smartMode && !loading && (
            <div className="mb-6 p-4 rounded-lg bg-indigo-50/80 border border-indigo-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <SparklesIcon className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-indigo-900">Smart Match Active</p>
                  <p className="text-xs text-indigo-700/90 mt-0.5">
                    Listings are ranked by compatibility with your lifestyle preferences and existing roommates.
                    {!accommodations[0]?.compatibility && ' Set up your preferences in your profile to get personalized matches.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin mb-3" />
              <p className="text-sm">{smartMode ? 'Finding best matches...' : 'Loading accommodations...'}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-red-500">
              <p className="text-sm">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <PhotoIcon className="h-10 w-10 mb-2" />
              <p className="text-sm font-medium">No accommodations found</p>
              {search && <p className="text-xs mt-1">Try a different search term</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((a, idx) => {
                const thumb = a.images?.[0] ? `${imageBase}${a.images[0]}` : null
                const compat = a.compatibility
                return (
                  <Link
                    to={`/seeker/accommodation/${a._id}`}
                    key={a._id}
                    className={`group bg-white rounded-xl border overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-200 ${
                      compat?.score >= 80 ? 'border-emerald-200 ring-1 ring-emerald-100/50' : 'border-slate-200'
                    }`}
                  >
                    <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={a.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PhotoIcon className="h-8 w-8 text-slate-300" />
                        </div>
                      )}
                      {compat && (
                        <div className="absolute top-2 right-2">
                          <div className="bg-white/95 backdrop-blur-sm rounded-lg px-1 py-0.5 shadow-sm">
                            <MiniScoreRing score={compat.score} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      <div className="flex items-start justify-between gap-1.5 mb-1.5">
                        <p className="text-base font-semibold text-slate-900">
                          ₹{a.price?.toLocaleString()}<span className="text-xs font-normal text-slate-400">/mo</span>
                        </p>
                        {compat?.roommateCount > 0 && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium flex-shrink-0">
                            <UserGroupIcon className="h-2.5 w-2.5" />{compat.roommateCount}
                          </span>
                        )}
                      </div>

                      {compat?.topInsight && (
                        <p className="text-[11px] text-violet-600/90 bg-violet-50/80 rounded px-2 py-1 mb-2 line-clamp-2 font-medium">
                          {compat.topInsight}
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-slate-500 text-xs min-w-0">
                          <MapPinIcon className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{a.city}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs flex-shrink-0">
                          <HomeModernIcon className="h-3 w-3 text-slate-400" />
                          <span className={`font-medium ${(a.roomspace?.available_space ?? 0) === 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                            {a.roomspace?.available_space ?? a.roomspace?.total_space} room{(a.roomspace?.available_space ?? a.roomspace?.total_space) !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default SeekerDashboard
