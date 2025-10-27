'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  Eye, 
  Grid3X3, 
  MessageSquare, 
  Bookmark, 
  User, 
  Search,
  TrendingUp,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Star,
  ExternalLink,
  Filter,
  BarChart3,
  Target,
  Zap,
  X,
  BookmarkPlus,
  Calendar,
  Flame
} from 'lucide-react'

interface Story {
  id: string
  title: string
  summary: string
  source: string
  publishedAt: string
  readTime: string
  category: string
  tags: string[]
  relevanceScore: number
  trending: boolean
  url: string
  image?: string
  saved?: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [showAllStories, setShowAllStories] = useState(false)
  const [savedStories, setSavedStories] = useState<Set<string>>(new Set())
  const [sourceFilter, setSourceFilter] = useState('')
  const [contentTypeFilter, setContentTypeFilter] = useState('')
  const [industryFilter, setIndustryFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const toggleSave = (storyId: string) => {
    setSavedStories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(storyId)) {
        newSet.delete(storyId)
      } else {
        newSet.add(storyId)
      }
      return newSet
    })
  }

  // Mock stories data
  const personalizedStories: Story[] = [
    {
      id: '1',
      title: "OpenAI Launches GPT-4 Turbo with Enhanced Reasoning Capabilities",
      summary: "The latest iteration promises 40% faster processing and improved logical reasoning for complex product decisions.",
      source: "TechCrunch",
      publishedAt: "2 hours ago",
      readTime: "4 min read",
      category: "Product Strategy",
      tags: ["GPT-4", "Product Strategy", "AI Tools"],
      relevanceScore: 95,
      trending: false,
      url: "#",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop"
    },
    {
      id: '2',
      title: "Google's Gemini AI Revolutionizes Code Review Process",
      summary: "New AI-powered code analysis reduces review time by 60% while improving bug detection rates.",
      source: "Wired",
      publishedAt: "4 hours ago",
      readTime: "6 min read",
      category: "Code Review",
      tags: ["Google", "Code Review", "Development"],
      relevanceScore: 88,
      trending: false,
      url: "#",
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop"
    },
    {
      id: '3',
      title: "Microsoft Copilot Integration Transforms Product Analytics",
      summary: "AI-powered insights generation helps product managers identify user behavior patterns 3x faster.",
      source: "MIT Technology Review",
      publishedAt: "6 hours ago",
      readTime: "5 min read",
      category: "Analytics",
      tags: ["Microsoft", "Analytics", "User Insights"],
      relevanceScore: 92,
      trending: false,
      url: "#",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop"
    },
    {
      id: '4',
      title: "Anthropic's Claude 3 Introduces Advanced Product Strategy Analysis",
      summary: "New AI assistant specializes in competitive analysis, market research, and strategic roadmap development.",
      source: "VentureBeat",
      publishedAt: "8 hours ago",
      readTime: "7 min read",
      category: "Strategy",
      tags: ["Anthropic", "Strategy", "Market Research"],
      relevanceScore: 85,
      trending: false,
      url: "#",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop"
    },
    {
      id: '5',
      title: "Meta's AI Tools Enable Real-Time User Sentiment Analysis",
      summary: "Advanced natural language processing helps product teams understand user feedback across multiple channels.",
      source: "The Verge",
      publishedAt: "12 hours ago",
      readTime: "4 min read",
      category: "Sentiment",
      tags: ["Meta", "Sentiment", "User Feedback"],
      relevanceScore: 89,
      trending: false,
      url: "#",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop"
    }
  ]

  const allStories: Story[] = [
    ...personalizedStories,
    {
      id: '6',
      title: "Startup Launches AI-Powered A/B Testing Platform",
      summary: "Automated experiment design and analysis reduces testing cycles from weeks to days while improving statistical significance.",
      source: "AI News",
      publishedAt: "14 hours ago",
      readTime: "5 min read",
      category: "Testing",
      tags: ["Startup", "A/B Testing", "Automation"],
      relevanceScore: 82,
      trending: true,
      url: "#",
      image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=400&fit=crop"
    },
    {
      id: '7',
      title: "Nvidia Unveils Next-Generation AI Chips for Product Teams",
      summary: "New H200 GPUs with 141GB memory designed for real-time analytics and large-scale data processing.",
      source: "TechCrunch",
      publishedAt: "16 hours ago",
      readTime: "6 min read",
      category: "Hardware",
      tags: ["Nvidia", "Hardware", "Performance"],
      relevanceScore: 78,
      trending: false,
      url: "#",
      image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&h=400&fit=crop"
    },
    {
      id: '8',
      title: "How AI is Transforming Customer Journey Mapping",
      summary: "Deep dive into how product teams use AI to understand and optimize every touchpoint in the customer experience.",
      source: "Product School",
      publishedAt: "18 hours ago",
      readTime: "10 min read",
      category: "Customer Journey",
      tags: ["Customer Journey", "UX", "Optimization"],
      relevanceScore: 91,
      trending: true,
      url: "#",
      image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=400&fit=crop"
    },
    {
      id: '9',
      title: "Amazon Bedrock Introduces Custom Model Training for Enterprises",
      summary: "AWS expands AI service offerings with tools for training custom foundation models using proprietary data.",
      source: "AWS Blog",
      publishedAt: "20 hours ago",
      readTime: "7 min read",
      category: "Enterprise AI",
      tags: ["Amazon", "AWS", "Enterprise"],
      relevanceScore: 84,
      trending: false,
      url: "#",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop"
    }
  ]

  const filteredAllStories = allStories.filter(story => {
    const matchesSearch = !searchQuery || 
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         story.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         story.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesSource = !sourceFilter || story.source === sourceFilter
    const matchesCategory = !categoryFilter || story.category === categoryFilter
    
    return matchesSearch && matchesSource && matchesCategory
  })

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="seer-glass border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 seer-glass rounded-xl flex items-center justify-center shadow-lg shadow-seer-primary/20">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold font-serif text-white tracking-tight">Seer</span>
            </div>
            <nav className="flex items-center space-x-2">
              <button className="seer-nav-item active">
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

      {/* Main Content */}
      <main className="w-full px-6 py-8">
        {/* Header with Quick Actions */}
        <div className={`mb-8 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-seer-primary/30 to-seer-accent/30 rounded-2xl flex items-center justify-center shadow-lg shadow-seer-primary/20">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-serif font-bold text-white tracking-tight">Daily Brief</h1>
                <p className="text-white/70 mt-1">Curated for Product Managers • Tuesday, October 14</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="px-4 py-2 seer-glass rounded-lg">
                <div className="text-sm text-white/70">Today</div>
                <div className="text-lg font-bold text-white">{personalizedStories.length} stories</div>
              </div>
              <div className="px-4 py-2 seer-glass rounded-lg">
                <div className="text-sm text-white/70">Avg Match</div>
                <div className="text-lg font-bold text-seer-primary">89%</div>
              </div>
            </div>
          </div>
              </div>

        {/* Dashboard Insights */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
          {/* Top Categories */}
          <div className="seer-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/90">Top Categories Today</h3>
              <Target className="w-5 h-5 text-seer-primary" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Product Strategy</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-seer-primary to-seer-accent rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <span className="text-xs font-semibold text-white/90">85%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Analytics</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-seer-primary to-seer-accent rounded-full" style={{ width: '72%' }}></div>
                  </div>
                  <span className="text-xs font-semibold text-white/90">72%</span>
            </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Code Review</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-seer-primary to-seer-accent rounded-full" style={{ width: '68%' }}></div>
                  </div>
                  <span className="text-xs font-semibold text-white/90">68%</span>
            </div>
              </div>
            </div>
          </div>

          {/* Reading Progress */}
          <div className="seer-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/90">This Week's Activity</h3>
              <BarChart3 className="w-5 h-5 text-seer-primary" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/70">Stories Read</span>
                  <span className="text-sm font-bold text-white">24/32</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-seer-primary to-seer-accent rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="text-center">
                  <div className="text-xl font-bold text-white">18</div>
                  <div className="text-xs text-white/70">Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">12</div>
                  <div className="text-xs text-white/70">Summarized</div>
        </div>
              </div>
              </div>
            </div>
            
          {/* Trending Topics */}
          <div className="seer-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/90">Trending Topics</h3>
              <TrendingUp className="w-5 h-5 text-seer-primary" />
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-seer-primary to-seer-accent rounded-full"></div>
                  <span className="text-sm text-white/80">GPT-4 Turbo</span>
                </div>
                <span className="text-xs font-semibold text-seer-primary">↑ 45%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-seer-primary to-seer-accent rounded-full"></div>
                  <span className="text-sm text-white/80">Gemini AI</span>
                </div>
                <span className="text-xs font-semibold text-seer-primary">↑ 32%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-seer-primary to-seer-accent rounded-full"></div>
                  <span className="text-sm text-white/80">Claude 3</span>
                </div>
                <span className="text-xs font-semibold text-seer-primary">↑ 28%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-seer-primary to-seer-accent rounded-full"></div>
                  <span className="text-sm text-white/80">Product Analytics</span>
                </div>
                <span className="text-xs font-semibold text-seer-primary">↑ 21%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Personalized Stories - Horizontal Scroll */}
        <div className={`mb-10 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif font-bold text-white">Today's Personalized Stories</h2>
            <div className="flex items-center space-x-2">
              <button className="p-2 rounded-lg seer-glass hover:bg-white/10 transition-colors">
                <ChevronLeft className="w-5 h-5 text-white/70" />
              </button>
              <button className="p-2 rounded-lg seer-glass hover:bg-white/10 transition-colors">
                <ChevronRight className="w-5 h-5 text-white/70" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto pb-4 -mx-6 px-6">
            <div className="flex space-x-6" style={{ width: 'max-content' }}>
              {personalizedStories.map((story, index) => (
                <article
                  key={story.id}
                  onClick={() => window.open(story.url, '_blank')}
                  className={`group seer-card cursor-pointer w-[380px] flex-shrink-0 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                >
                  {/* Image */}
                  {story.image && (
                    <div className="relative h-48 w-full rounded-t-2xl overflow-hidden bg-white/5">
                      <img 
                        src={story.image} 
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSave(story.id)
                        }}
                        className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 ${
                          savedStories.has(story.id)
                            ? 'bg-white/20 text-white'
                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                        }`}
                      >
                        <Bookmark className={`w-4 h-4 ${savedStories.has(story.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  )}

                  <div className="p-6">
                    {/* Source and Match */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1 text-seer-primary">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-sm font-semibold">{story.source}</span>
                        </div>
                        {story.trending && (
                          <Flame className="w-4 h-4 text-orange-400" />
                      )}
                    </div>
                      <span className="text-sm font-semibold text-seer-primary">{story.relevanceScore}% match</span>
                  </div>

                    {/* Title */}
                    <h3 className="text-lg font-serif font-bold text-white mb-2 leading-tight line-clamp-2 group-hover:text-seer-primary transition-colors">
                    {story.title}
                  </h3>
                  
                    {/* Summary */}
                    <p className="text-sm text-white/70 mb-4 line-clamp-2 leading-relaxed">
                    {story.summary}
                  </p>

                    {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {story.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded-md font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                    {/* Footer with Summarize button */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex items-center space-x-3 text-xs text-white/60">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                      <span>{story.readTime}</span>
                        </span>
                        <span>•</span>
                      <span>{story.publishedAt}</span>
                    </div>
                    
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle summarize action
                        }}
                        className="px-3.5 py-1.5 text-sm font-semibold seer-glass text-white hover:bg-white/10 rounded-lg transition-colors inline-flex items-center space-x-1.5 shadow-md shadow-seer-primary/20"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Summarize</span>
                    </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* Show All Stories Button */}
        {!showAllStories && (
          <div className={`text-center mb-12 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.8s' }}>
            <button 
              onClick={() => setShowAllStories(true)}
              className="seer-btn-primary inline-flex items-center space-x-2"
            >
              <span>Show All Stories</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* All Stories Section */}
        {showAllStories && (
          <div className={`${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold text-white">All AI Stories</h2>
              <button 
                onClick={() => setShowAllStories(false)}
                className="text-seer-primary hover:text-seer-primary-hover font-medium inline-flex items-center space-x-1"
              >
                <span>Hide</span>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="seer-card p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
              <div className="flex-1 max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search stories, topics, or companies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 seer-input"
                  />
                </div>
            </div>

              <div className="flex items-center space-x-3 overflow-x-auto">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-white/50" />
                  <span className="text-sm font-medium text-white/70 whitespace-nowrap">Filter by:</span>
                </div>
                
                <select 
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="px-3 py-2 seer-glass text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  <option value="">All sources</option>
                  <option value="TechCrunch">TechCrunch</option>
                  <option value="Wired">Wired</option>
                  <option value="MIT Technology Review">MIT Technology Review</option>
                  <option value="VentureBeat">VentureBeat</option>
                  <option value="The Verge">The Verge</option>
                  </select>
                  
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 seer-glass text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  <option value="">All categories</option>
                  <option value="Product Strategy">Product Strategy</option>
                  <option value="Code Review">Code Review</option>
                  <option value="Analytics">Analytics</option>
                  <option value="Strategy">Strategy</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Stories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAllStories.map((story, index) => (
                <article
                  key={story.id}
                  onClick={() => window.open(story.url, '_blank')}
                  className={`group seer-card cursor-pointer ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: `${1 + index * 0.05}s` }}
                >
                {/* Image */}
                {story.image && (
                  <div className="relative h-40 w-full rounded-t-2xl overflow-hidden bg-white/5">
                    <img 
                      src={story.image} 
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSave(story.id)
                      }}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 ${
                        savedStories.has(story.id)
                          ? 'bg-white/20 text-white'
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${savedStories.has(story.id) ? 'fill-current' : ''}`} />
                    </button>
                      {story.trending && (
                      <div className="absolute top-3 left-3 px-2 py-1 bg-orange-500/80 backdrop-blur-md text-white text-xs font-semibold rounded-full inline-flex items-center space-x-1">
                        <Flame className="w-3 h-3" />
                        <span>Trending</span>
                        </div>
                      )}
                    </div>
                )}

                <div className="p-5">
                  {/* Source and Match */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-seer-primary">{story.source}</span>
                    <span className="text-sm font-semibold text-seer-primary">{story.relevanceScore}% match</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-serif font-bold text-white mb-2 leading-tight line-clamp-2 group-hover:text-seer-primary transition-colors">
                    {story.title}
                  </h3>
                  
                  {/* Summary */}
                  <p className="text-sm text-white/70 mb-4 line-clamp-2 leading-relaxed">
                    {story.summary}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {story.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-white/10 text-white/80 text-xs rounded font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* Footer with Summarize button */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div className="flex items-center space-x-2 text-xs text-white/60">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                      <span>{story.readTime}</span>
                      </span>
                      <span>•</span>
                      <span>{story.publishedAt}</span>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        // Handle summarize action
                      }}
                      className="px-3.5 py-1.5 text-sm font-semibold seer-glass text-white hover:bg-white/10 rounded-lg transition-colors inline-flex items-center space-x-1.5 shadow-md shadow-seer-primary/20"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Summarize</span>
                    </button>
                  </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
