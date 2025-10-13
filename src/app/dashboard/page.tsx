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
  Zap
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
}

export default function DashboardPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [isVisible, setIsVisible] = useState(false)
  const [showAllStories, setShowAllStories] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Mock stories data
  const stories: Story[] = [
    {
      id: '1',
      title: "OpenAI Releases GPT-5 with Revolutionary Multimodal Capabilities",
      summary: "The latest iteration of GPT introduces unprecedented multimodal understanding, combining text, image, audio, and video processing in a single model. Early benchmarks show 40% improvement in reasoning tasks.",
      source: "TechCrunch",
      publishedAt: "2 hours ago",
      readTime: "4 min read",
      category: "AI Models",
      tags: ["OpenAI", "GPT-5", "Multimodal"],
      relevanceScore: 95,
      trending: true,
      url: "#"
    },
    {
      id: '2',
      title: "Meta's New AI Chip Architecture Promises 10x Performance Gains",
      summary: "Meta unveils its custom silicon designed specifically for AI workloads, featuring novel memory architecture and specialized tensor processing units. The chip could revolutionize edge AI deployment.",
      source: "The Verge",
      publishedAt: "4 hours ago",
      readTime: "6 min read",
      category: "Hardware",
      tags: ["Meta", "AI Chips", "Hardware"],
      relevanceScore: 88,
      trending: true,
      url: "#"
    },
    {
      id: '3',
      title: "Anthropic's Constitutional AI Shows Promise in Reducing Harmful Outputs",
      summary: "New research demonstrates how constitutional AI training can significantly reduce harmful, biased, or misleading outputs while maintaining model performance across diverse tasks.",
      source: "MIT Technology Review",
      publishedAt: "8 hours ago",
      readTime: "8 min read",
      category: "AI Safety",
      tags: ["Anthropic", "AI Safety", "Constitutional AI"],
      relevanceScore: 82,
      trending: false,
      url: "#"
    },
    {
      id: '4',
      title: "Google DeepMind Achieves Breakthrough in Protein Folding Prediction",
      summary: "AlphaFold 3 demonstrates unprecedented accuracy in predicting protein-protein interactions, opening new possibilities for drug discovery and understanding biological processes.",
      source: "Nature",
      publishedAt: "12 hours ago",
      readTime: "10 min read",
      category: "Research",
      tags: ["Google", "DeepMind", "AlphaFold"],
      relevanceScore: 79,
      trending: false,
      url: "#"
    },
    {
      id: '5',
      title: "Microsoft Copilot Integration Reaches 1 Billion Users Worldwide",
      summary: "Microsoft announces that Copilot has been integrated across its entire ecosystem, with over 1 billion users now having access to AI-powered assistance in their daily workflows.",
      source: "Microsoft Blog",
      publishedAt: "1 day ago",
      readTime: "5 min read",
      category: "Business",
      tags: ["Microsoft", "Copilot", "Productivity"],
      relevanceScore: 75,
      trending: false,
      url: "#"
    },
    {
      id: '6',
      title: "How Startups Are Using AI to Disrupt Traditional Industries",
      summary: "A deep dive into innovative AI applications across healthcare, finance, education, and manufacturing sectors by emerging startups that are reshaping entire industries.",
      source: "VentureBeat",
      publishedAt: "2 days ago",
      readTime: "15 min read",
      category: "Business",
      tags: ["Startups", "AI Applications", "Industry Disruption"],
      relevanceScore: 71,
      trending: false,
      url: "#"
    }
  ]

  const allStories: Story[] = [
    ...stories, // Include the existing stories
    {
      id: '7',
      title: "Nvidia Unveils Next-Generation H200 AI Chips with 141GB Memory",
      summary: "The new H200 Tensor Core GPUs feature significantly increased memory capacity and bandwidth, designed specifically for large language model training and inference.",
      source: "TechCrunch",
      readTime: "5 min read",
      publishedAt: "3 hours ago",
      category: "Hardware",
      tags: ["Nvidia", "AI Chips", "Hardware"],
      relevanceScore: 94,
      trending: true,
      url: "#"
    },
    {
      id: '8',
      title: "Stanford Researchers Develop AI Model for Real-Time Protein Design",
      summary: "New breakthrough allows for on-demand protein creation with specific functions, potentially revolutionizing drug discovery and biotechnology applications.",
      source: "Nature",
      readTime: "8 min read",
      publishedAt: "5 hours ago",
      category: "Research",
      tags: ["Stanford", "Protein Design", "Biotechnology"],
      relevanceScore: 89,
      trending: false,
      url: "#"
    },
    {
      id: '9',
      title: "Amazon Bedrock Introduces Custom Model Training Capabilities",
      summary: "AWS expands its AI service offerings with tools that allow enterprises to train custom foundation models using their proprietary data.",
      source: "AWS Blog",
      readTime: "6 min read",
      publishedAt: "7 hours ago",
      category: "Business",
      tags: ["Amazon", "AWS", "Custom Models"],
      relevanceScore: 87,
      trending: false,
      url: "#"
    },
    {
      id: '10',
      title: "EU AI Act Implementation Guidelines Released for Enterprises",
      summary: "Comprehensive framework provides clear guidance for companies to ensure compliance with the European Union's landmark AI regulation.",
      source: "TechCrunch",
      readTime: "7 min read",
      publishedAt: "9 hours ago",
      category: "Regulation",
      tags: ["EU", "AI Act", "Compliance"],
      relevanceScore: 82,
      trending: false,
      url: "#"
    },
    {
      id: '11',
      title: "Hugging Face Launches Open-Source Alternative to GPT-4",
      summary: "The new model, trained on diverse multilingual data, aims to democratize access to advanced language AI capabilities for developers worldwide.",
      source: "The Verge",
      readTime: "4 min read",
      publishedAt: "12 hours ago",
      category: "AI Models",
      tags: ["Hugging Face", "Open Source", "Language Models"],
      relevanceScore: 91,
      trending: true,
      url: "#"
    },
    {
      id: '12',
      title: "Microsoft Copilot Studio Enables Custom AI Assistant Creation",
      summary: "New low-code platform allows businesses to build specialized AI assistants tailored to their specific workflows and industry requirements.",
      source: "Microsoft Blog",
      readTime: "5 min read",
      publishedAt: "14 hours ago",
      category: "Tools",
      tags: ["Microsoft", "Copilot", "Custom AI"],
      relevanceScore: 85,
      trending: false,
      url: "#"
    },
    {
      id: '13',
      title: "DeepMind's Gemini Ultra Achieves Human-Level Performance on MMLU",
      summary: "Latest evaluation results show the model matching human expert performance across 57 academic subjects, marking a significant milestone in AI development.",
      source: "MIT Technology Review",
      readTime: "6 min read",
      publishedAt: "16 hours ago",
      category: "AI Models",
      tags: ["DeepMind", "Gemini", "Benchmarks"],
      relevanceScore: 93,
      trending: true,
      url: "#"
    },
    {
      id: '14',
      title: "Anthropic Introduces Constitutional AI Training for Enterprise",
      summary: "New service helps companies train AI models with built-in safety constraints and ethical guidelines, reducing harmful outputs in business applications.",
      source: "VentureBeat",
      readTime: "7 min read",
      publishedAt: "18 hours ago",
      category: "AI Safety",
      tags: ["Anthropic", "Constitutional AI", "Enterprise"],
      relevanceScore: 88,
      trending: false,
      url: "#"
    },
    {
      id: '15',
      title: "OpenAI Announces GPT Store Revenue Sharing Program",
      summary: "Developers can now monetize their custom GPT applications through the official store, with revenue sharing based on user engagement metrics.",
      source: "TechCrunch",
      readTime: "4 min read",
      publishedAt: "20 hours ago",
      category: "Business",
      tags: ["OpenAI", "GPT Store", "Monetization"],
      relevanceScore: 86,
      trending: false,
      url: "#"
    }
  ]

  const filters = [
    { id: 'all', label: 'All Stories', count: stories.length },
    { id: 'trending', label: 'Trending', count: stories.filter(s => s.trending).length },
    { id: 'ai-models', label: 'AI Models', count: stories.filter(s => s.category === 'AI Models').length },
    { id: 'research', label: 'Research', count: stories.filter(s => s.category === 'Research').length },
    { id: 'business', label: 'Business', count: stories.filter(s => s.category === 'Business').length }
  ]

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         story.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         story.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'trending' && story.trending) ||
                         (selectedFilter === 'ai-models' && story.category === 'AI Models') ||
                         (selectedFilter === 'research' && story.category === 'Research') ||
                         (selectedFilter === 'business' && story.category === 'Business')
    
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
        {/* Header Section */}
        <div className={`mb-8 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-seer-teal to-seer-teal-hover rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-heading-1 text-slate-900">Your Personalized AI News Feed</h1>
              <p className="text-body text-slate-600">{filteredStories.length} stories curated for Product Managers in Technology & Software</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="seer-card p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-seer-teal" />
              </div>
              <div className="text-2xl font-bold text-slate-900">95%</div>
              <div className="text-sm text-slate-600">Relevance</div>
            </div>
            <div className="seer-card p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-seer-teal" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{stories.filter(s => s.trending).length}</div>
              <div className="text-sm text-slate-600">Trending</div>
            </div>
            <div className="seer-card p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-seer-teal" />
              </div>
              <div className="text-2xl font-bold text-slate-900">2h</div>
              <div className="text-sm text-slate-600">Ago</div>
            </div>
            <div className="seer-card p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Zap className="w-5 h-5 text-seer-teal" />
              </div>
              <div className="text-2xl font-bold text-slate-900">6</div>
              <div className="text-sm text-slate-600">New Today</div>
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
                  placeholder="Search stories, topics, or companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="seer-input pl-12"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3 overflow-x-auto">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`seer-badge whitespace-nowrap border ${
                    selectedFilter === filter.id
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

        {/* Horizontal Story Cards */}
        <div className={`${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-heading-2 text-slate-900">Latest Stories</h2>
            <div className="flex items-center space-x-2">
              <button className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <button className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto pb-4">
            <div className="flex space-x-6" style={{ width: 'max-content' }}>
              {filteredStories.map((story, index) => (
                <article
                  key={story.id}
                  className={`story-card-horizontal ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: `${0.6 + index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className={`seer-badge border ${getCategoryColor(story.category)}`}>
                        {story.category}
                      </span>
                      {story.trending && (
                        <div className="flex items-center space-x-1 text-seer-teal">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-sm font-medium">Trending</span>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">{story.relevanceScore}% relevant</div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-3 leading-tight line-clamp-2">
                    {story.title}
                  </h3>
                  
                  <p className="text-body text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                    {story.summary}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {story.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-md font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                      <span className="font-medium text-slate-700">{story.source}</span>
                      <span>{story.readTime}</span>
                      <span>{story.publishedAt}</span>
                    </div>
                    
                    <button className="seer-btn-ghost text-sm inline-flex items-center space-x-1">
                      <span>Read</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* Show All Stories */}
        {!showAllStories ? (
          <div className={`text-center mt-12 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '1s' }}>
            <button 
              onClick={() => setShowAllStories(true)}
              className="seer-btn-secondary inline-flex items-center space-x-2"
            >
              <span>Show All Stories</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className={`mt-12 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '1s' }}>
            {/* All Stories Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-heading-2 text-slate-900">All AI Stories</h2>
              <button 
                onClick={() => setShowAllStories(false)}
                className="text-slate-500 hover:text-slate-700 transition-colors"
              >
                Hide
              </button>
            </div>

            {/* Filter Bar */}
            <div className="seer-card p-4 mb-6">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Filter by:</span>
                </div>
                
                <div className="flex items-center space-x-4 overflow-x-auto">
                  <select className="seer-input py-2 px-3 text-sm min-w-[120px]">
                    <option value="">Source</option>
                    <option value="techcrunch">TechCrunch</option>
                    <option value="verge">The Verge</option>
                    <option value="mit">MIT Technology Review</option>
                    <option value="nature">Nature</option>
                    <option value="venturebeat">VentureBeat</option>
                  </select>
                  
                  <select className="seer-input py-2 px-3 text-sm min-w-[140px]">
                    <option value="">Content Type</option>
                    <option value="breaking-news">Breaking News</option>
                    <option value="research">Research Papers</option>
                    <option value="analysis">Industry Analysis</option>
                    <option value="tutorials">Technical Tutorials</option>
                  </select>
                  
                  <select className="seer-input py-2 px-3 text-sm min-w-[120px]">
                    <option value="">Industry</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance</option>
                    <option value="technology">Technology</option>
                    <option value="manufacturing">Manufacturing</option>
                  </select>
                  
                  <select className="seer-input py-2 px-3 text-sm min-w-[120px]">
                    <option value="">Category</option>
                    <option value="ai-models">AI Models</option>
                    <option value="hardware">Hardware</option>
                    <option value="ai-safety">AI Safety</option>
                    <option value="research">Research</option>
                    <option value="business">Business</option>
                  </select>
                </div>
              </div>
            </div>

            {/* All Stories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allStories.map((story, index) => (
                <article
                  key={story.id}
                  className={`story-card-horizontal ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: `${1.2 + index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className={`seer-badge border ${getCategoryColor(story.category)}`}>
                        {story.category}
                      </span>
                      {story.trending && (
                        <div className="flex items-center space-x-1 text-seer-teal">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-sm font-medium">Trending</span>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">{story.relevanceScore}% relevant</div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-3 leading-tight line-clamp-2">
                    {story.title}
                  </h3>
                  
                  <p className="text-body text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                    {story.summary}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {story.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-md font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                      <span className="font-medium text-slate-700">{story.source}</span>
                      <span>{story.readTime}</span>
                      <span>{story.publishedAt}</span>
                    </div>
                    
                    <button className="seer-btn-ghost text-sm inline-flex items-center space-x-1">
                      <span>Read</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
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
