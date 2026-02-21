import React, { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import axios from 'axios'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL

function ChatWindow({ conversationId, token, role, apiPrefix }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [otherTyping, setOtherTyping] = useState(false)
  const socketRef = useRef(null)
  const bottomRef = useRef(null)
  const typingTimer = useRef(null)

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return
    setLoading(true)
    try {
      const { data } = await axios.get(
        `${API_BASE}/api/${apiPrefix}/conversations/${conversationId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessages(data.messages || [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [conversationId, token, apiPrefix])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages, otherTyping])

  useEffect(() => {
    if (!conversationId || !token) return

    const socket = io(API_BASE, { auth: { token } })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join_conversation', conversationId)
    })

    socket.on('new_message', (msg) => {
      if (msg.conversation === conversationId) {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev
          return [...prev, msg]
        })
        setOtherTyping(false)
      }
    })

    socket.on('user_typing', ({ conversationId: cId, role: r }) => {
      if (cId === conversationId && r !== role) setOtherTyping(true)
    })

    socket.on('user_stop_typing', ({ conversationId: cId, role: r }) => {
      if (cId === conversationId && r !== role) setOtherTyping(false)
    })

    return () => {
      socket.emit('leave_conversation', conversationId)
      socket.disconnect()
      socketRef.current = null
    }
  }, [conversationId, token, role])

  const handleTyping = () => {
    socketRef.current?.emit('typing', { conversationId })
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit('stop_typing', { conversationId })
    }, 1500)
  }

  const handleSend = (e) => {
    e.preventDefault()
    if (!text.trim() || !socketRef.current) return
    setSending(true)
    socketRef.current.emit('send_message', { conversationId, text: text.trim() })
    socketRef.current.emit('stop_typing', { conversationId })
    setText('')
    setSending(false)
  }

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Select a conversation to start chatting
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-sky-600 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-10">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderRole === role
            return (
              <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-sky-600 text-white rounded-br-md'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-sky-200' : 'text-slate-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })
        )}

        {otherTyping && (
          <div className="flex justify-start">
            <div className="px-4 py-2.5 rounded-2xl rounded-bl-md bg-white border border-slate-200 text-slate-400 text-sm">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleSend} className="border-t border-slate-200 px-4 py-3 flex gap-2 bg-white">
        <input
          type="text"
          value={text}
          onChange={(e) => { setText(e.target.value); handleTyping() }}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <PaperAirplaneIcon className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}

export default ChatWindow
