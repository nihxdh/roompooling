import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import HostLoginPage from './pages/login/HostLoginPage'
import SeekerLoginPage from './pages/login/SeekerLoginPage'
import AdminLoginPage from './pages/login/AdminLoginPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminBookings from './pages/admin/AdminBookings'
import AdminUserManagement from './pages/admin/AdminUserManagement'
import AdminHostManagement from './pages/admin/AdminHostManagement'
import HostDashboard from './pages/HostDashboard'
import HostAccommodationDetail from './pages/HostAccommodationDetail'
import HostBookings from './pages/HostBookings'
import HostMessages from './pages/HostMessages'
import HostProfile from './pages/HostProfile'
import SeekerDashboard from './pages/SeekerDashboard'
import SeekerProfile from './pages/SeekerProfile'
import SeekerBookings from './pages/SeekerBookings'
import SeekerChat from './pages/SeekerChat'
import SeekerAccommodationDetail from './pages/SeekerAccommodationDetail'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login/host" element={<HostLoginPage />} />
        <Route path="/host/dashboard" element={<HostDashboard />} />
        <Route path="/host/accommodation/:id" element={<HostAccommodationDetail />} />
        <Route path="/host/bookings" element={<HostBookings />} />
        <Route path="/host/messages" element={<HostMessages />} />
        <Route path="/host/profile" element={<HostProfile />} />
        <Route path="/login/seeker" element={<SeekerLoginPage />} />
        <Route path="/seeker/dashboard" element={<SeekerDashboard />} />
        <Route path="/seeker/profile" element={<SeekerProfile />} />
        <Route path="/seeker/bookings" element={<SeekerBookings />} />
        <Route path="/seeker/chat" element={<SeekerChat />} />
        <Route path="/seeker/accommodation/:id" element={<SeekerAccommodationDetail />} />
        <Route path="/login/admin" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="hosts" element={<AdminHostManagement />} />
          <Route path="users" element={<AdminUserManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
