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

    // Add question message
    const question = getStepQuestion(step)
    const questionMsg: Message = {
      type: 'question',
      content: question,
      timestamp: Date.now(),
      step,
    }
    setMessages((prev) => [...prev, questionMsg])

    // Load options based on step
    if (step === 'role') {
      setCurrentOptions(ROLE_OPTIONS)
    } else if (step === 'industry') {
      setCurrentOptions(INDUSTRY_OPTIONS)
    } else if (['team', 'tasks', 'tools', 'problems'].includes(step)) {
      await generateOptions(step, currentState)
    }
  }

  const generateOptions = async (step: StepType, currentState: OnboardingState) => {
    setIsGenerating(true)
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
      setCurrentOptions(data.options || [])
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
        <Loader2 className="w-8 h-8 animate-spin text-seer-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Minimal Header */}
      <header className="px-6 py-4 border-b border-white/10 seer-glass">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 seer-glass rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold font-serif text-white">Seer</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-white/60">
            <Sparkles className="w-3 h-3" />
            <span>Onboarding</span>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`animate-fadeInUp ${
                msg.type === 'answer' ? 'flex justify-end' : ''
              }`}
            >
              {msg.type === 'question' ? (
                <div className="space-y-2">
                  <h2 className="text-2xl font-serif font-semibold text-white">{msg.content}</h2>
                  <p className="text-sm text-white/60">{getStepHint(msg.step)}</p>
                </div>
              ) : (
                <div className="inline-block px-4 py-2 seer-glass rounded-2xl text-sm font-medium text-white">
                  {msg.content}
                </div>
              )}
            </div>
          ))}

          {/* Current Step Options */}
          {state.currentStep !== 'complete' && (
            <div className="space-y-4 animate-fadeInUp">
              {isGenerating ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-seer-primary" />
                  <span className="ml-3 text-white/70">Generating personalized options...</span>
                </div>
              ) : (
                <>
                  {currentOptions.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {currentOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleOptionSelect(option)}
                          className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            selectedOptions.includes(option)
                              ? 'bg-white/20 text-white shadow-md border border-white/30'
                              : 'seer-glass text-white/80 hover:bg-white/10'
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
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Minimalist Input Bar */}
      {state.currentStep !== 'complete' && (
        <div className="border-t border-white/10 seer-glass">
          <div className="max-w-3xl mx-auto px-6 py-4">
            <div className="flex items-center space-x-3">
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
                placeholder={`Type your answer here...`}
                className="flex-1 bg-white/5 border-b-2 border-white/20 focus:border-white/40 outline-none py-2 text-white placeholder:text-white/40 transition-colors"
              />
              <div className="flex items-center space-x-2">
                {canSkip(state.currentStep) && (
                  <button
                    onClick={handleSkip}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={
                    isRequired(state.currentStep) &&
                    selectedOptions.length === 0 &&
                    !customInput.trim()
                  }
                  className="p-2 rounded-full seer-glass text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowRight className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-xs text-white/50 mt-2">
              {isRequired(state.currentStep)
                ? 'This field is required'
                : 'Press Enter to continue or click Skip'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
