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
  TrendingUp,
  Tag,
  Plus,
  FolderPlus,
  ArrowRight,
  Sparkles,
  X,
  Flame
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
  collection: string
  relevanceScore: number
  trending: boolean
  publishedAt: string
  image?: string
}

interface Collection {
  id: string
  name: string
  count: number
  color: string
}

export default function SavedStoriesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('savedAt')
  const [selectedCollection, setSelectedCollection] = useState('all')
  const [isVisible, setIsVisible] = useState(false)
  const [showNewCollection, setShowNewCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const collections: Collection[] = [
    { id: 'all', name: 'All Stories', count: 6, color: 'bg-slate-100' },
    { id: 'ai-research', name: 'AI Research', count: 2, color: 'bg-blue-100' },
    { id: 'product-insights', name: 'Product Insights', count: 2, color: 'bg-green-100' },
    { id: 'industry-trends', name: 'Industry Trends', count: 2, color: 'bg-purple-100' }
  ]

  const savedStories: SavedStory[] = [
    {
      id: '1',
      title: "OpenAI Launches GPT-4 Turbo with Enhanced Reasoning Capabilities",
      summary: "The latest iteration promises 40% faster processing and improved logical reasoning for complex product decisions.",
      source: "TechCrunch",
      savedAt: "2024-01-15",
      readTime: "4 min read",
      category: "Product Strategy",
      tags: ["OpenAI", "GPT-4", "Product Strategy"],
      rating: 5,
      isRead: false,
      notes: "Important for our product roadmap - need to evaluate integration possibilities",
      url: "#",
      collection: 'ai-research',
      relevanceScore: 95,
      trending: true,
      publishedAt: "2 hours ago",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop"
    },
    {
      id: '2',
      title: "Google's Gemini AI Revolutionizes Code Review Process",
      summary: "New AI-powered code analysis reduces review time by 60% while improving bug detection rates.",
      source: "Wired",
      savedAt: "2024-01-14",
      readTime: "6 min read",
      category: "Development",
      tags: ["Google", "Code Review", "Development"],
      rating: 4,
      isRead: true,
      notes: "Potential tool for our engineering team",
      url: "#",
      collection: 'industry-trends',
      relevanceScore: 88,
      trending: false,
      publishedAt: "4 hours ago",
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop"
    },
    {
      id: '3',
      title: "Microsoft Copilot Integration Transforms Product Analytics",
      summary: "AI-powered insights generation helps product managers identify user behavior patterns 3x faster.",
      source: "MIT Technology Review",
      savedAt: "2024-01-13",
      readTime: "5 min read",
      category: "Analytics",
      tags: ["Microsoft", "Analytics", "User Insights"],
      rating: 5,
      isRead: true,
      notes: "Excellent insights on analytics practices we should adopt",
      url: "#",
      collection: 'ai-research',
      relevanceScore: 92,
      trending: false,
      publishedAt: "6 hours ago",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop"
    },
    {
      id: '4',
      title: "Anthropic's Claude 3 Introduces Advanced Product Strategy Analysis",
      summary: "New AI assistant specializes in competitive analysis, market research, and strategic roadmap development.",
      source: "VentureBeat",
      savedAt: "2024-01-12",
      readTime: "7 min read",
      category: "Strategy",
      tags: ["Anthropic", "Strategy", "Market Research"],
      rating: 4,
      isRead: false,
      notes: "",
      url: "#",
      collection: 'product-insights',
      relevanceScore: 85,
      trending: false,
      publishedAt: "8 hours ago",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop"
    },
    {
      id: '5',
      title: "Meta's AI Tools Enable Real-Time User Sentiment Analysis",
      summary: "Advanced natural language processing helps product teams understand user feedback across multiple channels.",
      source: "The Verge",
      savedAt: "2024-01-11",
      readTime: "4 min read",
      category: "Sentiment",
      tags: ["Meta", "Sentiment", "User Feedback"],
      rating: 3,
      isRead: true,
      notes: "Good benchmark for sentiment analysis features",
      url: "#",
      collection: 'product-insights',
      relevanceScore: 89,
      trending: false,
      publishedAt: "12 hours ago",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop"
    },
    {
      id: '6',
      title: "How AI is Transforming Customer Journey Mapping",
      summary: "Deep dive into how product teams use AI to understand and optimize every touchpoint in the customer experience.",
      source: "Product School",
      savedAt: "2024-01-10",
      readTime: "10 min read",
      category: "Customer Journey",
      tags: ["Customer Journey", "UX", "Optimization"],
      rating: 4,
      isRead: false,
      notes: "Consider for our next planning cycle",
      url: "#",
      collection: 'industry-trends',
      relevanceScore: 91,
      trending: true,
      publishedAt: "14 hours ago",
      image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=400&fit=crop"
    }
  ]

  const filteredStories = savedStories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         story.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         story.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         story.notes.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCollection = selectedCollection === 'all' || story.collection === selectedCollection
    
    return matchesSearch && matchesCollection
  })

  const createNewCollection = () => {
    if (newCollectionName.trim()) {
      console.log('Creating collection:', newCollectionName)
      setNewCollectionName('')
      setShowNewCollection(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-seer-primary to-seer-accent rounded-xl flex items-center justify-center shadow-lg shadow-seer-primary/30">
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-seer-primary to-seer-accent rounded-2xl flex items-center justify-center shadow-lg shadow-seer-primary/30">
                <Bookmark className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Saved Stories</h1>
                <p className="text-slate-600 mt-1">Your curated collection of AI news and insights</p>
              </div>
            </div>
            <div className="px-4 py-2 bg-seer-primary-light rounded-lg border border-seer-primary/20">
              <div className="text-sm text-slate-600">Total Saved</div>
              <div className="text-lg font-bold text-slate-900">{filteredStories.length} stories</div>
            </div>
          </div>

          {/* Collections */}
          <div className="flex items-center space-x-3 mb-6 overflow-x-auto pb-2">
            {collections.map((collection) => (
              <button
                key={collection.id}
                onClick={() => setSelectedCollection(collection.id)}
                className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                  selectedCollection === collection.id
                    ? 'bg-seer-primary text-white shadow-lg shadow-seer-primary/30'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-seer-primary/40'
                }`}
              >
                {collection.name} ({collection.count})
              </button>
            ))}
            <button
              onClick={() => setShowNewCollection(!showNewCollection)}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:border-seer-primary/40 rounded-xl transition-all inline-flex items-center space-x-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>New Collection</span>
            </button>
          </div>

          {/* New Collection Input */}
          {showNewCollection && (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200 p-4 mb-6">
              <div className="flex items-center space-x-3">
                <FolderPlus className="w-5 h-5 text-seer-primary" />
                <input
                  type="text"
                  placeholder="Collection name..."
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-seer-primary focus:border-transparent"
                  onKeyDown={(e) => e.key === 'Enter' && createNewCollection()}
                />
                <button onClick={createNewCollection} className="seer-btn-primary px-4 py-2">
                  Create
                </button>
                <button 
                  onClick={() => setShowNewCollection(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>
          )}

          {/* Search and Sort */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
              <div className="flex-1 max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search saved stories, notes, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-seer-primary focus:border-transparent transition-all duration-300 placeholder-slate-400"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <ArrowUpDown className="w-4 h-4 text-slate-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-seer-primary focus:border-transparent"
                  >
                    <option value="savedAt">Date Saved</option>
                    <option value="rating">Rating</option>
                    <option value="readTime">Read Time</option>
                    <option value="source">Source</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story, index) => (
            <article
              key={story.id}
              onClick={() => window.open(story.url, '_blank')}
              className={`group bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200 hover:border-seer-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-seer-primary/10 hover:-translate-y-1 cursor-pointer ${!story.isRead ? 'ring-2 ring-seer-primary/20' : ''} ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: `${0.2 + index * 0.05}s` }}
            >
              {/* Image */}
              {story.image && (
                <div className="relative h-40 w-full rounded-t-2xl overflow-hidden bg-slate-100">
                  <img 
                    src={story.image} 
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 flex items-center space-x-2">
                    {!story.isRead && (
                      <span className="px-2 py-1 bg-seer-primary text-white text-xs font-semibold rounded-full">
                        Unread
                      </span>
                    )}
                    {story.trending && (
                      <div className="px-2 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full inline-flex items-center space-x-1">
                        <Flame className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div className="absolute top-3 left-3">
                    <div className="flex items-center space-x-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < story.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="p-5">
                {/* Source and Match */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-seer-primary">{story.source}</span>
                  <span className="text-sm font-semibold text-seer-primary">{story.relevanceScore}% match</span>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-slate-900 mb-2 leading-tight line-clamp-2 group-hover:text-seer-primary transition-colors">
                  {story.title}
                </h3>
                
                {/* Summary */}
                <p className="text-sm text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                  {story.summary}
                </p>

                {/* Notes */}
                {story.notes && (
                  <div className="bg-yellow-50/80 border border-yellow-200 rounded-lg p-2.5 mb-3">
                    <div className="flex items-start space-x-2">
                      <StickyNote className="w-3.5 h-3.5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-yellow-800 line-clamp-2">{story.notes}</p>
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {story.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center space-x-1 px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded font-medium"
                    >
                      <Tag className="w-3 h-3" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
                
                {/* Footer with Summarize button */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>Saved {story.savedAt}</span>
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      // Handle summarize action
                    }}
                    className="px-3.5 py-1.5 text-sm font-semibold bg-seer-primary text-white hover:bg-seer-primary-hover rounded-lg transition-colors inline-flex items-center space-x-1.5 shadow-md shadow-seer-primary/40"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Summarize</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredStories.length === 0 && (
          <div className="text-center py-16">
            <Bookmark className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No stories found</h3>
            <p className="text-slate-600">Try adjusting your search or collection filter.</p>
          </div>
        )}
      </main>
    </div>
  )
}
