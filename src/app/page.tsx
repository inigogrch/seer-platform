'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, Sparkles, Play, ArrowRight, Zap, Target, Clock, ChevronDown, Filter, Bot, FileText, CheckSquare, Check } from 'lucide-react'

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const [showTooltip, setShowTooltip] = useState(false)

  const scrollToFeatures = () => {
    document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, timestamp: new Date().toISOString() })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Check if it's a duplicate email
        if (data.message === 'Email already registered') {
          setSubmitMessage('You\'re already on the waitlist!')
        } else {
          setSubmitMessage('Thanks for joining! We\'ll be in touch soon.')
          setEmail('')
        }
      } else {
        setSubmitMessage('Something went wrong. Please try again.')
      }
    } catch (error) {
      setSubmitMessage('Something went wrong. Please try again.')
    }
    
    setIsSubmitting(false)
    setTimeout(() => setSubmitMessage(''), 5000)
  }

  const features = [
    {
      icon: <Filter className="w-5 md:w-6 h-5 md:h-6 text-white" />,
      title: "High-Signal Content",
      description: "Curated content sources from the AI industry to help you separate signal from noise"
    },
    {
      icon: <Bot className="w-5 md:w-6 h-5 md:h-6 text-white" />,
      title: "AI-Powered Personalization", 
      description: "Specialized agents that deliver the most relevant updates based on your context"
    },
    {
      icon: <FileText className="w-5 md:w-6 h-5 md:h-6 text-white" />,
      title: "Smart Summarization",
      description: "One-click summaries and deeper analyses for a digestible reading experience"
    },
    {
      icon: <CheckSquare className="w-5 md:w-6 h-5 md:h-6 text-white" />,
      title: "Daily Actionability",
      description: "Daily updates and action items to help you move from learning to execution"
    }
  ]

  return (
    <div className="relative min-h-screen">
      {/* Floating background elements with gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Large gradient orbs */}
        <div className="absolute -top-40 -right-40 w-80 md:w-96 h-80 md:h-96 bg-gradient-to-br from-seer-primary/20 to-seer-accent/15 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute top-1/3 -left-40 w-72 md:w-80 h-72 md:h-80 bg-gradient-to-tr from-seer-accent/20 to-seer-primary/15 rounded-full blur-3xl animate-float-medium"></div>
        <div className="absolute top-[60%] right-1/3 w-64 md:w-72 h-64 md:h-72 bg-gradient-to-bl from-seer-primary/15 to-seer-accent/20 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-[10%] -left-20 w-80 md:w-96 h-80 md:h-96 bg-gradient-to-tr from-seer-primary/15 to-seer-accent/20 rounded-full blur-3xl animate-float-medium" style={{ animationDelay: '5s' }}></div>
        <div className="absolute bottom-[30%] right-[10%] w-72 md:w-80 h-72 md:h-80 bg-gradient-to-bl from-seer-accent/20 to-seer-primary/15 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '7s' }}></div>
        
        {/* Animated dots with movement */}
        <div className="absolute top-20 left-1/4 w-2 md:w-3 h-2 md:h-3 bg-seer-primary/40 rounded-full animate-float-dot-1" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-40 right-1/3 w-1.5 md:w-2 h-1.5 md:h-2 bg-seer-accent/40 rounded-full animate-float-dot-2" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-60 left-1/3 w-3 md:w-4 h-3 md:h-4 bg-seer-primary/40 rounded-full animate-float-dot-3" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[70%] right-1/4 w-2 md:w-3 h-2 md:h-3 bg-seer-accent/40 rounded-full animate-float-dot-1" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-[50%] left-1/5 w-1.5 md:w-2 h-1.5 md:h-2 bg-seer-primary/40 rounded-full animate-float-dot-2" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-1/2 right-1/5 w-3 md:w-5 h-3 md:h-5 bg-seer-accent/40 rounded-full animate-float-dot-3" style={{ animationDelay: '2.5s' }}></div>
        <div className="absolute bottom-40 left-2/3 w-2 md:w-3 h-2 md:h-3 bg-seer-primary/40 rounded-full animate-float-dot-2" style={{ animationDelay: '1.2s' }}></div>
        <div className="absolute top-1/4 right-2/3 w-3 md:w-4 h-3 md:h-4 bg-seer-accent/40 rounded-full animate-float-dot-1" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-[85%] left-1/2 w-2 md:w-3 h-2 md:h-3 bg-seer-primary/40 rounded-full animate-float-dot-3" style={{ animationDelay: '4s' }}></div>
        <div className="absolute bottom-[15%] right-1/2 w-1.5 md:w-2 h-1.5 md:h-2 bg-seer-accent/40 rounded-full animate-float-dot-1" style={{ animationDelay: '2.8s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 md:px-6 py-4 md:py-6 w-full">
        <div className="flex items-center space-x-2 md:space-x-3">
          <div className="w-8 md:w-10 h-8 md:h-10 seer-glass rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-seer-primary/20">
            <Eye className="w-5 md:w-6 h-5 md:h-6 text-white" />
          </div>
          <span className="text-xl md:text-2xl font-bold font-serif text-white tracking-tight">Seer</span>
        </div>
        <div className="relative">
          <Link 
            href="/onboarding"
            className="seer-btn-primary inline-flex items-center space-x-2"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Link> 
          {/*
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="seer-btn-primary inline-flex items-center space-x-1.5 md:space-x-2 !px-4 md:!px-6 !py-2 md:!py-3 !text-sm md:!text-base"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 md:w-4 h-3.5 md:h-4" />
          </button>
          {showTooltip && (
            <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 px-2.5 md:px-3 py-1 md:py-1.5 bg-slate-900 text-white text-xs md:text-sm rounded-lg whitespace-nowrap z-50 shadow-lg">
              Coming Soon
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-slate-900"></div>
            </div>
          )} 
          */}
        </div>
      </header>

      {/* Hero Section - First View */}
      <main className="relative z-10 w-full px-6 min-h-[calc(100vh-100px)] flex flex-col">
        <div className="text-center flex-1 flex flex-col justify-center py-20">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 seer-glass text-white px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold mb-6 md:mb-8 mx-auto">
            <Sparkles className="w-3 md:w-4 h-3 md:h-4" />
            <span>Agent-Powered AI Radar</span>
          </div>

          {/* Main heading */}
          <div>
            <h1 className="text-4xl md:text-7xl font-serif font-semibold tracking-tight text-white mb-3 md:mb-4 leading-none">
              Stay Ahead in AI
            </h1>
            <h1 className="text-4xl md:text-7xl font-serif font-semibold tracking-tight seer-text-gradient mb-6 md:mb-8 leading-none">
              Without the Overwhelm
            </h1>
          </div>

          {/* Description */}
          <div>
            <p className="text-base md:text-xl text-white/80 max-w-4xl mx-auto mb-10 md:mb-12 leading-relaxed">
              Seer delivers personalized AI news, blogs, and insights tailored to your role and 
              projects. Get smart summaries, actionable takeaways, and never miss what 
              matters to your career.
            </p>
          </div>

          {/* CTA Buttons */}
          {/* <div className="flex items-center justify-center space-x-6">
            <Link 
              href="/onboarding"
              className="seer-btn-primary text-lg inline-flex items-center space-x-2"
            >
              <span>Start Your Daily Brief</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="seer-btn-secondary text-lg inline-flex items-center space-x-2">
              <Play className="w-5 h-5" />
              <span>View Demo</span>
            </button>
          </div> */}

          {/* Waitlist Form */}
          <div className="w-full max-w-[410px] mx-auto px-4">
            <form onSubmit={handleWaitlistSubmit} className="flex items-center gap-2 md:gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email to join the waitlist"
                required
                className="flex-1 min-w-0 px-4 md:px-6 py-3 md:py-4 text-sm md:text-base text-white rounded-xl focus:outline-none transition-all seer-glass"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-shrink-0 w-12 md:w-14 h-12 md:h-14 rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-seer-primary/20 seer-glass"
                title={isSubmitting ? 'Joining...' : 'Join Waitlist'}
              >
                <Check className="w-5 md:w-6 h-5 md:h-6 text-white" />
              </button>
            </form>
            {submitMessage && (
              <p className={`mt-3 md:mt-4 text-center text-sm md:text-base font-medium ${
                submitMessage.includes('Thanks') 
                  ? 'text-green-400' 
                  : submitMessage.includes('already') 
                    ? 'text-amber-400' 
                    : 'text-red-400'
              }`}>
                {submitMessage}
              </p>
            )}
          </div>
        </div>

        {/* Scroll Down Indicator - Moved to bottom */}
        <div className="pb-10 flex flex-col items-center">
          <button 
            onClick={scrollToFeatures}
            className="group flex flex-col items-center space-y-2 text-white/60 hover:text-white transition-colors duration-300 cursor-pointer"
          >
            <span className="text-xs md:text-sm font-medium">Discover More</span>
            <ChevronDown className="w-6 md:w-8 h-6 md:h-8 animate-bounce-slow" />
          </button>
        </div>
      </main>

      {/* Features Section - Second View */}
      <section id="features-section" className="relative z-10 w-full px-6 py-32 min-h-screen">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-3 md:mb-4">
            Seer The Future Of AI
          </h2>
          <p className="text-sm md:text-xl text-white/70 max-w-5xl mx-auto px-4">
            Powerful features designed to help tech professionals stay ahead of the coming wave
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto mb-20 md:mb-24">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="seer-card p-6 md:p-10 group"
            >
              <div className="flex flex-col items-center text-center space-y-3 md:space-y-4">
                <div className="flex-shrink-0 w-12 md:w-16 h-12 md:h-16 bg-gradient-to-r from-seer-primary/30 to-seer-accent/30 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-seer-primary/10">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg md:text-2xl font-serif font-bold text-white mb-2 md:mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm md:text-base text-white/70 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        {/* <div className="relative overflow-hidden bg-white/70 backdrop-blur-md rounded-2xl border-2 border-seer-primary/20 text-center p-16 max-w-4xl mx-auto shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-seer-primary/15 to-transparent rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-seer-accent/25 to-transparent rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-heading-1 text-slate-900 mb-4">
              Ready to Transform Your AI News Experience?
            </h2>
            <p className="text-body-large text-slate-600 mb-10 max-w-2xl mx-auto">
              Join thousands of tech professionals who trust Seer for their daily AI updates
            </p>
            <Link 
              href="/onboarding"
              className="seer-btn-primary text-lg inline-flex items-center space-x-2"
            >
              <span>Get Started - It's Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div> */}
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-6 md:py-8 seer-glass">
        <div className="w-full px-6 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="w-6 md:w-8 h-6 md:h-8 seer-glass rounded-lg flex items-center justify-center shadow-md shadow-seer-primary/10">
              <Eye className="w-4 md:w-5 h-4 md:h-5 text-white" />
            </div>
            <span className="text-xs md:text-sm font-semibold font-serif text-white">Seer</span>
            <span className="text-xs md:text-sm text-white/60 hidden sm:inline">AI News for Tech Professionals</span>
          </div>
          <div className="text-xs md:text-sm text-white/50 text-center md:text-left">
            © 2025 Seer. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
