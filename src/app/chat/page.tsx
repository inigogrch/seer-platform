'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Eye, 
  Grid3X3, 
  MessageSquare, 
  Bookmark, 
  User, 
  Send,
  Sparkles,
  Clock,
  TrendingUp,
  BarChart3,
  Lightbulb,
  Search,
  FileText,
  Zap
} from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: string
}

export default function ChatPage() {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your AI assistant for navigating the latest AI news and insights. I can help you understand complex topics, find relevant stories, or answer questions about AI developments. What would you like to explore today?",
      timestamp: "Just now"
    }
  ])

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const quickActions = [
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "What's trending in AI today?",
      description: "Get a summary of the most important AI news"
    },
    {
      icon: <Search className="w-5 h-5" />,
      title: "Explain GPT-5 capabilities",
      description: "Deep dive into the latest model features"
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "AI market analysis",
      description: "Current trends and investment insights"
    },
    {
      icon: <Lightbulb className="w-5 h-5" />,
      title: "How can AI help my role?",
      description: "Personalized AI applications for your work"
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: "Summarize recent research",
      description: "Key findings from latest AI papers"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "AI tool recommendations",
      description: "Best tools for your specific needs"
    }
  ]

  const handleSendMessage = () => {
    if (!message.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: 'Just now'
    }

    setMessages(prev => [...prev, newMessage])
    setMessage('')

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I understand you're interested in that topic. Let me help you find the most relevant and up-to-date information. Based on your role as a Product Manager, here are some key insights...",
        timestamp: 'Just now'
      }
      setMessages(prev => [...prev, aiResponse])
    }, 1000)
  }

  const handleQuickAction = (action: string) => {
    setMessage(action)
    handleSendMessage()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-seer-teal to-seer-teal-hover rounded-xl flex items-center justify-center shadow-lg">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-900 tracking-tight">Seer</span>
            </div>
            <nav className="flex items-center space-x-2">
              <button 
                onClick={() => router.push('/dashboard')}
                className="seer-nav-item"
              >
                <Grid3X3 className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button className="seer-nav-item active">
                <MessageSquare className="w-4 h-4" />
                <span>Chat</span>
              </button>
              <button 
                onClick={() => router.push('/saved')}
                className="seer-nav-item"
              >
                <Bookmark className="w-4 h-4" />
                <span>Saved Stories</span>
              </button>
              <button 
                onClick={() => router.push('/profile')}
                className="seer-nav-item"
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-seer-teal to-seer-teal-hover rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-heading-2 text-slate-900">AI Assistant</h2>
                <p className="text-sm text-slate-600">Your personalized AI news guide</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.title)}
                  className={`seer-card-interactive w-full p-4 text-left ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-seer-light-teal rounded-lg flex items-center justify-center text-seer-teal">
                      {action.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 text-sm mb-1">{action.title}</h4>
                      <p className="text-xs text-slate-600">{action.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((msg, index) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`max-w-2xl ${msg.type === 'user' ? 'order-2' : 'order-1'}`}>
                    <div className={`flex items-start space-x-3 ${msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        msg.type === 'user' 
                          ? 'bg-seer-teal text-white' 
                          : 'bg-gradient-to-br from-seer-teal to-seer-teal-hover text-white'
                      }`}>
                        {msg.type === 'user' ? (
                          <User className="w-5 h-5" />
                        ) : (
                          <Sparkles className="w-5 h-5" />
                        )}
                      </div>
                      <div className={`flex-1 ${msg.type === 'user' ? 'text-right' : ''}`}>
                        <div className={`inline-block p-4 rounded-2xl ${
                          msg.type === 'user'
                            ? 'bg-seer-teal text-white'
                            : 'bg-white border border-slate-200 text-slate-900'
                        }`}>
                          <p className="text-body leading-relaxed">{msg.content}</p>
                        </div>
                        <div className={`flex items-center space-x-2 mt-2 text-xs text-slate-500 ${msg.type === 'user' ? 'justify-end' : ''}`}>
                          <Clock className="w-3 h-3" />
                          <span>{msg.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="border-t border-slate-200 bg-white p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask me anything about AI news, trends, or get help understanding complex topics..."
                    className="seer-input resize-none h-20"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="seer-btn-primary disabled:opacity-50 disabled:cursor-not-allowed h-20 px-6"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
