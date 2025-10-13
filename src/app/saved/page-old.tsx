'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Eye, 
  Grid3X3, 
  MessageSquare, 
  Bookmark, 
  User, 
  Search,
  Filter,
  Star,
  Clock,
  Calendar,
  StickyNote,
  ExternalLink,
  ArrowUpDown,
  BarChart3,
  TrendingUp,
  FileText,
  Tag
} from 'lucide-react'

interface SavedStory {
  id: string
  title: string
  summary: string
  source: string
  savedAt: string
  readTime: string
  category: string
  tags: string[]
  rating: number
  isRead: boolean
  notes: string
  url: string
}

export default function SavedStoriesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('savedAt')
  const [filterBy, setFilterBy] = useState('all')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const savedStories: SavedStory[] = [
    {
      id: '1',
      title: "OpenAI Releases GPT-5 with Revolutionary Multimodal Capabilities",
      summary: "The latest iteration of GPT introduces unprecedented multimodal understanding, combining text, image, audio, and video processing in a single model.",
      source: "TechCrunch",
      savedAt: "2024-01-15",
      readTime: "4 min read",
      category: "AI Models",
      tags: ["OpenAI", "GPT-5", "Multimodal"],
      rating: 5,
      isRead: false,
      notes: "Important for our product roadmap - need to evaluate integration possibilities",
      url: "#"
    },
    {
      id: '2',
      title: "Meta's New AI Chip Architecture Promises 10x Performance Gains",
      summary: "Meta unveils its custom silicon designed specifically for AI workloads, featuring novel memory architecture and specialized tensor processing units.",
      source: "The Verge",
      savedAt: "2024-01-14",
      readTime: "6 min read",
      category: "Hardware",
      tags: ["Meta", "AI Chips", "Hardware"],
      rating: 4,
      isRead: true,
      notes: "Potential cost implications for our infrastructure",
      url: "#"
    },
    {
      id: '3',
      title: "Anthropic's Constitutional AI Shows Promise in Reducing Harmful Outputs",
      summary: "New research demonstrates how constitutional AI training can significantly reduce harmful, biased, or misleading outputs while maintaining model performance.",
      source: "MIT Technology Review",
      savedAt: "2024-01-13",
      readTime: "8 min read",
      category: "AI Safety",
      tags: ["Anthropic", "AI Safety", "Constitutional AI"],
      rating: 5,
      isRead: true,
      notes: "Excellent insights on AI safety practices we should adopt",
      url: "#"
    },
    {
      id: '4',
      title: "Google DeepMind Achieves Breakthrough in Protein Folding Prediction",
      summary: "AlphaFold 3 demonstrates unprecedented accuracy in predicting protein-protein interactions, opening new possibilities for drug discovery.",
      source: "Nature",
      savedAt: "2024-01-12",
      readTime: "10 min read",
      category: "Research",
      tags: ["Google", "DeepMind", "AlphaFold"],
      rating: 4,
      isRead: false,
      notes: "",
      url: "#"
    },
    {
      id: '5',
      title: "Microsoft Copilot Integration Reaches 1 Billion Users Worldwide",
      summary: "Microsoft announces that Copilot has been integrated across its entire ecosystem, with over 1 billion users now having access to AI-powered assistance.",
      source: "Microsoft Blog",
      savedAt: "2024-01-11",
      readTime: "5 min read",
      category: "Business",
      tags: ["Microsoft", "Copilot", "Productivity"],
      rating: 3,
      isRead: true,
      notes: "Good benchmark for user adoption metrics",
      url: "#"
    }
  ]

  const stats = {
    total: savedStories.length,
    unread: savedStories.filter(s => !s.isRead).length,
    rated: savedStories.filter(s => s.rating > 0).length,
    withNotes: savedStories.filter(s => s.notes.length > 0).length
  }

  const sortOptions = [
    { value: 'savedAt', label: 'Date Saved' },
    { value: 'rating', label: 'Rating' },
    { value: 'readTime', label: 'Read Time' },
    { value: 'source', label: 'Source' }
  ]

  const filterOptions = [
    { value: 'all', label: 'All Stories', count: stats.total },
    { value: 'unread', label: 'Unread', count: stats.unread },
    { value: 'rated', label: 'Rated', count: stats.rated },
    { value: 'with-notes', label: 'With Notes', count: stats.withNotes }
  ]

  const filteredStories = savedStories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         story.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         story.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         story.notes.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterBy === 'all' || 
                         (filterBy === 'unread' && !story.isRead) ||
                         (filterBy === 'rated' && story.rating > 0) ||
                         (filterBy === 'with-notes' && story.notes.length > 0)
    
    return matchesSearch && matchesFilter
  })

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'AI Models': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Hardware': return 'bg-green-100 text-green-800 border-green-200'
      case 'AI Safety': return 'bg-red-100 text-red-800 border-red-200'
      case 'Research': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Business': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
      />
    ))
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
              <button 
                onClick={() => router.push('/chat')}
                className="seer-nav-item"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat</span>
              </button>
              <button className="seer-nav-item active">
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

      {/* Main Content */}
      <main className="w-full px-6 py-8">
        {/* Header Section */}
        <div className={`mb-8 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-seer-teal to-seer-teal-hover rounded-xl flex items-center justify-center shadow-lg">
              <Bookmark className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-heading-1 text-slate-900">Saved Stories Archive</h1>
              <p className="text-body text-slate-600">Your curated collection of AI news and insights</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="seer-card p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <FileText className="w-5 h-5 text-seer-teal" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
              <div className="text-sm text-slate-600">Total Saved</div>
            </div>
            <div className="seer-card p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-seer-teal" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.unread}</div>
              <div className="text-sm text-slate-600">Unread</div>
            </div>
            <div className="seer-card p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="w-5 h-5 text-seer-teal" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.rated}</div>
              <div className="text-sm text-slate-600">Rated</div>
            </div>
            <div className="seer-card p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <StickyNote className="w-5 h-5 text-seer-teal" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.withNotes}</div>
              <div className="text-sm text-slate-600">With Notes</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className={`seer-card p-6 mb-8 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search saved stories, notes, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="seer-input pl-12"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <ArrowUpDown className="w-4 h-4 text-slate-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="seer-input py-2 px-3 text-sm"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-3 overflow-x-auto">
                {filterOptions.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setFilterBy(filter.value)}
                    className={`seer-badge whitespace-nowrap border ${
                      filterBy === filter.value
                        ? 'bg-seer-teal text-white border-seer-teal'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stories Grid */}
        <div className="grid gap-6">
          {filteredStories.map((story, index) => (
            <article
              key={story.id}
              className={`seer-card p-6 ${!story.isRead ? 'border-l-4 border-l-seer-teal' : ''} ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: `${0.4 + index * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className={`seer-badge border ${getCategoryColor(story.category)}`}>
                    {story.category}
                  </span>
                  {!story.isRead && (
                    <span className="seer-badge bg-seer-teal text-white border-seer-teal">
                      Unread
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {renderStars(story.rating)}
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-3 leading-tight">
                {story.title}
              </h3>
              
              <p className="text-body text-slate-600 mb-4 leading-relaxed">
                {story.summary}
              </p>

              {story.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start space-x-2">
                    <StickyNote className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">{story.notes}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                {story.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center space-x-1 px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-md font-medium"
                  >
                    <Tag className="w-3 h-3" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-4 text-sm text-slate-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Saved {story.savedAt}</span>
                  </div>
                  <span className="font-medium text-slate-700">{story.source}</span>
                  <span>{story.readTime}</span>
                </div>
                
                <button className="seer-btn-ghost text-sm inline-flex items-center space-x-1">
                  <span>Read</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>

        {filteredStories.length === 0 && (
          <div className="text-center py-12">
            <Bookmark className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No stories found</h3>
            <p className="text-slate-600">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </main>
    </div>
  )
}
