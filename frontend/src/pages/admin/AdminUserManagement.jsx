import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  UsersIcon,
  XMarkIcon,
  XCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  KeyIcon,
} from '@heroicons/react/24/outline'

const API_BASE = import.meta.env.VITE_API_BASE_URL

function AdminUserManagement() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [error, setError] = useState('')
  const [userModal, setUserModal] = useState(null) // null | 'create' | { mode: 'edit', user }
  const [userForm, setUserForm] = useState({
    name: '', email: '', phone: '', address: '', dob: '', gender: '', occupation: 'Other', password: ''
  })
  const [userFormLoading, setUserFormLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [passwordTarget, setPasswordTarget] = useState(null) // { id, name }
  const [newPassword, setNewPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  const token = localStorage.getItem('adminToken')
  const api = useCallback(() => axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${token}` },
  }), [token])

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true)
    setError('')
    try {
      const { data } = await api().get('/api/admin/users')
      setUsers(data.users || [])
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken')
        navigate('/login/admin', { replace: true })
        return
      }
      setError(err.response?.data?.error || 'Failed to load users')
    } finally {
      setUsersLoading(false)
    }
  }, [api, navigate])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  const openCreateUser = () => {
    setUserForm({ name: '', email: '', phone: '', address: '', dob: '', gender: '', occupation: 'Other', password: '' })
    setUserModal('create')
  }

  const openEditUser = (u) => {
    setUserForm({
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      address: u.address || '',
      dob: u.dob ? new Date(u.dob).toISOString().slice(0, 10) : '',
      gender: u.gender || '',
      occupation: u.occupation || 'Other'
    })
    setUserModal({ mode: 'edit', user: u })
  }

  const closeUserModal = () => {
    setUserModal(null)
    setUserForm({ name: '', email: '', phone: '', address: '', dob: '', gender: '', occupation: 'Other', password: '' })
  }

  const handleUserSubmit = async (e) => {
    e.preventDefault()
    if (!userForm.name || !userForm.email || !userForm.phone || !userForm.address || !userForm.dob || !userForm.gender) {
      setError('Name, email, phone, address, DOB and gender are required')
      return
    }
    if (userModal === 'create' && userForm.password && userForm.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setUserFormLoading(true)
    setError('')
    try {
      if (userModal === 'create') {
        const payload = { ...userForm }
        if (!payload.password) delete payload.password
        const { data } = await api().post('/api/admin/users', payload)
        setUsers(prev => [data.user, ...prev])
      } else {
        const { data } = await api().put(`/api/admin/users/${userModal.user._id}`, userForm)
        setUsers(prev => prev.map(u => u._id === data.user._id ? data.user : u))
      }
      closeUserModal()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save user')
    } finally {
      setUserFormLoading(false)
    }
  }

  const handleSetPassword = async (e) => {
    e.preventDefault()
    if (!passwordTarget || !newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setPasswordLoading(true)
    setError('')
    try {
      await api().put(`/api/admin/users/${passwordTarget.id}/password`, { newPassword })
      setPasswordTarget(null)
      setNewPassword('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setError('')
    try {
      await api().delete(`/api/admin/users/${deleteTarget.id}`)
      setUsers(prev => prev.filter(u => u._id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="p-6 md:p-8 pt-16 md:pt-8">
      <div className="max-w-6xl mx-auto">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-center gap-2">
            <XCircleIcon className="h-5 w-5 flex-shrink-0" />
            {error}
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-slate-900">User Management</h1>
          <button
            onClick={openCreateUser}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Add User
          </button>
        </div>

        {usersLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mb-4" />
            <p className="text-sm">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white rounded-xl border border-slate-200">
            <UsersIcon className="h-12 w-12 mb-3 text-slate-300" />
            <p className="text-sm font-medium">No users found</p>
            <p className="text-xs mt-1">Add users to get started</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Occupation</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-900">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.gender} &middot; DOB {fmtDate(u.dob)}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-700 text-sm">{u.email}</td>
                      <td className="px-5 py-4 text-slate-700 text-sm">{u.phone}</td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {u.occupation || 'Other'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setPasswordTarget({ id: u._id, name: u.name }); setNewPassword(''); setError('') }}
                            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="Set/Change Password"
                          >
                            <KeyIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditUser(u)}
                            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="Edit"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ id: u._id, name: u.name })}
                            className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {userModal && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={closeUserModal}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {userModal === 'create' ? 'Add User' : 'Edit User'}
              </h3>
              <button onClick={closeUserModal} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={e => setUserForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
                <input
                  type="text"
                  value={userForm.address}
                  onChange={e => setUserForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  value={userForm.dob}
                  onChange={e => setUserForm(f => ({ ...f, dob: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender *</label>
                <select
                  value={userForm.gender}
                  onChange={e => setUserForm(f => ({ ...f, gender: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                  required
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Occupation</label>
                <select
                  value={userForm.occupation}
                  onChange={e => setUserForm(f => ({ ...f, occupation: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                >
                  <option value="Student">Student</option>
                  <option value="Employee">Employee</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {userModal === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password (optional)</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))}
                    minLength={6}
                    placeholder="At least 6 characters"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                  />
                  <p className="text-slate-400 text-xs mt-1">Leave blank to let user set later via profile</p>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeUserModal}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userFormLoading}
                  className="flex-1 px-4 py-2.5 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50"
                >
                  {userFormLoading ? 'Saving...' : userModal === 'create' ? 'Create User' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Password Modal */}
      {passwordTarget && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => { setPasswordTarget(null); setNewPassword('') }}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-slate-800 mb-4">
              <div className="p-2 rounded-full bg-slate-100">
                <KeyIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">Set Password</h3>
            </div>
            <p className="text-slate-600 text-sm mb-4">
              Set a new password for <span className="font-semibold text-slate-900">{passwordTarget.name}</span>
            </p>
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setPasswordTarget(null); setNewPassword('') }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading || newPassword.length < 6}
                  className="flex-1 px-4 py-2.5 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50"
                >
                  {passwordLoading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2 rounded-full bg-red-50">
                <TrashIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">Delete User</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete <span className="font-semibold text-slate-900">{deleteTarget.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUserManagement
