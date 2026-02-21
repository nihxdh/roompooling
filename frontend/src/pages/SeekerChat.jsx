import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import {
  ChatBubbleLeftRightIcon,
  BuildingOffice2Icon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import SeekerSidebar from '../components/SeekerSidebar'
import ChatWindow from '../components/ChatWindow'

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL

function SeekerChat() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = localStorage.getItem('seekerToken')

  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeConv, setActiveConv] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showList, setShowList] = useState(true)

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/user/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setConversations(data.conversations || [])
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('seekerToken')
        navigate('/login/seeker', { replace: true })
      }
    } finally {
      setLoading(false)
    }
  }, [token, navigate])

  useEffect(() => {
    if (!token) { navigate('/login/seeker', { replace: true }); return }
    fetchConversations()
  }, [token, navigate, fetchConversations])

  useEffect(() => {
    const accId = searchParams.get('accommodation')
    const hostId = searchParams.get('host')
    if (accId && hostId && token) {
      axios.post(
        `${API_BASE}/api/user/conversations`,
        { hostId, accommodationId: accId },
        { headers: { Authorization: `Bearer ${token}` } }
      ).then(({ data }) => {
        setActiveConv(data.conversation)
        setShowList(false)
        fetchConversations()
      }).catch(() => {})
    }
  }, [searchParams, token, fetchConversations])

  const handleSelectConv = (conv) => {
    setActiveConv(conv)
    setShowList(false)
  }

  const fmtTime = (d) => {
    if (!d) return ''
    const dt = new Date(d)
    const now = new Date()
    const diff = now - dt
    if (diff < 86400000) {
      return dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }
    if (diff < 604800000) {
      return dt.toLocaleDateString('en-IN', { weekday: 'short' })
    }
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  if (!token) return null

  return (
    <div className="min-h-screen bg-slate-50">
      <SeekerSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="lg:pl-64 h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 lg:px-10 py-4">
          <div className="flex items-center gap-3 pl-10 lg:pl-0">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-sky-600" />
            <h1 className="text-lg font-bold text-slate-900">Messages</h1>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Conversation list */}
          <div className={`${activeConv && !showList ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-slate-200 bg-white`}>
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-sky-600 rounded-full animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 px-6 text-center">
                <ChatBubbleLeftRightIcon className="h-12 w-12 mb-3 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">No conversations yet</p>
                <p className="text-xs mt-1">Start a chat from an accommodation detail page</p>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1">
                {conversations.map(c => {
                  const isActive = activeConv?._id === c._id
                  return (
                    <button
                      key={c._id}
                      onClick={() => handleSelectConv(c)}
                      className={`w-full px-4 py-3.5 flex gap-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 ${
                        isActive ? 'bg-sky-50 border-l-2 border-l-sky-500' : ''
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <BuildingOffice2Icon className="h-5 w-5 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {c.host?.name || 'Host'}
                          </p>
                          <span className="text-[10px] text-slate-400 flex-shrink-0">{fmtTime(c.lastMessageAt)}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {c.accommodation?.name || 'Accommodation'}
                        </p>
                        {c.lastMessage && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">{c.lastMessage}</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Chat area */}
          <div className={`${!activeConv || showList ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-slate-50`}>
            {activeConv ? (
              <>
                {/* Chat header */}
                <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center gap-3">
                  <button
                    onClick={() => setShowList(true)}
                    className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                    <BuildingOffice2Icon className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{activeConv.host?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{activeConv.accommodation?.name}</p>
                  </div>
                </div>

                <ChatWindow
                  conversationId={activeConv._id}
                  token={token}
                  role="user"
                  apiPrefix="user"
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                Select a conversation to start chatting
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SeekerChat
