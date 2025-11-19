'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSocket } from '@/contexts/SocketContext'
import { useSearchParams } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Send, MessageCircle, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Message {
  _id: string
  conversationId: string
  sender: {
    _id: string
    name: string
    email: string
    image?: string
  }
  receiver: {
    _id: string
    name: string
    email: string
    image?: string
  }
  content: string
  messageType: string
  isRead: boolean
  createdAt: string
}

interface Conversation {
  _id: string
  participants: Array<{
    _id: string
    name: string
    email: string
    image?: string
  }>
  lastMessage?: {
    _id: string
    content: string
    createdAt: string
  }
  item?: {
    _id: string
    title: string
    images: string[]
  }
  unreadCount: number
  updatedAt: string
}

function MessagesContent() {
  const { data: session } = useSession()
  const { socket, isConnected } = useSocket()
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [typing, setTyping] = useState<{ userId: string; userName: string } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const userId = (session?.user as any)?.id

  // Start conversation from query params
  useEffect(() => {
    const startNewConversation = async () => {
      const itemId = searchParams.get('item')
      const ownerId = searchParams.get('owner')
      
      if (!itemId || !ownerId || !session) return

      try {
        const response = await fetch('/api/messages/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantId: ownerId,
            itemId,
          }),
        })

        const data = await response.json()
        if (data.success) {
          setSelectedConversation(data.conversation)
          // Refresh conversations list
          const conversationsResponse = await fetch('/api/messages/conversations')
          const conversationsData = await conversationsResponse.json()
          if (conversationsData.success) {
            setConversations(conversationsData.conversations)
          }
        }
      } catch (error) {
        console.error('Error starting conversation:', error)
      }
    }

    if (session) {
      startNewConversation()
    }
  }, [searchParams, session])

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/messages/conversations')
        const data = await response.json()
        if (data.success) {
          setConversations(data.conversations)
        }
      } catch (error) {
        console.error('Error fetching conversations:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchConversations()
    }
  }, [session])

  // Fetch messages when conversation is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation) return

      try {
        const response = await fetch(`/api/messages/${selectedConversation._id}`)
        const data = await response.json()
        if (data.success) {
          setMessages(data.messages)
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
      }
    }

    fetchMessages()
  }, [selectedConversation])

  // Socket.io event listeners
  useEffect(() => {
    if (!socket || !selectedConversation) return

    // Join conversation room
    socket.emit('join-conversation', selectedConversation._id)

    // Listen for new messages
    const handleNewMessage = (message: Message) => {
      if (message.conversationId === selectedConversation._id) {
        setMessages((prev) => [...prev, message])
      }
    }

    // Listen for typing indicators
    const handleUserTyping = (data: { userId: string; userName: string }) => {
      if (data.userId !== userId) {
        setTyping(data)
      }
    }

    const handleUserStoppedTyping = () => {
      setTyping(null)
    }

    socket.on('new-message', handleNewMessage)
    socket.on('user-typing', handleUserTyping)
    socket.on('user-stopped-typing', handleUserStoppedTyping)

    return () => {
      socket.off('new-message', handleNewMessage)
      socket.off('user-typing', handleUserTyping)
      socket.off('user-stopped-typing', handleUserStoppedTyping)
      socket.emit('leave-conversation', selectedConversation._id)
    }
  }, [socket, selectedConversation, userId])

  // Listen for message notifications (when in another conversation)
  useEffect(() => {
    if (!socket) return

    const handleMessageNotification = (data: {
      conversationId: string
      message: Message
    }) => {
      // Update conversation list
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === data.conversationId
            ? {
                ...conv,
                lastMessage: {
                  _id: data.message._id,
                  content: data.message.content,
                  createdAt: data.message.createdAt,
                },
                unreadCount: conv._id === selectedConversation?._id ? conv.unreadCount : conv.unreadCount + 1,
              }
            : conv
        )
      )
    }

    socket.on('message-notification', handleMessageNotification)

    return () => {
      socket.off('message-notification', handleMessageNotification)
    }
  }, [socket, selectedConversation])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !socket) return

    setSending(true)
    try {
      const response = await fetch(`/api/messages/${selectedConversation._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageInput.trim() }),
      })

      const data = await response.json()
      if (data.success) {
        // Add message to local state
        setMessages((prev) => [...prev, data.message])
        setMessageInput('')

        // Emit through socket
        const receiverId = selectedConversation.participants.find(
          (p) => p._id !== userId
        )?._id

        socket.emit('send-message', {
          conversationId: selectedConversation._id,
          message: data.message,
          receiverId,
        })

        // Update conversation list
        setConversations((prev) =>
          prev.map((conv) =>
            conv._id === selectedConversation._id
              ? {
                  ...conv,
                  lastMessage: {
                    _id: data.message._id,
                    content: data.message.content,
                    createdAt: data.message.createdAt,
                  },
                }
              : conv
          )
        )
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleTyping = () => {
    if (!socket || !selectedConversation) return

    // Emit typing start
    socket.emit('typing-start', {
      conversationId: selectedConversation._id,
      userId,
      userName: session?.user?.name,
    })

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to emit typing stop
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing-stop', {
        conversationId: selectedConversation._id,
        userId,
      })
    }, 2000)
  }

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find((p) => p._id !== userId)
  }

  if (!session) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500">Please sign in to view messages</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            {isConnected && (
              <div className="flex items-center text-green-600 text-sm">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></span>
                Connected
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
            {/* Conversations List */}
          <Card className="lg:col-span-1 p-4 overflow-y-auto">
            <h2 className="font-semibold text-lg mb-4">Conversations</h2>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No conversations yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => {
                  const otherUser = getOtherParticipant(conversation)
                  return (
                    <div
                      key={conversation._id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConversation?._id === conversation._id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {otherUser?.image ? (
                              <img
                                src={otherUser.image}
                                alt={otherUser.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {otherUser?.name}
                            </p>
                            {conversation.lastMessage && (
                              <p className="text-xs text-gray-500 truncate">
                                {conversation.lastMessage.content}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {conversation.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-blue-600 rounded-full">
                              {conversation.unreadCount}
                            </span>
                          )}
                          {conversation.lastMessage && (
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDistanceToNow(
                                new Date(conversation.lastMessage.createdAt),
                                { addSuffix: true }
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      {conversation.item && (
                        <div className="mt-2 text-xs text-gray-500 flex items-center">
                          <span className="truncate">
                            About: {conversation.item.title}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Messages */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="p-4 border-b">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {getOtherParticipant(selectedConversation)?.image ? (
                        <img
                          src={getOtherParticipant(selectedConversation)!.image}
                          alt={getOtherParticipant(selectedConversation)!.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">
                        {getOtherParticipant(selectedConversation)?.name}
                      </p>
                      {selectedConversation.item && (
                        <p className="text-xs text-gray-500">
                          About: {selectedConversation.item.title}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => {
                    const isSender = message.sender._id === userId
                    return (
                      <div
                        key={message._id}
                        className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isSender
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isSender ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            {formatDistanceToNow(new Date(message.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  {typing && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg text-sm">
                        {typing.userName} is typing...
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <Input
                      value={messageInput}
                      onChange={(e) => {
                        setMessageInput(e.target.value)
                        handleTyping()
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder="Type a message..."
                      disabled={sending}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || sending}
                      size="icon"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
        </div>
      </div>
      </Layout>
    )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center">Loading messages...</div>
          </div>
        </div>
      </Layout>
    }>
      <MessagesContent />
    </Suspense>
  )
}
