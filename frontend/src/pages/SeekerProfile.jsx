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
  KeyIcon,
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

  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

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

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    setPasswordSaving(true)
    try {
      await api().put('/api/user/password', {
        currentPassword: currentPassword || undefined,
        newPassword,
      })
      setSuccessMsg('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordForm(false)
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Failed to update password')
    } finally {
      setPasswordSaving(false)
    }
  }

  const openPasswordForm = () => {
    setShowPasswordForm(true)
    setPasswordError('')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const inputEdit = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:ring-2 focus:ring-[#8A7BF9]/20 focus:border-[#8A7BF9] outline-none transition-all'
  const inputRead = 'w-full px-3 py-2.5 rounded-xl border border-slate-100 bg-slate-50/80 text-sm text-slate-800 cursor-default font-medium'

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SeekerSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <SuccessModal message={successMsg} onClose={() => setSuccessMsg('')} />

      <div className="lg:pl-64">
        <main className="px-4 lg:px-8 py-8 max-w-2xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <div className="w-9 h-9 border-2 border-slate-200 border-t-[#8A7BF9] rounded-full animate-spin mb-3" />
              <p className="text-sm font-medium">Loading profile...</p>
            </div>
          ) : error ? (
            <div className="text-center py-24 text-red-500 text-sm">{error}</div>
          ) : profile ? (
            <div className="space-y-6">
              {saveError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-xs font-bold">!</span>
                  {saveError}
                </div>
              )}

              {/* Profile hero */}
              <div className="bg-gradient-to-br from-[#8A7BF9] to-[#B4A3FD] rounded-2xl p-5 lg:p-6 shadow-lg shadow-[#8A7BF9]/20">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/30">
                    <span className="text-lg font-bold text-white">{getInitials(profile.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold text-white truncate">{profile.name}</h1>
                    <p className="text-white/80 text-sm mt-0.5">{profile.email}</p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-white/90">
                        <BriefcaseIcon className="h-3.5 w-3.5" />
                        {profile.occupation || 'Other'}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-white/90">
                        <CalendarDaysIcon className="h-3.5 w-3.5" />
                        Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/20 border border-white/30 text-white text-xs font-semibold hover:bg-white/30 transition-all flex-shrink-0"
                    >
                      <PencilSquareIcon className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Fields card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="p-5 lg:p-6 space-y-4">
                  <h2 className="text-sm font-bold text-slate-900">Personal Information</h2>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-[#8A7BF9]/10 flex items-center justify-center">
                          <UserIcon className="h-3.5 w-3.5 text-[#8A7BF9]" />
                        </div>
                        Full Name
                      </label>
                      <input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} readOnly={!editing} className={editing ? inputEdit : inputRead} />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-[#8A7BF9]/10 flex items-center justify-center">
                          <EnvelopeIcon className="h-3.5 w-3.5 text-[#8A7BF9]" />
                        </div>
                        Email
                      </label>
                      <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} readOnly={!editing} className={editing ? inputEdit : inputRead} />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-[#8A7BF9]/10 flex items-center justify-center">
                          <PhoneIcon className="h-3.5 w-3.5 text-[#8A7BF9]" />
                        </div>
                        Phone
                      </label>
                      <input type="tel" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} readOnly={!editing} className={editing ? inputEdit : inputRead} />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-[#8A7BF9]/10 flex items-center justify-center">
                          <CalendarDaysIcon className="h-3.5 w-3.5 text-[#8A7BF9]" />
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
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                      <div className="w-6 h-6 rounded-lg bg-[#8A7BF9]/10 flex items-center justify-center">
                        <MapPinIcon className="h-3.5 w-3.5 text-[#8A7BF9]" />
                      </div>
                      Address
                    </label>
                    <input type="text" value={form.address} onChange={(e) => updateField('address', e.target.value)} readOnly={!editing} className={editing ? inputEdit : inputRead} />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-[#8A7BF9]/10 flex items-center justify-center">
                          <UserCircleIcon className="h-3.5 w-3.5 text-[#8A7BF9]" />
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
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-[#8A7BF9]/10 flex items-center justify-center">
                          <BriefcaseIcon className="h-3.5 w-3.5 text-[#8A7BF9]" />
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
                  <div className="px-5 lg:px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex items-center justify-end gap-2">
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Discard
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-[#8A7BF9] to-[#B4A3FD] text-white text-sm font-semibold hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-[#8A7BF9]/25"
                    >
                      {saving ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-4 w-4" />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Lifestyle Preferences */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-5 lg:p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#8A7BF9] to-[#B4A3FD] flex items-center justify-center shadow-md shadow-[#8A7BF9]/20">
                        <SparklesIcon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">Lifestyle Preferences</h2>
                        <p className="text-xs text-slate-400">Find your perfect roommate match</p>
                      </div>
                    </div>
                    {!prefsEditing ? (
                      <button
                        onClick={() => { setPrefsEditing(true); setPrefsForm({ ...prefs }) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8A7BF9]/10 text-[#8A7BF9] text-xs font-semibold hover:bg-[#8A7BF9]/20 transition-colors"
                      >
                        <PencilSquareIcon className="h-3.5 w-3.5" />
                        {Object.keys(prefs).filter(k => prefs[k] !== undefined && prefs[k] !== null && !(Array.isArray(prefs[k]) && prefs[k].length === 0)).length > 0 ? 'Edit' : 'Set Up'}
                      </button>
                    ) : null}
                  </div>

                  {prefsError && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs">{prefsError}</div>
                  )}

                  {!prefsEditing ? (
                    Object.keys(prefs).filter(k => prefs[k] !== undefined && prefs[k] !== null && !(Array.isArray(prefs[k]) && prefs[k].length === 0)).length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                          <SparklesIcon className="h-6 w-6 text-slate-300" />
                        </div>
                        <p className="text-slate-400 text-sm">No preferences set yet</p>
                        <p className="text-slate-300 text-xs mt-1">Set up preferences for smart roommate suggestions</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(PREF_OPTIONS).map(([key, { label }]) => {
                          const val = prefs[key]
                          if (!val) return null
                          return (
                            <div key={key} className="flex items-center justify-between py-1.5">
                              <span className="text-xs font-medium text-slate-500">{label}</span>
                              <span className="px-2.5 py-1 rounded-lg bg-[#8A7BF9]/10 text-[#8A7BF9] text-xs font-semibold">{val}</span>
                            </div>
                          )
                        })}
                        {prefs.languages?.length > 0 && (
                          <div className="pt-1.5">
                            <span className="text-xs font-medium text-slate-500">Languages</span>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {prefs.languages.map(l => (
                                <span key={l} className="px-2.5 py-1 rounded-lg bg-[#8A7BF9]/10 text-[#8A7BF9] text-xs font-medium">{l}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(PREF_OPTIONS).map(([key, { label, options }]) => (
                        <div key={key}>
                          <label className="text-xs font-semibold text-slate-600 mb-2 block">{label}</label>
                          <div className="flex flex-wrap gap-1.5">
                            {options.map(opt => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setPrefsForm(p => ({ ...p, [key]: p[key] === opt ? undefined : opt }))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                  prefsForm[key] === opt
                                    ? 'bg-gradient-to-r from-[#8A7BF9] to-[#B4A3FD] text-white border-transparent shadow-sm shadow-[#8A7BF9]/25'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-[#8A7BF9]/50 hover:text-[#8A7BF9]'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}

                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-2 block">Languages</label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={langInput}
                            onChange={e => setLangInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                            placeholder="Type and press Enter"
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-[#8A7BF9]/20 focus:border-[#8A7BF9] outline-none"
                          />
                          <button type="button" onClick={addLanguage} className="px-3 py-2 rounded-lg bg-[#8A7BF9]/10 text-[#8A7BF9] text-xs font-semibold hover:bg-[#8A7BF9]/20 transition-colors">Add</button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(prefsForm.languages || []).map(l => (
                            <span key={l} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#8A7BF9]/10 text-[#8A7BF9] text-xs font-medium">
                              {l}
                              <button type="button" onClick={() => removeLanguage(l)} className="hover:text-red-500 transition-colors">
                                <XMarkIcon className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {prefsEditing && (
                  <div className="px-5 lg:px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex items-center justify-end gap-2">
                    <button
                      onClick={() => { setPrefsEditing(false); setPrefsForm({ ...prefs }); setPrefsError('') }}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Discard
                    </button>
                    <button
                      onClick={savePreferences}
                      disabled={prefsSaving}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-[#8A7BF9] to-[#B4A3FD] text-white text-sm font-semibold hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-[#8A7BF9]/25"
                    >
                      {prefsSaving ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-4 w-4" />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Change Password */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-5 lg:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-[#8A7BF9]/10 flex items-center justify-center">
                        <KeyIcon className="h-4 w-4 text-[#8A7BF9]" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">Password</h2>
                        <p className="text-xs text-slate-400">Manage your account password</p>
                      </div>
                    </div>
                    {!showPasswordForm && (
                      <button
                        onClick={openPasswordForm}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8A7BF9]/10 text-[#8A7BF9] text-xs font-semibold hover:bg-[#8A7BF9]/20 transition-colors"
                      >
                        <KeyIcon className="h-3.5 w-3.5" />
                        Change
                      </button>
                    )}
                  </div>

                  {showPasswordForm && (
                    <form onSubmit={handleChangePassword} className="space-y-3">
                      {passwordError && (
                        <div className="p-2.5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs">{passwordError}</div>
                      )}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Current Password</label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-[#8A7BF9]/20 focus:border-[#8A7BF9] outline-none"
                          placeholder="Leave blank if never set"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={6}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-[#8A7BF9]/20 focus:border-[#8A7BF9] outline-none"
                          placeholder="Min 6 characters"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={6}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-[#8A7BF9]/20 focus:border-[#8A7BF9] outline-none"
                          placeholder="Re-enter new password"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => { setShowPasswordForm(false); setPasswordError('') }}
                          className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={passwordSaving}
                          className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-[#8A7BF9] to-[#B4A3FD] text-white text-sm font-semibold hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-[#8A7BF9]/25"
                        >
                          {passwordSaving ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <CheckIcon className="h-4 w-4" />
                              Update
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Delete */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-slate-200 bg-white/80">
                <p className="text-sm text-slate-500">Permanently delete your account</p>
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Delete
                  </button>
                ) : (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-2 rounded-lg text-slate-500 text-sm font-medium hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
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
