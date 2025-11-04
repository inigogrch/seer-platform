'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Eye,
  Grid3X3,
  MessageSquare,
  Bookmark,
  User,
  TrendingUp,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

type ContentType =
  | 'Research'
  | 'Opinion'
  | 'Learning/Educational'
  | 'News'
  | 'Case Study'
  | 'Event Coverage'
  | 'Review/Benchmark'
  | 'Interview/Profile'
  | 'Dataset/Resource'
  | 'Discussion'
  | 'Regulatory/Policy'

interface Story {
  id: string
  title: string
  summary: string
  source: string
  contentType: ContentType
  aiTags: string[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [showAllStories, setShowAllStories] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Placeholder stories data with comprehensive content types
  const allStories: Story[] = [
    {
      id: '1',
      title: "Anthropic releases Claude 3.5 Sonnet with enhanced reasoning capabilities",
      summary: "The latest model shows significant improvements in complex reasoning tasks and extended context windows up to 200K tokens.",
      source: "TechCrunch",
      contentType: 'News',
      aiTags: ['LLMs', 'Claude', 'Reasoning']
    },
    {
      id: '2',
      title: "Building production-grade AI agents: A comprehensive guide",
      summary: "Deep dive into agent architectures, tool use, and evaluation frameworks for reliable autonomous systems.",
      source: "Towards AI",
      contentType: 'Learning/Educational',
      aiTags: ['Agents', 'Tools', 'Production']
    },
    {
      id: '3',
      title: "New evaluation framework measures LLM hallucination rates across domains",
      summary: "Researchers introduce comprehensive benchmark testing factual accuracy in medical, legal, and technical domains.",
      source: "ArXiv",
      contentType: 'Research',
      aiTags: ['Evals', 'Hallucinations', 'Benchmarks']
    },
    {
      id: '4',
      title: "Why prompt engineering is becoming a critical skill",
      summary: "Expert analysis on the evolving role of prompt engineers and the economic value they bring to organizations.",
      source: "The Verge",
      contentType: 'Opinion',
      aiTags: ['Prompting', 'Career', 'Industry']
    },
    {
      id: '5',
      title: "How Stripe built their AI-powered fraud detection system",
      summary: "Behind-the-scenes look at Stripe's ML infrastructure processing billions of transactions with <0.1% false positives.",
      source: "Stripe Engineering",
      contentType: 'Case Study',
      aiTags: ['MLOps', 'Production', 'Infrastructure']
    },
    {
      id: '6',
      title: "NeurIPS 2024: Key takeaways from the foundation models track",
      summary: "Conference highlights include new architectures, scaling laws research, and alignment breakthroughs.",
      source: "AI Conference Digest",
      contentType: 'Event Coverage',
      aiTags: ['NeurIPS', 'Research', 'Foundation Models']
    },
    {
      id: '7',
      title: "Vector databases compared: Pinecone vs Weaviate vs Qdrant",
      summary: "Performance benchmarks and cost analysis across 100M+ vector workloads with different query patterns.",
      source: "DB Weekly",
      contentType: 'Review/Benchmark',
      aiTags: ['RAG', 'Vectors', 'Infrastructure']
    },
    {
      id: '8',
      title: "Interview: Anthropic's CEO on constitutional AI and safety research",
      summary: "Dario Amodei discusses the company's approach to AI alignment and lessons learned from Claude deployment.",
      source: "MIT Tech Review",
      contentType: 'Interview/Profile',
      aiTags: ['Alignment', 'Safety', 'Leadership']
    },
    {
      id: '9',
      title: "Meta releases Llama 3 instruction-tuned models and benchmark suite",
      summary: "Open-source release includes 8B and 70B parameter models with new evaluation datasets for reasoning tasks.",
      source: "Meta AI",
      contentType: 'Dataset/Resource',
      aiTags: ['Llama', 'Open Source', 'Datasets']
    },
    {
      id: '10',
      title: "Community debate: Is fine-tuning dead in the era of long context?",
      summary: "Engineers discuss trade-offs between context injection and fine-tuning for domain adaptation.",
      source: "Hacker News",
      contentType: 'Discussion',
      aiTags: ['Fine-tuning', 'Context', 'Best Practices']
    },
    {
      id: '11',
      title: "EU AI Act implementation: What developers need to know",
      summary: "Compliance guide covering model classification, documentation requirements, and enforcement timelines.",
      source: "AI Policy Hub",
      contentType: 'Regulatory/Policy',
      aiTags: ['Policy', 'Compliance', 'EU']
    },
    {
      id: '12',
      title: "Constitutional AI: Training harmless and helpful assistants",
      summary: "Anthropic's research on using AI feedback to create aligned models without extensive human oversight.",
      source: "Anthropic Research",
      contentType: 'Research',
      aiTags: ['Alignment', 'Safety', 'RLHF']
    },
    {
      id: '13',
      title: "OpenAI introduces GPT-4 Turbo with vision and function calling",
      summary: "Enhanced multimodal capabilities and improved function calling make GPT-4 Turbo more versatile for applications.",
      source: "OpenAI Blog",
      contentType: 'News',
      aiTags: ['GPT-4', 'Multimodal', 'Functions']
    },
    {
      id: '14',
      title: "Prompt engineering patterns for improved LLM outputs",
      summary: "Best practices and reusable patterns for crafting effective prompts across different use cases.",
      source: "AI Explained",
      contentType: 'Learning/Educational',
      aiTags: ['Prompting', 'LLMs', 'Engineering']
    },
    {
      id: '15',
      title: "Fine-tuning strategies for domain-specific language models",
      summary: "Comparative analysis of LoRA, QLoRA, and full fine-tuning approaches for specialized applications.",
      source: "Hugging Face",
      contentType: 'Learning/Educational',
      aiTags: ['Fine-tuning', 'LoRA', 'Optimization']
    }
  ]

  // First 8 stories for horizontal scroll
  const featuredStories = allStories.slice(0, 8)
  const remainingStories = allStories.slice(8)

  // Clean, minimal color scheme for content types
  const contentTypeColors: Record<ContentType, string> = {
    'Research': 'bg-purple-50 text-purple-700 border-purple-200',
    'Opinion': 'bg-amber-50 text-amber-700 border-amber-200',
    'Learning/Educational': 'bg-blue-50 text-blue-700 border-blue-200',
    'News': 'bg-red-50 text-red-700 border-red-200',
    'Case Study': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Event Coverage': 'bg-pink-50 text-pink-700 border-pink-200',
    'Review/Benchmark': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Interview/Profile': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'Dataset/Resource': 'bg-teal-50 text-teal-700 border-teal-200',
    'Discussion': 'bg-orange-50 text-orange-700 border-orange-200',
    'Regulatory/Policy': 'bg-slate-50 text-slate-700 border-slate-300'
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
      {/* Enhanced Gradient Background Effects - Same as onboarding */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large gradient orbs */}
        <div className="absolute -top-40 -right-40 w-80 md:w-96 h-80 md:h-96 bg-gradient-to-br from-seer-primary/20 to-seer-accent/18 md:from-seer-primary/30 md:to-seer-accent/25 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/3 -left-40 w-72 md:w-80 h-72 md:h-80 bg-gradient-to-tr from-seer-accent/22 to-seer-primary/20 md:from-seer-accent/35 md:to-seer-primary/30 rounded-full blur-3xl animate-float-medium" />
        <div className="absolute top-[60%] right-1/3 w-64 md:w-72 h-64 md:h-72 bg-gradient-to-bl from-seer-primary/20 to-seer-accent/18 md:from-seer-primary/28 md:to-seer-accent/25 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '3s' }} />
        <div className="absolute bottom-[10%] -left-20 w-80 md:w-96 h-80 md:h-96 bg-gradient-to-tr from-seer-primary/18 to-seer-accent/20 md:from-seer-primary/25 md:to-seer-accent/30 rounded-full blur-3xl animate-float-medium" style={{ animationDelay: '5s' }} />

        {/* Animated dots with movement */}
        <div className="absolute top-20 left-1/4 w-2 md:w-3 h-2 md:h-3 bg-seer-primary opacity-60 rounded-full animate-float-dot-1" style={{ animationDelay: '0s' }} />
        <div className="absolute top-40 right-1/3 w-1.5 md:w-2 h-1.5 md:h-2 bg-seer-accent opacity-60 rounded-full animate-float-dot-2" style={{ animationDelay: '1s' }} />
        <div className="absolute top-60 left-1/3 w-3 md:w-4 h-3 md:h-4 bg-seer-primary opacity-60 rounded-full animate-float-dot-3" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[70%] right-1/4 w-2 md:w-3 h-2 md:h-3 bg-seer-accent opacity-60 rounded-full animate-float-dot-1" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[50%] left-1/5 w-1.5 md:w-2 h-1.5 md:h-2 bg-seer-primary opacity-60 rounded-full animate-float-dot-2" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/2 right-1/5 w-3 md:w-4 h-3 md:h-4 bg-seer-accent opacity-60 rounded-full animate-float-dot-3" style={{ animationDelay: '2.5s' }} />
      </div>

      {/* Scrollable Content */}
      <div className="h-full overflow-y-auto scroll-smooth">
        <div className="relative">
          {/* Redesigned Header */}
          <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 shadow-lg shadow-slate-200/50">
            <div className="px-8 py-3 md:py-4">
              <div className="flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 bg-seer-primary/10 rounded-lg flex items-center justify-center border border-seer-primary/20">
                    <Eye className="w-5 h-5 text-seer-primary" />
                  </div>
                  <span className="text-xl font-light text-slate-900 tracking-tight">Seer</span>
                </div>

                {/* Navigation */}
                <nav className="flex items-center space-x-2">
                  <button className="px-5 py-2.5 text-sm font-normal text-seer-primary bg-seer-primary/10 rounded-xl border border-seer-primary/20 transition-all hover:bg-seer-primary/15">
                    <Grid3X3 className="w-4 h-4 inline mr-2" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => router.push('/chat')}
                    className="px-5 py-2.5 text-sm font-light text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-all"
                  >
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Chat
                  </button>
                  <button
                    onClick={() => router.push('/saved')}
                    className="px-5 py-2.5 text-sm font-light text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-all"
                  >
                    <Bookmark className="w-4 h-4 inline mr-2" />
                    Saved
                  </button>
                  <button
                    onClick={() => router.push('/profile')}
                    className="px-5 py-2.5 text-sm font-light text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-all"
                  >
                    <User className="w-4 h-4 inline mr-2" />
                    Profile
                  </button>
                </nav>
              </div>
            </div>
          </header>

          {/* Main Content - Full Width */}
          <main className="px-8 py-8">
            {/* Page Title - Minimalist */}
            <div className={`mb-7 text-center ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
              <h1 className="text-4xl md:text-5xl font-extralight text-slate-900 tracking-tight mb-3">
                Your Daily Brief
              </h1>
              <p className="text-base text-slate-500 font-extralight">
                {allStories.length} items curated to help you advance in your AI-related pursuits
              </p>
            </div>

            {/* Two-Card Layout: Summary + Trending */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
              {/* Summary Card */}
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl border-2 border-slate-200/60 p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center space-x-2 mb-6">
                  <Sparkles className="w-5 h-5 text-seer-primary" />
                  <h2 className="text-xl font-light text-slate-900">Summary</h2>
                </div>
                <div className="space-y-3 text-base text-slate-700 font-extralight leading-relaxed">
                  <p>
                    You're most interested in <span className="font-normal text-slate-900">LLMs</span>, <span className="font-normal text-slate-900">Agents</span>, and <span className="font-normal text-slate-900">RAG</span> topics today.
                  </p>
                  <p>
                    This week you've read <span className="font-normal text-slate-900">24 stories</span>, saved <span className="font-normal text-slate-900">18</span>, and your engagement is <span className="font-normal text-seer-primary">up 15%</span> from last week.
                  </p>
                  <p>
                    Top sources: <span className="font-normal text-slate-900">TechCrunch</span>, <span className="font-normal text-slate-900">ArXiv</span>, <span className="font-normal text-slate-900">Anthropic Research</span>.
                  </p>
                </div>
              </div>

              {/* Trending Topics Card */}
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl border-2 border-slate-200/60 p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center space-x-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-seer-primary" />
                  <h2 className="text-xl font-light text-slate-900">Trending Topics</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-seer-primary rounded-full"></div>
                      <span className="text-sm text-slate-700 font-extralight">Claude 3.5 Sonnet</span>
                    </div>
                    <span className="text-xs font-medium text-seer-primary">↑ 45%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-seer-primary rounded-full"></div>
                      <span className="text-sm text-slate-700 font-extralight">AI Agents</span>
                    </div>
                    <span className="text-xs font-medium text-seer-primary">↑ 38%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-seer-primary rounded-full"></div>
                      <span className="text-sm text-slate-700 font-extralight">GPT-4 Turbo</span>
                    </div>
                    <span className="text-xs font-medium text-seer-primary">↑ 32%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-seer-primary rounded-full"></div>
                      <span className="text-sm text-slate-700 font-extralight">RAG Systems</span>
                    </div>
                    <span className="text-xs font-medium text-seer-primary">↑ 28%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-seer-primary rounded-full"></div>
                      <span className="text-sm text-slate-700 font-extralight">LLM Evals</span>
                    </div>
                    <span className="text-xs font-medium text-seer-primary">↑ 21%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Stories - Horizontal Scroll */}
            <div className={`mb-4 ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
              <h2 className="text-2xl font-light text-slate-900 mb-4 px-4">Featured Stories</h2>

              {/* Horizontal scrollable container */}
              <div className="overflow-x-auto overflow-y-visible pb-6 pt-2 -mx-4 px-4 scrollbar-hide">
                <div className="flex space-x-5" style={{ width: 'max-content' }}>
                  {featuredStories.map((story, index) => (
                    <article
                      key={story.id}
                      className={`group bg-white/60 backdrop-blur-xl rounded-2xl border-2 border-slate-200/60 p-8 hover:bg-white/70 hover:border-seer-primary/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer w-[400px] flex-shrink-0 ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}
                      style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                    >
                      {/* Source */}
                      <div className="text-sm font-medium text-seer-primary mb-4">
                        {story.source}
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-medium text-slate-900 mb-2 leading-snug line-clamp-2 group-hover:text-seer-primary transition-colors">
                        {story.title}
                      </h3>

                      {/* Summary */}
                      <p className="text-sm text-slate-600 font-extralight leading-relaxed mb-4 line-clamp-2">
                        {story.summary}
                      </p>

                      {/* Content Type Tag */}
                      <div className="mb-3">
                        <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${contentTypeColors[story.contentType]}`}>
                          {story.contentType}
                        </span>
                      </div>

                      {/* AI Tags */}
                      <div className="flex flex-wrap gap-2">
                        {story.aiTags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-1 bg-slate-100/50 text-slate-700 text-xs rounded-md font-extralight border border-slate-200/50"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            {/* Show All Stories Button */}
            <div className={`text-center mb-10 ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.8s' }}>
              <button
                onClick={() => setShowAllStories(!showAllStories)}
                className="inline-flex items-center space-x-2 px-8 py-3 bg-white/60 backdrop-blur-xl border-2 border-slate-200/60 rounded-xl text-slate-900 font-extralight hover:bg-white/70 hover:border-seer-primary/50 hover:shadow-lg transition-all"
              >
                <span>{showAllStories ? 'Hide' : 'Show'} All Stories</span>
                {showAllStories ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* All Stories Grid (Expandable) */}
            {showAllStories && (
              <div className={`${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
                <h2 className="text-2xl font-light text-slate-900 mb-6 px-4">More Stories</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 px-4 pt-2 pb-2">
                  {remainingStories.map((story, index) => (
                    <article
                      key={story.id}
                      className={`group bg-white/60 backdrop-blur-xl rounded-2xl border-2 border-slate-200/60 p-8 hover:bg-white/70 hover:border-seer-primary/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}
                      style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                    >
                      {/* Source */}
                      <div className="text-sm font-medium text-seer-primary mb-4">
                        {story.source}
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-medium text-slate-900 mb-2 leading-snug line-clamp-2 group-hover:text-seer-primary transition-colors">
                        {story.title}
                      </h3>

                      {/* Summary */}
                      <p className="text-sm text-slate-600 font-extralight leading-relaxed mb-4 line-clamp-2">
                        {story.summary}
                      </p>

                      {/* Content Type Tag */}
                      <div className="mb-3">
                        <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${contentTypeColors[story.contentType]}`}>
                          {story.contentType}
                        </span>
                      </div>

                      {/* AI Tags */}
                      <div className="flex flex-wrap gap-2">
                        {story.aiTags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-1 bg-slate-100/50 text-slate-700 text-xs rounded-md font-extralight border border-slate-200/50"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Hide scrollbar but keep functionality */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
