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
  if (score >= 60) return { ring: 'ring-sky-400', text: 'text-sky-600', bg: 'bg-sky-50', stroke: '#0ea5e9' }
  if (score >= 40) return { ring: 'ring-amber-400', text: 'text-amber-600', bg: 'bg-amber-50', stroke: '#f59e0b' }
  return { ring: 'ring-red-400', text: 'text-red-500', bg: 'bg-red-50', stroke: '#ef4444' }
}

function MiniScoreRing({ score }) {
  const c = getScoreColor(score)
  const r = 18, circ = 2 * Math.PI * r, offset = circ - (score / 100) * circ
  return (
    <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
      <svg width="48" height="48" className="-rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="#e2e8f0" strokeWidth="3" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={c.stroke} strokeWidth="3" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-700" />
      </svg>
      <span className={`absolute text-xs font-bold ${c.text}`}>{score}</span>
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

      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200">
          <div className="px-6 lg:px-10 py-5 flex items-center justify-between gap-4">
            <div className="pl-12 lg:pl-0">
              <h1 className="text-xl font-bold text-slate-900">Find Accommodations</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {filtered.length} verified listing{filtered.length !== 1 ? 's' : ''} available
                {smartMode && ' \u00b7 Sorted by compatibility'}
              </p>
            </div>
          </div>
        </header>

        <main className="px-6 lg:px-10 py-8">
          {/* Search + Smart toggle */}
          <div className="mb-8 flex flex-col sm:flex-row gap-3">
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
            <button
              onClick={() => setSmartMode(p => !p)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex-shrink-0 ${
                smartMode
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-600/25'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-600'
              }`}
            >
              <SparklesIcon className="h-4 w-4" />
              {smartMode ? 'Smart Match On' : 'Smart Match'}
            </button>
          </div>

          {smartMode && !loading && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <SparklesIcon className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-violet-900">Smart Match Active</p>
                  <p className="text-xs text-violet-600 mt-0.5">
                    Listings are ranked by compatibility with your lifestyle preferences and existing roommates.
                    {!accommodations[0]?.compatibility && ' Set up your preferences in your profile to get personalized matches.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <div className="w-10 h-10 border-[3px] border-slate-200 border-t-sky-600 rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium">{smartMode ? 'Finding best matches...' : 'Loading accommodations...'}</p>
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
                const compat = a.compatibility
                return (
                  <Link
                    to={`/seeker/accommodation/${a._id}`}
                    key={a._id}
                    className={`group bg-white rounded-2xl border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                      compat?.score >= 80 ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-slate-200'
                    }`}
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
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
                      {compat && (
                        <div className="absolute top-3 right-3">
                          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-1.5 shadow-lg">
                            <MiniScoreRing score={compat.score} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-xl font-bold text-slate-900">
                          ₹{a.price?.toLocaleString()}<span className="text-sm font-normal text-slate-400">/mo</span>
                        </p>
                        {compat?.roommateCount > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium flex-shrink-0">
                            <UserGroupIcon className="h-3 w-3" />{compat.roommateCount}
                          </span>
                        )}
                      </div>

                      {compat?.topInsight && (
                        <p className="text-xs text-violet-600 bg-violet-50 rounded-lg px-2.5 py-1.5 mb-2.5 line-clamp-2 font-medium">
                          {compat.topInsight}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                          <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{a.city}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                          <HomeModernIcon className="h-4 w-4 text-slate-400" />
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
        </main>
      </div>
    </div>
  )
}

export default SeekerDashboard
