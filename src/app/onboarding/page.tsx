'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Sparkles, Loader2, ArrowRight } from 'lucide-react'

// Types
type StepType = 'role' | 'industry' | 'team' | 'tasks' | 'tools' | 'problems' | 'complete'

interface OnboardingState {
  clientId: string
  currentStep: StepType
  responses: {
    role?: string
    industry?: string | string[]
    teamContext?: string
    tasks?: string[]
    tools?: string[]
    problems?: string[]
  }
  conversationHistory: Message[]
  startedAt: Date
}

interface Message {
  type: 'question' | 'answer' | 'options'
  content: string | React.ReactNode
  timestamp: number
  step: StepType
  options?: string[] // Store options for each question
  selectedAnswer?: string | string[] // Store what was selected
}

// Static options for role and industry
const ROLE_OPTIONS = [
  'Software Engineer',
  'Product Manager',
  'Data Scientist',
  'Founder & CEO',
  'Marketing Manager',
  'Sales Representative',
]

const INDUSTRY_OPTIONS = [
  'Healthcare & Life Sciences',
  'Financial Services',
  'Technology & Software',
  'Manufacturing',
  'Retail & E-commerce',
  'Education',
  'Media & Entertainment',
  'Transportation',
  'Energy & Utilities',
  'Government & Public Sector',
]

