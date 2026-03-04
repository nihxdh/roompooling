import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  UserIcon,
  PencilSquareIcon,
  CheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarDaysIcon,
  KeyIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline'
import HostSidebar from '../components/HostSidebar'
import SuccessModal from '../components/SuccessModal'

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || ''

function HostProfile() {
  const navigate = useNavigate()
  const token = localStorage.getItem('hostToken')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

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
      const { data } = await api().get('/api/host/profile')
      setProfile(data.host)
      setForm({
        name: data.host.name || '',
        email: data.host.email || '',
        phone: data.host.phone || '',
      })
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('hostToken')
        navigate('/login/host', { replace: true })
        return
      }
      setError(err.response?.data?.error || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [api, navigate])

  useEffect(() => {
    if (!token) {
      navigate('/login/host', { replace: true })
      return
    }
    fetchProfile()
  }, [token, navigate, fetchProfile])

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    try {
      const { data } = await api().put('/api/host/profile', form)
      setProfile(data.host)
      setEditing(false)
      setSuccessMsg('Profile updated successfully!')
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
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
      await api().put('/api/host/password', {
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

  const inputEdit = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:ring-2 focus:ring-[#595AFD]/20 focus:border-[#595AFD] outline-none transition-all'
  const inputRead = 'w-full px-3 py-2.5 rounded-xl border border-slate-100 bg-slate-50/80 text-sm text-slate-800 cursor-default font-medium'

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (!token) return null

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <HostSidebar />
      <SuccessModal message={successMsg} onClose={() => setSuccessMsg('')} />
      <div className="flex-1 min-w-0 overflow-auto">
        <div className="bg-white border-b border-slate-200/80 px-6 py-5 md:px-8">
          <h1 className="text-lg font-bold text-slate-900">Profile</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage your account details</p>
        </div>
        <main className="px-6 py-6 md:px-8 max-w-2xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <div className="w-9 h-9 border-2 border-slate-200 border-t-[#595AFD] rounded-full animate-spin mb-3" />
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
              <div className="bg-gradient-to-br from-[#595AFD] to-[#7F83FD] rounded-2xl p-5 lg:p-6 shadow-lg shadow-[#595AFD]/20">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/30">
                    <span className="text-lg font-bold text-white">{getInitials(profile.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold text-white truncate">{profile.name}</h1>
                    <p className="text-white/80 text-sm mt-0.5">{profile.email}</p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-white/90">
                        <BuildingOffice2Icon className="h-3.5 w-3.5" />
                        Host
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

              {/* Profile details card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="p-5 lg:p-6 space-y-4">
                  <h2 className="text-sm font-bold text-slate-900">Profile Details</h2>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                      <div className="w-6 h-6 rounded-lg bg-[#595AFD]/10 flex items-center justify-center">
                        <UserIcon className="h-3.5 w-3.5 text-[#595AFD]" />
                      </div>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      readOnly={!editing}
                      className={editing ? inputEdit : inputRead}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                      <div className="w-6 h-6 rounded-lg bg-[#595AFD]/10 flex items-center justify-center">
                        <EnvelopeIcon className="h-3.5 w-3.5 text-[#595AFD]" />
                      </div>
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      readOnly={!editing}
                      className={editing ? inputEdit : inputRead}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                      <div className="w-6 h-6 rounded-lg bg-[#595AFD]/10 flex items-center justify-center">
                        <PhoneIcon className="h-3.5 w-3.5 text-[#595AFD]" />
                      </div>
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      readOnly={!editing}
                      className={editing ? inputEdit : inputRead}
                    />
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
                      className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#595AFD] text-white text-sm font-semibold hover:bg-[#4B4CE6] active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-[#595AFD]/25"
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

              {/* Change Password */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-5 lg:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-[#595AFD]/10 flex items-center justify-center">
                        <KeyIcon className="h-4 w-4 text-[#595AFD]" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">Password</h2>
                        <p className="text-xs text-slate-400">Update your account password</p>
                      </div>
                    </div>
                    {!showPasswordForm && (
                      <button
                        onClick={openPasswordForm}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#595AFD]/10 text-[#595AFD] text-xs font-semibold hover:bg-[#595AFD]/20 transition-colors"
                      >
                        <KeyIcon className="h-3.5 w-3.5" />
                        Change Password
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
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-[#595AFD]/20 focus:border-[#595AFD] outline-none"
                          placeholder="Enter current password"
                        />
                        <p className="text-slate-400 text-xs mt-1">Leave blank if you never set a password</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={6}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-[#595AFD]/20 focus:border-[#595AFD] outline-none"
                          placeholder="Min 6 characters"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm New Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={6}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-[#595AFD]/20 focus:border-[#595AFD] outline-none"
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
                          className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#595AFD] text-white text-sm font-semibold hover:bg-[#4B4CE6] active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-[#595AFD]/25"
                        >
                          {passwordSaving ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <CheckIcon className="h-4 w-4" />
                              Update Password
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  )
}

export default HostProfile
