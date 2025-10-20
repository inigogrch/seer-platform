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
      
      if (response.ok) {
        setSubmitMessage('Thanks for joining! We\'ll be in touch soon.')
        setEmail('')
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
      icon: <Filter className="w-6 h-6 text-white" />,
      title: "High-Signal Content",
      description: "Curated content sources from the AI industry to help you separate signal from noise"
    },
    {
      icon: <Bot className="w-6 h-6 text-white" />,
      title: "AI-Powered Personalization", 
      description: "Specialized agents that deliver the most relevant updates based on your context"
    },
    {
      icon: <FileText className="w-6 h-6 text-white" />,
      title: "Smart Summarization",
      description: "One-click summaries and deeper analyses for a digestible reading experience"
    },
    {
      icon: <CheckSquare className="w-6 h-6 text-white" />,
      title: "Daily Actionability",
      description: "Daily updates and action items to help you move from learning to execution"
    }
  ]

  return (
    <div className="relative">
      {/* Full-page gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 -z-10"></div>
      
      {/* Enhanced Floating background elements with gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Large gradient orbs - Stronger and positioned for full page coverage */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-seer-primary/30 to-seer-accent/25 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-gradient-to-tr from-seer-accent/35 to-seer-primary/30 rounded-full blur-3xl animate-float-medium"></div>
        <div className="absolute top-[60%] right-1/3 w-72 h-72 bg-gradient-to-bl from-seer-primary/28 to-seer-accent/25 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-[10%] -left-20 w-96 h-96 bg-gradient-to-tr from-seer-primary/25 to-seer-accent/30 rounded-full blur-3xl animate-float-medium" style={{ animationDelay: '5s' }}></div>
        <div className="absolute bottom-[30%] right-[10%] w-80 h-80 bg-gradient-to-bl from-seer-accent/30 to-seer-primary/25 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '7s' }}></div>
        
        {/* Animated dots with movement - distributed across full page */}
        <div className="absolute top-20 left-1/4 w-3 h-3 bg-seer-primary rounded-full animate-float-dot-1" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-40 right-1/3 w-2 h-2 bg-seer-accent rounded-full animate-float-dot-2" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-60 left-1/3 w-4 h-4 bg-seer-primary rounded-full animate-float-dot-3" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[70%] right-1/4 w-3 h-3 bg-seer-accent rounded-full animate-float-dot-1" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-[50%] left-1/5 w-2 h-2 bg-seer-primary rounded-full animate-float-dot-2" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-1/2 right-1/5 w-5 h-5 bg-seer-accent rounded-full animate-float-dot-3" style={{ animationDelay: '2.5s' }}></div>
        <div className="absolute bottom-40 left-2/3 w-3 h-3 bg-seer-primary rounded-full animate-float-dot-2" style={{ animationDelay: '1.2s' }}></div>
        <div className="absolute top-1/4 right-2/3 w-4 h-4 bg-seer-accent rounded-full animate-float-dot-1" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-[85%] left-1/2 w-3 h-3 bg-seer-primary rounded-full animate-float-dot-3" style={{ animationDelay: '4s' }}></div>
        <div className="absolute bottom-[15%] right-1/2 w-2 h-2 bg-seer-accent rounded-full animate-float-dot-1" style={{ animationDelay: '2.8s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 w-full">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-seer-primary to-seer-accent rounded-xl flex items-center justify-center shadow-lg shadow-seer-primary/30">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">Seer</span>
        </div>
        <div className="relative">
        {/*
          <Link 
            href="/onboarding"
            className="seer-btn-primary inline-flex items-center space-x-2"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Link> 
          */}
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="seer-btn-primary inline-flex items-center space-x-2 !px-6 !py-3"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          {showTooltip && (
            <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-sm rounded-lg whitespace-nowrap z-50 shadow-lg">
              Coming Soon
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-slate-900"></div>
            </div>
          )} 
        </div>
      </header>

      {/* Hero Section - First View */}
      <main className="relative z-10 w-full px-6 min-h-[calc(100vh-100px)] flex flex-col">
        <div className="text-center flex-1 flex flex-col justify-center py-20">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 backdrop-blur-sm bg-white/80 text-seer-primary-dark px-4 py-2 rounded-full text-sm font-semibold mb-8 border border-seer-primary/20 mx-auto">
            <Sparkles className="w-4 h-4" />
            <span>Agent-Powered AI Radar</span>
          </div>

          {/* Main heading */}
          <div>
            <h1 className="text-6xl md:text-7xl font-semibold tracking-tight text-slate-900 mb-4 leading-none">
              Stay Ahead in AI
            </h1>
            <h1 className="text-6xl md:text-7xl font-semibold tracking-tight seer-text-gradient mb-8 leading-none">
              Without the Overwhelm
            </h1>
          </div>

          {/* Description */}
          <div>
            <p className="text-body-large text-slate-600 max-w-4xl mx-auto mb-12 leading-relaxed">
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
            <form onSubmit={handleWaitlistSubmit} className="flex items-center gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email to join the waitlist"
                required
                className="flex-1 min-w-0 px-6 py-4 text-base rounded-xl border-2 border-slate-200 focus:border-seer-primary focus:outline-none focus:ring-2 focus:ring-seer-primary/20 transition-all bg-white/80 backdrop-blur-sm"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-shrink-0 w-14 h-14 bg-gradient-to-r from-seer-primary to-seer-accent rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-seer-primary/30"
                title={isSubmitting ? 'Joining...' : 'Join Waitlist'}
              >
                <Check className="w-6 h-6 text-white" />
              </button>
            </form>
            {submitMessage && (
              <p className={`mt-4 text-center text-base font-medium ${submitMessage.includes('Thanks') ? 'text-green-600' : 'text-red-600'}`}>
                {submitMessage}
              </p>
            )}
          </div>
        </div>

        {/* Scroll Down Indicator - Moved to bottom */}
        <div className="pb-10 flex flex-col items-center">
          <button 
            onClick={scrollToFeatures}
            className="group flex flex-col items-center space-y-2 text-slate-400 hover:text-seer-primary transition-colors duration-300 cursor-pointer"
          >
            <span className="text-sm font-medium">Discover More</span>
            <ChevronDown className="w-8 h-8 animate-bounce-slow" />
          </button>
        </div>
      </main>

      {/* Features Section - Second View */}
      <section id="features-section" className="relative z-10 w-full px-6 py-32 min-h-screen">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-heading-1 text-slate-900 mb-4">
            Seer The Future Of AI
          </h2>
          <p className="text-body-large text-slate-600 max-w-3xl mx-auto">
            Powerful features designed to help tech professionals stay ahead of the coming wave
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-24">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="seer-card p-10 group hover:bg-gradient-to-br hover:from-white hover:to-seer-primary-light/40"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-r from-seer-primary to-seer-accent rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-seer-primary/20">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-body text-slate-600 leading-relaxed">
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
      <footer className="relative z-10 border-t border-slate-200/50 py-8 backdrop-blur-sm">
        <div className="w-full px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-seer-primary to-seer-accent rounded-lg flex items-center justify-center shadow-md shadow-seer-primary/30">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-700">Seer</span>
            <span className="text-sm text-slate-500">AI News for Tech Professionals</span>
          </div>
          <div className="text-sm text-slate-400">
            © 2025 Seer. All rights reserved. Built with Next.js and AI
          </div>
        </div>
      </footer>
    </div>
  )
}
