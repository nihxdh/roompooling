import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  ChatBubbleLeftRightIcon,
  UserIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import ChatWindow from '../components/ChatWindow'
import HostSidebar from '../components/HostSidebar'

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL

function HostMessages() {
  const navigate = useNavigate()
  const token = localStorage.getItem('hostToken')
  const authHeaders = { Authorization: `Bearer ${token}` }

  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeConv, setActiveConv] = useState(null)
  const [showList, setShowList] = useState(true)

  const fetchConversations = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${API_BASE}/api/host/conversations`, { headers: authHeaders })
      setConversations(data.conversations || [])
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('hostToken')
        navigate('/login/host', { replace: true })
      }
    } finally {
      setLoading(false)
    }
  }, [token, navigate])

  useEffect(() => {
    if (!token) { navigate('/login/host', { replace: true }); return }
    fetchConversations()
  }, [token, fetchConversations])

  if (!token) return null

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <HostSidebar />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Page header */}
        <div className="bg-white border-b border-slate-200/80 px-6 py-4 md:px-8 flex items-center gap-3">
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-[#2363EB]" />
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Messages</h1>
            <p className="text-xs text-slate-400">Conversations with seekers</p>
          </div>
        </div>

        {/* Chat layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Conversation list */}
          <div className={`${activeConv && !showList ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-slate-200 bg-white`}>
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-[#2363EB] rounded-full animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 px-6 text-center">
                <ChatBubbleLeftRightIcon className="h-10 w-10 mb-3 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">No messages yet</p>
                <p className="text-xs mt-1 text-slate-400">Seeker messages will appear here</p>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1">
                {conversations.map(c => {
                  const isActive = activeConv?._id === c._id
                  return (
                    <button key={c._id} onClick={() => { setActiveConv(c); setShowList(false) }}
                      className={`w-full px-4 py-3.5 flex gap-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 ${
                        isActive ? 'bg-blue-50/70 border-l-2 border-l-[#2363EB]' : ''
                      }`}>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="h-4 w-4 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900 truncate">{c.seeker?.name || 'Seeker'}</p>
                          <span className="text-[10px] text-slate-400 flex-shrink-0">
                            {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{c.accommodation?.name || 'Accommodation'}</p>
                        {c.lastMessage && <p className="text-xs text-slate-400 truncate mt-0.5">{c.lastMessage}</p>}
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
                <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center gap-3">
                  <button onClick={() => setShowList(true)} className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                    <ArrowLeftIcon className="h-4 w-4" />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{activeConv.seeker?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{activeConv.accommodation?.name}</p>
                  </div>
                </div>
                <ChatWindow conversationId={activeConv._id} token={token} role="host" apiPrefix="host" />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <ChatBubbleLeftRightIcon className="h-10 w-10 mb-3 text-slate-200" />
                <p className="text-sm">Select a conversation to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HostMessages
