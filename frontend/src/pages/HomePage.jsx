import React from 'react'
import { Link } from 'react-router-dom'
import {
  BuildingOffice2Icon,
  UserIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'

function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center bg-slate-50 px-6 py-16">
      <main className="w-full max-w-4xl flex-1 flex flex-col justify-center">
        <section className="w-full text-center mb-16">
          <p className="animate-slide-up text-base font-semibold text-[#2363EB] uppercase tracking-widest mb-4">
            Room sharing platform
          </p>
          <h1 className="animate-slide-up-delay-1 text-5xl sm:text-6xl font-bold text-slate-900 tracking-tight mb-5">
            Welcome to <span className="text-[#2363EB]">Room Polling</span>
          </h1>
          <p className="animate-slide-up-delay-2 text-slate-600 text-xl max-w-2xl mx-auto">
            Connect with the right spaces. Whether you&apos;re looking to share your room or find one, we bring hosts and seekers together.
          </p>
        </section>

        {/* Login options */}
        <section className="w-full max-w-xl mx-auto animate-slide-up-delay-3">
          <div className="grid grid-cols-2 gap-6">
            <Link
              to="/login/host"
              className="flex flex-col items-center gap-4 p-10 bg-[#2363EB] rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
            >
              <BuildingOffice2Icon className="h-16 w-16 text-white" />
              <span className="text-lg font-medium text-white">Login as Host</span>
            </Link>

            <Link
              to="/login/seeker"
              className="flex flex-col items-center gap-4 p-10 bg-[#2363EB] rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
            >
              <UserIcon className="h-16 w-16 text-white" />
              <span className="text-lg font-medium text-white">Login as Seeker</span>
            </Link>
          </div>
        </section>
      </main>

      <blockquote className="text-slate-500 italic text-center py-8 animate-slide-up-delay-4">
        &ldquo;Find your place. Share your space.&rdquo;
      </blockquote>

      <div className="w-full flex justify-center pb-8 animate-slide-up-delay-5">
        <Link
          to="/login/admin"
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-[#2363EB] text-[#2363EB] font-medium hover:bg-[#2363EB] hover:text-white hover:scale-105 transition-all duration-300 cursor-pointer"
        >
          <Cog6ToothIcon className="h-5 w-5" />
          Admin Login
        </Link>
      </div>
    </div>
  )
}

export default HomePage