export default function OnboardingPage() {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<OnboardingState | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentOptions, setCurrentOptions] = useState<string[]>([])
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [customInput, setCustomInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Initialize or resume session
  useEffect(() => {
    initializeSession()
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const initializeSession = () => {
    // Try to resume from localStorage
    const savedState = localStorage.getItem('onboarding_state')
    if (savedState) {
      const parsedState = JSON.parse(savedState)
      parsedState.startedAt = new Date(parsedState.startedAt)
      setState(parsedState)
      setMessages(parsedState.conversationHistory || [])
      loadStep(parsedState.currentStep, parsedState)
    } else {
      // Create new session
      const clientId = crypto.randomUUID()
      const newState: OnboardingState = {
        clientId,
        currentStep: 'role',
        responses: {},
        conversationHistory: [],
        startedAt: new Date(),
      }
      setState(newState)
      saveState(newState)
      loadStep('role', newState)
    }
  }

  const saveState = (newState: OnboardingState) => {
    localStorage.setItem('onboarding_state', JSON.stringify(newState))
    // Also save to backend
    saveProgress(newState)
  }

  const saveProgress = async (currentState: OnboardingState) => {
    try {
      await fetch('/api/onboarding/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: currentState.clientId,
          currentStep: currentState.currentStep,
          responses: currentState.responses,
          conversationHistory: currentState.conversationHistory,
          startedAt: currentState.startedAt,
        }),
      })
    } catch (error) {
      console.error('Error saving progress:', error)
    }
  }

  const loadStep = async (step: StepType, currentState: OnboardingState) => {
    if (step === 'complete') {
      await completeOnboarding()
      return
    }

    // Load options based on step first
    let options: string[] = []
    if (step === 'role') {
      options = ROLE_OPTIONS
      setCurrentOptions(ROLE_OPTIONS)
    } else if (step === 'industry') {
      options = INDUSTRY_OPTIONS
      setCurrentOptions(INDUSTRY_OPTIONS)
    } else if (['team', 'tasks', 'tools', 'problems'].includes(step)) {
      await generateOptions(step, currentState)
      // Options will be set in generateOptions, we'll add them to message later
      return // Will add question after options are generated
    }

    // Add question message with options
    const question = getStepQuestion(step)
    const questionMsg: Message = {
      type: 'question',
      content: question,
      timestamp: Date.now(),
      step,
      options,
    }
    setMessages((prev) => [...prev, questionMsg])
  }

  const generateOptions = async (step: StepType, currentState: OnboardingState) => {
    setIsGenerating(true)
    
    // Add question first
    const question = getStepQuestion(step)
    const questionMsg: Message = {
      type: 'question',
      content: question,
      timestamp: Date.now(),
      step,
      options: [], // Will be filled after generation
    }
    setMessages((prev) => [...prev, questionMsg])
    
    try {
      const response = await fetch('/api/onboarding/generate-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step,
          context: currentState.responses,
        }),
      })

      const data = await response.json()
      const generatedOptions = data.options || []
      setCurrentOptions(generatedOptions)
      
      // Update the question message with options
      setMessages((prev) => {
        const updated = [...prev]
        const lastMsg = updated[updated.length - 1]
        if (lastMsg && lastMsg.type === 'question') {
          lastMsg.options = generatedOptions
        }
        return updated
      })
    } catch (error) {
      console.error('Error generating options:', error)
      setCurrentOptions([])
    } finally {
      setIsGenerating(false)
    }
  }

  const getStepQuestion = (step: StepType): string => {
    const questions: Record<StepType, string> = {
      role: "What's your role?",
      industry: 'Which industry best describes your work?',
      team: 'Tell me about your team setup',
      tasks: 'What are your main work activities?',
      tools: 'What tools and frameworks do you use?',
      problems: 'What challenges are you looking to solve?',
      complete: '',
    }
    return questions[step]
  }

  const getStepHint = (step: StepType): string => {
    const hints: Record<StepType, string> = {
      role: 'Select your role or type a custom one',
      industry: 'You can select multiple industries',
      team: 'Describe your team structure',
      tasks: 'Select tasks or describe your own',
      tools: 'Select all that apply',
      problems: 'What pain points do you face?',
      complete: '',
    }
    return hints[step]
  }

  const handleOptionSelect = (option: string) => {
    const step = state?.currentStep
    if (!step) return

    // Handle multi-select for industry, tasks, tools, problems
    if (['industry', 'tasks', 'tools', 'problems'].includes(step)) {
      setSelectedOptions((prev) =>
        prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
      )
    } else {
      // Single select for role, team
      setSelectedOptions([option])
    }
  }

  const canSkip = (step: StepType): boolean => {
    return ['team', 'tasks', 'problems'].includes(step)
  }

  const isRequired = (step: StepType): boolean => {
    return ['role', 'industry', 'tools'].includes(step)
  }

  const handleNext = async () => {
    if (!state) return

    const step = state.currentStep
    let answer: string | string[] = selectedOptions.length > 0 ? selectedOptions : customInput

    // Handle multi-select fields
    if (['industry', 'tasks', 'tools', 'problems'].includes(step)) {
      if (selectedOptions.length > 0) {
        answer = selectedOptions
      } else if (customInput.trim()) {
        answer = [customInput.trim()]
      }
    } else {
      answer = selectedOptions[0] || customInput.trim()
    }

    // Validate required fields
    if (isRequired(step) && (!answer || (Array.isArray(answer) && answer.length === 0))) {
      return
    }

    // Add answer message
    const answerMsg: Message = {
      type: 'answer',
      content: Array.isArray(answer) ? answer.join(', ') : answer,
      timestamp: Date.now(),
      step,
      selectedAnswer: answer,
    }
    setMessages((prev) => [...prev, answerMsg])

    // Update state
    const newResponses = { ...state.responses }
    const fieldMap: Record<StepType, keyof OnboardingState['responses']> = {
      role: 'role',
      industry: 'industry',
      team: 'teamContext',
      tasks: 'tasks',
      tools: 'tools',
      problems: 'problems',
      complete: 'role', // dummy
    }

    const field = fieldMap[step]
    if (field) {
      // @ts-ignore
      newResponses[field] = answer
    }

    // Move to next step
    const nextStep = getNextStep(step)
    const newState: OnboardingState = {
      ...state,
      currentStep: nextStep,
      responses: newResponses,
      conversationHistory: [...messages, answerMsg],
    }

    setState(newState)
    saveState(newState)

    // Reset for next step
    setSelectedOptions([])
    setCustomInput('')
    setCurrentOptions([])

    // Load next step
    await loadStep(nextStep, newState)
  }

  const handleSkip = async () => {
    if (!state) return
    const step = state.currentStep

    if (!canSkip(step)) return

    // Add skip message
    const skipMsg: Message = {
      type: 'answer',
      content: 'Skipped',
      timestamp: Date.now(),
      step,
    }
    setMessages((prev) => [...prev, skipMsg])

    // Move to next step without saving response
    const nextStep = getNextStep(step)
    const newState: OnboardingState = {
      ...state,
      currentStep: nextStep,
      conversationHistory: [...messages, skipMsg],
    }

    setState(newState)
    saveState(newState)

    setSelectedOptions([])
    setCustomInput('')
    setCurrentOptions([])

    await loadStep(nextStep, newState)
  }

  const getNextStep = (current: StepType): StepType => {
    const flow: StepType[] = ['role', 'industry', 'team', 'tasks', 'tools', 'problems', 'complete']
    const currentIndex = flow.indexOf(current)
    return flow[currentIndex + 1] || 'complete'
  }

  const completeOnboarding = async () => {
    if (!state) return

    setIsLoading(true)

    try {
      const completedAt = new Date()
      const timeSpentSeconds = Math.floor(
        (completedAt.getTime() - state.startedAt.getTime()) / 1000
      )

      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: state.clientId,
          responses: state.responses,
          conversationHistory: state.conversationHistory,
          startedAt: state.startedAt,
          completedAt,
          timeSpentSeconds,
        }),
      })

      // Clear localStorage
      localStorage.removeItem('onboarding_state')

      // Show completion message
      const completionMsg: Message = {
        type: 'answer',
        content: '✨ Profile complete! Setting up your personalized experience...',
        timestamp: Date.now(),
        step: 'complete',
      }
      setMessages((prev) => [...prev, completionMsg])

      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error) {
      console.error('Error completing onboarding:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-seer-teal" />
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
      {/* Enhanced Gradient Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#4ECDC4]/10 rounded-full blur-[140px] animate-float-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#4ECDC4]/8 rounded-full blur-[140px] animate-float-medium" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#4ECDC4]/5 rounded-full blur-[100px] animate-pulse-opacity" />
            </div>

      {/* Scrollable Content */}
      <div className="h-full overflow-y-auto scroll-smooth">
        <div className="relative w-full max-w-3xl mx-auto">
          {/* Previous Q&A Pairs */}
          {messages.map((msg, i) => {
            // Group questions with their answers - only show if answered
            if (msg.type === 'question') {
              const nextMsg = messages[i + 1]
              const isAnswer = nextMsg && nextMsg.type === 'answer'
              
              // Skip questions that haven't been answered yet
              if (!isAnswer) return null
              
              const questionOptions = msg.options || []
              const selectedAnswer = nextMsg.selectedAnswer
              
              return (
            <div
              key={i}
                  className="min-h-screen flex flex-col items-center justify-center px-6 py-20"
                >
                  <div className="w-full max-w-2xl space-y-12 text-center">
                    {/* Question */}
                    <div className="space-y-4">
                      <h2 className="text-4xl md:text-5xl font-extralight text-slate-900 tracking-tight leading-tight">
                        {msg.content}
                      </h2>
                      <p className="text-base text-slate-500/80 font-light">{getStepHint(msg.step)}</p>
                    </div>
                    
                    {/* Options (disabled/readonly state) */}
                    {questionOptions.length > 0 && (
                      <div className="flex flex-wrap gap-3 justify-center">
                        {questionOptions.map((option) => {
                          const isSelected = Array.isArray(selectedAnswer) 
                            ? selectedAnswer.includes(option)
                            : selectedAnswer === option
                          
                          return (
                            <button
                              key={option}
                              disabled
                              className={`px-6 py-3 rounded-full text-sm font-light backdrop-blur-xl shadow-lg ${
                                isSelected
                                  ? 'bg-[#4ECDC4] text-white border-2 border-white/40 shadow-2xl shadow-[#4ECDC4]/30'
                                  : 'bg-white/40 border-2 border-white/60 text-slate-700 opacity-60'
                              }`}
                            >
                              {option}
                            </button>
                          )
                        })}
                      </div>
                    )}
                    
                    {/* Answer shown as input value */}
                    {isAnswer && (
                      <div className="space-y-6">
                        <div className="relative">
                          <input
                            type="text"
                            value={Array.isArray(nextMsg.content) ? nextMsg.content.join(', ') : nextMsg.content as string}
                            disabled
                            className="w-full bg-transparent border-b-2 border-[#4ECDC4]/50 outline-none py-4 text-slate-900 text-center font-light text-xl"
                          />
                </div>
                </div>
              )}
            </div>
                </div>
              )
            }
            return null
          })}

          {/* Current Question */}
          {state.currentStep !== 'complete' && (
            <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
              <div className="w-full max-w-2xl space-y-12 text-center">
                {/* Question */}
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-extralight text-slate-900 tracking-tight leading-tight">
                    {getStepQuestion(state.currentStep)}
                  </h2>
                  <p className="text-base text-slate-500/80 font-light">{getStepHint(state.currentStep)}</p>
                </div>

                {/* Current Step Options */}
                <div className="space-y-8 animate-fadeInUp">
              {isGenerating ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-[#4ECDC4]" />
                      <span className="ml-4 text-slate-600 font-light text-lg">Generating options...</span>
                </div>
              ) : (
                <>
                  {currentOptions.length > 0 && (
                        <div className="flex flex-wrap gap-3 justify-center">
                      {currentOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleOptionSelect(option)}
                              className={`px-6 py-3 rounded-full text-sm font-light transition-all backdrop-blur-xl shadow-lg ${
                            selectedOptions.includes(option)
                                  ? 'bg-[#4ECDC4] text-white border-2 border-white/40 shadow-2xl shadow-[#4ECDC4]/30 scale-105'
                                  : 'bg-white/40 border-2 border-white/60 text-slate-700 hover:bg-white/60 hover:border-[#4ECDC4]/40 hover:shadow-xl hover:scale-105'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

                {/* Minimalist Line Input */}
                <div className="space-y-6">
                  <div className="relative">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (customInput.trim() || selectedOptions.length > 0) {
                      handleNext()
                    }
                  }
                }}
                      placeholder="Type your answer..."
                      className="w-full bg-transparent border-b-2 border-slate-300/50 focus:border-[#4ECDC4] outline-none py-4 text-slate-900 placeholder:text-slate-400/60 transition-all text-center font-light text-xl"
              />
                  </div>
                  
                  <div className="flex items-center justify-center space-x-6">
                {canSkip(state.currentStep) && (
                  <button
                    onClick={handleSkip}
                        className="text-sm text-slate-400/80 hover:text-slate-600 transition-all font-light hover:scale-105"
                  >
                        skip
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={
                    isRequired(state.currentStep) &&
                    selectedOptions.length === 0 &&
                    !customInput.trim()
                  }
                      className="group relative disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:scale-110"
                >
                      <div className="absolute inset-0 bg-[#4ECDC4]/40 blur-2xl group-hover:blur-3xl transition-all rounded-full animate-pulse-opacity" />
                      <div className="relative w-14 h-14 rounded-full bg-[#4ECDC4] text-white flex items-center justify-center transition-all shadow-2xl shadow-[#4ECDC4]/40 border-2 border-white/30 group-hover:bg-[#45B7B8]">
                  {isLoading ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <ArrowRight className="w-6 h-6" />
                        )}
                      </div>
                    </button>
                  </div>
                  
                  {isRequired(state.currentStep) && (
                    <p className="text-xs text-slate-400/70 text-center font-light tracking-wide">
                      REQUIRED
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  )
}
