import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  UserCircleIcon,
  PencilSquareIcon,
  CheckIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarDaysIcon,
  BriefcaseIcon,
  UserIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import SeekerSidebar from '../components/SeekerSidebar'
import SuccessModal from '../components/SuccessModal'

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL

function SeekerProfile() {
  const navigate = useNavigate()
  const token = localStorage.getItem('seekerToken')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [prefs, setPrefs] = useState({})
  const [prefsForm, setPrefsForm] = useState({})
  const [prefsEditing, setPrefsEditing] = useState(false)
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [prefsError, setPrefsError] = useState('')
  const [langInput, setLangInput] = useState('')

  const api = useCallback(() => axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${token}` },
  }), [token])

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api().get('/api/user/profile')
      setProfile(data.user)
      setForm({
        name: data.user.name || '',
        email: data.user.email || '',
        phone: data.user.phone || '',
        address: data.user.address || '',
        dob: data.user.dob ? new Date(data.user.dob).toISOString().split('T')[0] : '',
        gender: data.user.gender || '',
        occupation: data.user.occupation || 'Other',
      })
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('seekerToken')
        navigate('/login/seeker', { replace: true })
        return
      }
      setError(err.response?.data?.error || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [api, navigate])

  const PREF_OPTIONS = {
    stayDuration: { label: 'Stay Duration', options: ['Short-term (<3 months)', 'Medium (3-6 months)', 'Long-term (6+ months)'] },
    foodPreference: { label: 'Food Preference', options: ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'No Preference'] },
    smoking: { label: 'Smoking', options: ['Smoker', 'Non-Smoker'] },
    drinking: { label: 'Drinking', options: ['Drinks', "Doesn't Drink"] },
    guestPolicy: { label: 'Guest Policy', options: ['Guests Welcome', 'Occasional Guests', 'No Guests'] },
    cleanlinessLevel: { label: 'Cleanliness', options: ['Very Clean', 'Moderate', 'Relaxed'] },
    noiseTolerance: { label: 'Noise Tolerance', options: ['Quiet', 'Moderate', 'Lively'] },
    workSchedule: { label: 'Work Schedule', options: ['Regular (9-5)', 'Flexible', 'Night Owl'] },
    wakeUpTime: { label: 'Wake-up Time', options: ['Early (Before 7 AM)', 'Morning (7-9 AM)', 'Late (After 9 AM)'] },
    sleepTime: { label: 'Sleep Time', options: ['Early (Before 10 PM)', 'Night (10 PM-12 AM)', 'Late Night (After 12 AM)'] },
    petPreference: { label: 'Pet Preference', options: ['Love Pets', 'Okay with Pets', 'No Pets'] },
    cookingHabits: { label: 'Cooking Habits', options: ['Cooks Daily', 'Sometimes', 'Rarely/Never'] },
    socialNature: { label: 'Social Nature', options: ['Introvert', 'Ambivert', 'Extrovert'] },
    sharingResponsibility: { label: 'Sharing', options: ['Happy to Share', 'Prefer Separate', 'Flexible'] },
  }

  const fetchPreferences = useCallback(async () => {
    try {
      const { data } = await api().get('/api/user/preferences')
      setPrefs(data.preferences || {})
      setPrefsForm(data.preferences || {})
    } catch { /* preferences not set yet */ }
  }, [api])

  const savePreferences = async () => {
    setPrefsSaving(true)
    setPrefsError('')
    try {
      const payload = { ...prefsForm }
      if (!payload.languages) payload.languages = []
      const { data } = await api().put('/api/user/preferences', payload)
      setPrefs(data.preferences)
      setPrefsForm(data.preferences)
      setPrefsEditing(false)
    } catch (err) {
      setPrefsError(err.response?.data?.message || 'Failed to save preferences')
    } finally {
      setPrefsSaving(false)
    }
  }

  const addLanguage = () => {
    const trimmed = langInput.trim()
    if (!trimmed) return
    const current = prefsForm.languages || []
    if (!current.includes(trimmed)) {
      setPrefsForm(p => ({ ...p, languages: [...current, trimmed] }))
    }
    setLangInput('')
  }

  const removeLanguage = (lang) => {
    setPrefsForm(p => ({ ...p, languages: (p.languages || []).filter(l => l !== lang) }))
  }

  useEffect(() => {
    if (!token) {
      navigate('/login/seeker', { replace: true })
      return
    }
    fetchProfile()
    fetchPreferences()
  }, [token, navigate, fetchProfile, fetchPreferences])

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    try {
      const { data } = await api().put('/api/user/profile', form)
      setProfile(data.user)
      setEditing(false)
      setSuccessMsg('Profile updated successfully!')
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api().delete('/api/user/profile')
      localStorage.removeItem('seekerToken')
      navigate('/', { replace: true })
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Failed to delete profile')
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setSaveError('')
    if (profile) {
      setForm({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        dob: profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : '',
        gender: profile.gender || '',
        occupation: profile.occupation || 'Other',
      })
    }
  }

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const inputEdit = 'w-full px-5 py-4 rounded-2xl border border-blue-200 bg-white text-base text-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all duration-200'
  const inputRead = 'w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 text-base text-slate-800 cursor-default font-medium'

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SeekerSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <SuccessModal message={successMsg} onClose={() => setSuccessMsg('')} />

      <div className="lg:pl-64">
        <main className="px-6 lg:px-12 py-12 max-w-3xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400">
              <div className="w-12 h-12 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin mb-5" />
              <p className="text-base font-medium">Loading profile...</p>
            </div>
          ) : error ? (
            <div className="text-center py-32 text-red-500">{error}</div>
          ) : profile ? (
            <div className="space-y-10">
              {saveError && (
                <div className="p-5 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-base flex items-center gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-sm font-bold">!</span>
                  {saveError}
                </div>
              )}

              {/* Profile hero */}
              <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-3xl p-8 lg:p-10 shadow-xl shadow-blue-600/20">
                <div className="flex items-center gap-6 pl-10 lg:pl-0">
                  <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/20">
                    <span className="text-2xl font-bold text-white">{getInitials(profile.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-white truncate">{profile.name}</h1>
                    <p className="text-blue-100 mt-1">{profile.email}</p>
                    <div className="flex flex-wrap gap-4 mt-3">
                      <span className="flex items-center gap-1.5 text-sm text-blue-200">
                        <BriefcaseIcon className="h-4 w-4" />
                        {profile.occupation || 'Other'}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm text-blue-200">
                        <CalendarDaysIcon className="h-4 w-4" />
                        Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-white text-sm font-semibold hover:bg-white/25 transition-all flex-shrink-0"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Fields card */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">
                <div className="p-8 lg:p-10 space-y-7">
                  <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        Full Name
                      </label>
                      <input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} readOnly={!editing} className={editing ? inputEdit : inputRead} />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                          <EnvelopeIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        Email
                      </label>
                      <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} readOnly={!editing} className={editing ? inputEdit : inputRead} />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                          <PhoneIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        Phone
                      </label>
                      <input type="tel" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} readOnly={!editing} className={editing ? inputEdit : inputRead} />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                          <CalendarDaysIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        Date of Birth
                      </label>
                      <input
                        type={editing ? 'date' : 'text'}
                        value={editing ? form.dob : (form.dob ? new Date(form.dob).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '—')}
                        onChange={(e) => updateField('dob', e.target.value)}
                        readOnly={!editing}
                        className={editing ? inputEdit : inputRead}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                        <MapPinIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      Address
                    </label>
                    <input type="text" value={form.address} onChange={(e) => updateField('address', e.target.value)} readOnly={!editing} className={editing ? inputEdit : inputRead} />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                          <UserCircleIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        Gender
                      </label>
                      {editing ? (
                        <select value={form.gender} onChange={(e) => updateField('gender', e.target.value)} className={inputEdit}>
                          <option value="" disabled>Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      ) : (
                        <input type="text" value={form.gender || '—'} readOnly className={inputRead} />
                      )}
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                          <BriefcaseIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        Occupation
                      </label>
                      {editing ? (
                        <select value={form.occupation} onChange={(e) => updateField('occupation', e.target.value)} className={inputEdit}>
                          <option value="Student">Student</option>
                          <option value="Employee">Employee</option>
                          <option value="Other">Other</option>
                        </select>
                      ) : (
                        <input type="text" value={form.occupation || '—'} readOnly className={inputRead} />
                      )}
                    </div>
                  </div>
                </div>

                {editing && (
                  <div className="px-8 lg:px-10 py-5 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl flex items-center justify-end gap-3">
                    <button
                      onClick={handleCancel}
                      className="px-6 py-3 rounded-xl text-base font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Discard
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-7 py-3 rounded-xl bg-blue-600 text-white text-base font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-blue-600/25"
                    >
                      {saving ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-5 w-5" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Lifestyle Preferences */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 lg:p-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                        <SparklesIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Lifestyle Preferences</h2>
                        <p className="text-sm text-slate-400">Help us find your perfect roommate match</p>
                      </div>
                    </div>
                    {!prefsEditing ? (
                      <button
                        onClick={() => { setPrefsEditing(true); setPrefsForm({ ...prefs }) }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-50 text-violet-600 text-sm font-semibold hover:bg-violet-100 transition-colors"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                        {Object.keys(prefs).filter(k => prefs[k] !== undefined && prefs[k] !== null && !(Array.isArray(prefs[k]) && prefs[k].length === 0)).length > 0 ? 'Edit' : 'Set Up'}
                      </button>
                    ) : null}
                  </div>

                  {prefsError && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{prefsError}</div>
                  )}

                  {!prefsEditing ? (
                    Object.keys(prefs).filter(k => prefs[k] !== undefined && prefs[k] !== null && !(Array.isArray(prefs[k]) && prefs[k].length === 0)).length === 0 ? (
                      <div className="text-center py-10">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                          <SparklesIcon className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="text-slate-400 text-base">No preferences set yet</p>
                        <p className="text-slate-300 text-sm mt-1">Set up your lifestyle preferences to get smart roommate suggestions</p>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {Object.entries(PREF_OPTIONS).map(([key, { label }]) => {
                          const val = prefs[key]
                          if (!val) return null
                          return (
                            <div key={key} className="flex items-center justify-between py-2">
                              <span className="text-sm font-medium text-slate-500">{label}</span>
                              <span className="px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 text-sm font-semibold">{val}</span>
                            </div>
                          )
                        })}
                        {prefs.languages?.length > 0 && (
                          <div className="pt-2">
                            <span className="text-sm font-medium text-slate-500">Languages</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {prefs.languages.map(l => (
                                <span key={l} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium">{l}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(PREF_OPTIONS).map(([key, { label, options }]) => (
                        <div key={key}>
                          <label className="text-sm font-semibold text-slate-600 mb-2.5 block">{label}</label>
                          <div className="flex flex-wrap gap-2">
                            {options.map(opt => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setPrefsForm(p => ({ ...p, [key]: p[key] === opt ? undefined : opt }))}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                                  prefsForm[key] === opt
                                    ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-600/25'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}

                      <div>
                        <label className="text-sm font-semibold text-slate-600 mb-2.5 block">Languages</label>
                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            value={langInput}
                            onChange={e => setLangInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                            placeholder="Type a language and press Enter"
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none"
                          />
                          <button type="button" onClick={addLanguage} className="px-4 py-2.5 rounded-xl bg-violet-100 text-violet-700 text-sm font-semibold hover:bg-violet-200 transition-colors">Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(prefsForm.languages || []).map(l => (
                            <span key={l} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium">
                              {l}
                              <button type="button" onClick={() => removeLanguage(l)} className="hover:text-red-500 transition-colors">
                                <XMarkIcon className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {prefsEditing && (
                  <div className="px-8 lg:px-10 py-5 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl flex items-center justify-end gap-3">
                    <button
                      onClick={() => { setPrefsEditing(false); setPrefsForm({ ...prefs }); setPrefsError('') }}
                      className="px-6 py-3 rounded-xl text-base font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Discard
                    </button>
                    <button
                      onClick={savePreferences}
                      disabled={prefsSaving}
                      className="flex items-center gap-2 px-7 py-3 rounded-xl bg-violet-600 text-white text-base font-semibold hover:bg-violet-700 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-violet-600/25"
                    >
                      {prefsSaving ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-5 w-5" />
                          Save Preferences
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Delete */}
              <div className="flex items-center justify-between p-6 rounded-2xl border border-dashed border-slate-200 bg-white/50">
                <p className="text-base text-slate-500">Permanently delete your account</p>
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-base font-medium text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                  >
                    <TrashIcon className="h-5 w-5" />
                    Delete
                  </button>
                ) : (
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2.5 rounded-xl text-slate-500 text-base font-medium hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-base font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {deleting ? 'Deleting...' : 'Confirm'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  )
}

export default SeekerProfile
