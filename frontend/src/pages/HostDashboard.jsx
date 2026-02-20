import React from 'react'
import { Link } from 'react-router-dom'

function HostDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900">Host Dashboard</h1>
        <p className="text-slate-600 mt-2">Welcome to your host dashboard.</p>
        <Link
          to="/"
          className="inline-block mt-6 text-[#2363EB] hover:underline"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  )
}

export default HostDashboard
