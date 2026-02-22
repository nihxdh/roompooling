import React from 'react'
import { Link } from 'react-router-dom'
import {
  BuildingOffice2Icon,
  UserIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import homeBackground from '../assets/homeBackground.png'
import logo from '../assets/logoRoomPooling.png'

function HomePage() {
  return (
    <div className="h-screen flex flex-col items-center bg-slate-50 px-6 pt-1 pb-6 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none"
        style={{ backgroundImage: `url(${homeBackground})` }}
      />

      <main className="w-full max-w-4xl flex-1 flex flex-col justify-center relative z-10">
        <section className="w-full flex flex-col items-center text-center mb-8">
          <img
            src={logo}
            alt="Room Pooling"
            className="animate-slide-up h-20 w-20 object-contain mb-4"
          />
          <p className="animate-slide-up text-sm font-semibold text-black/50 uppercase tracking-[0.25em] mb-2">
            Room sharing platform
          </p>
          <h1
            className="animate-slide-up-delay-1 text-5xl sm:text-6xl text-slate-900 tracking-tight mb-3"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}
          >
            Room Pooling
          </h1>
          <p className="animate-slide-up-delay-2 text-slate-500 text-base max-w-lg mx-auto leading-relaxed">
            Connect with the right spaces. Whether you&apos;re looking to share your room or find one, we bring hosts and seekers together.
          </p>
        </section>

        <section className="w-full max-w-md mx-auto animate-slide-up-delay-3">
          <div className="grid grid-cols-2 gap-5">
            <Link
              to="/login/host"
              className="group flex flex-col items-center gap-3 p-8 bg-transparent border-2 border-black rounded-2xl hover:bg-black hover:text-white transition-all duration-300 cursor-pointer"
            >
              <BuildingOffice2Icon className="h-12 w-12 text-black group-hover:text-white transition-colors duration-300" />
              <span className="text-base font-semibold text-black group-hover:text-white transition-colors duration-300">
                Login as Host
              </span>
            </Link>

            <Link
              to="/login/seeker"
              className="group flex flex-col items-center gap-3 p-8 bg-transparent border-2 border-black rounded-2xl hover:bg-black hover:text-white transition-all duration-300 cursor-pointer"
            >
              <UserIcon className="h-12 w-12 text-black group-hover:text-white transition-colors duration-300" />
              <span className="text-base font-semibold text-black group-hover:text-white transition-colors duration-300">
                Login as Seeker
              </span>
            </Link>
          </div>
        </section>
      </main>

      <footer className="w-full flex flex-col items-center gap-3 pb-4 relative z-10">
        <blockquote className="text-slate-400 italic text-sm text-center animate-slide-up-delay-4">
          &ldquo;Find your place. Share your space.&rdquo;
        </blockquote>
        <Link
          to="/login/admin"
          className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-black text-black text-sm font-medium hover:bg-black hover:text-white hover:scale-105 transition-all duration-300 cursor-pointer animate-slide-up-delay-5"
        >
          <ShieldCheckIcon className="h-4 w-4" />
          Admin Login
        </Link>
      </footer>
    </div>
  )
}

export default HomePage
