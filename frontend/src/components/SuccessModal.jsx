import React, { useEffect } from 'react'

function SuccessModal({ message, onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => {
      onClose?.()
    }, duration)
    return () => clearTimeout(timer)
  }, [message, duration, onClose])

  if (!message) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 animate-modal-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center animate-modal-scale-in">
        {/* Animated tick circle */}
        <div className="mx-auto mb-5 w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
          <svg
            className="w-20 h-20"
            viewBox="0 0 80 80"
            fill="none"
          >
            {/* Circle */}
            <circle
              cx="40"
              cy="40"
              r="34"
              stroke="#10b981"
              strokeWidth="3"
              fill="none"
              className="animate-circle-draw"
              strokeLinecap="round"
            />
            {/* Checkmark */}
            <path
              d="M25 42 L35 52 L55 30"
              stroke="#10b981"
              strokeWidth="3.5"
              fill="none"
              className="animate-tick-draw"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-2">Success!</h3>
        <p className="text-slate-600 text-sm leading-relaxed">{message}</p>

        <button
          onClick={onClose}
          className="mt-6 px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  )
}

export default SuccessModal
