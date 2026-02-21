import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import HostLoginPage from './pages/login/HostLoginPage'
import SeekerLoginPage from './pages/login/SeekerLoginPage'
import AdminLoginPage from './pages/login/AdminLoginPage'
import AdminDashboard from './pages/AdminDashboard'
import HostDashboard from './pages/HostDashboard'
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
        <Route path="/login/seeker" element={<SeekerLoginPage />} />
        <Route path="/seeker/dashboard" element={<SeekerDashboard />} />
        <Route path="/seeker/profile" element={<SeekerProfile />} />
        <Route path="/seeker/bookings" element={<SeekerBookings />} />
        <Route path="/seeker/chat" element={<SeekerChat />} />
        <Route path="/seeker/accommodation/:id" element={<SeekerAccommodationDetail />} />
        <Route path="/login/admin" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
