'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Sparkles, Loader2, ArrowRight, Info } from 'lucide-react'

// Types
type StepType = 'role' | 'industry' | 'team' | 'tasks' | 'tools' | 'problems' | 'preferences' | 'complete'

interface OnboardingState {
  clientId: string
  currentStep: StepType
  responses: {
    role?: string
    industry?: string | string[]
    teamContext?: string | string[]
    tasks?: string[]
    tools?: string[]
    problems?: string[]
    preferences?: string
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
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [editingOptions, setEditingOptions] = useState<string[]>([])
  const [hasEditChanges, setHasEditChanges] = useState(false)
  const [showSecurityTooltip, setShowSecurityTooltip] = useState(false)

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
    // Also save to backend for progressive persistence
    saveProgress(newState)
  }

  const saveProgress = async (currentState: OnboardingState) => {
    // Save to database at every step for progressive persistence
    try {
      const response = await fetch('/api/onboarding/save', {
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
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error saving progress:', errorData)
      }
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

  const generateOptions = async (step: StepType, currentState: OnboardingState, isRegeneration: boolean = false) => {
    setIsGenerating(true)
    
    // Only add question if this is not a regeneration
    if (!isRegeneration) {
      const question = getStepQuestion(step)
      const questionMsg: Message = {
        type: 'question',
        content: question,
        timestamp: Date.now(),
        step,
        options: [], // Will be filled as they stream in
      }
      setMessages((prev) => [...prev, questionMsg])
    } else {
      // Clear current options when regenerating
      setCurrentOptions([])
    }
    
    try {
      const response = await fetch('/api/onboarding/generate-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step,
          context: currentState.responses,
        }),
      })

      if (!response.body) {
        throw new Error('No response body')
      }

      // Read the stream
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      const streamedOptions: string[] = []

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (!line.trim()) continue
          
          try {
            const data = JSON.parse(line)
            
            if (data.done) {
              // Stream complete
              break
            }
            
            if (data.option) {
              // Add option to current options
              streamedOptions.push(data.option)
              setCurrentOptions([...streamedOptions])
              
              // Update the question message with the new option
              if (!isRegeneration) {
                setMessages((prev) => {
                  const updated = [...prev]
                  const lastMsg = updated[updated.length - 1]
                  if (lastMsg && lastMsg.type === 'question') {
                    lastMsg.options = [...streamedOptions]
                  }
                  return updated
                })
              }
            }
          } catch (e) {
            console.error('Error parsing stream data:', e)
          }
        }
      }
      
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
      team: 'Tell us about your team setup',
      tasks: 'What are your main work activities?',
      tools: 'What tools and frameworks do you use?',
      problems: 'What challenges are you looking to solve?',
      preferences: 'Anything else you\'d like to share?',
      complete: '',
    }
    return questions[step]
  }

  const getStepHint = (step: StepType): string => {
    const hints: Record<StepType, string> = {
      role: 'Select your role or type a custom one',
      industry: 'Select multiple or add your own',
      team: 'Describe your team structure',
      tasks: 'Select tasks or describe your own',
      tools: 'Select all that apply or add your own',
      problems: 'What pain points do you face?',
      preferences: 'What type of AI content would be most helpful for you?',
      complete: '',
    }
    return hints[step]
  }

  const handleOptionSelect = (option: string) => {
    const step = state?.currentStep
    if (!step) return

    // Handle multi-select for industry, team, tasks, tools, problems
    if (['industry', 'team', 'tasks', 'tools', 'problems'].includes(step)) {
      setSelectedOptions((prev) =>
        prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
      )
    } else {
      // Single select for role - allow deselection
      setSelectedOptions((prev) =>
        prev.includes(option) ? [] : [option]
      )
    }
  }

  const canSkip = (step: StepType): boolean => {
    return ['team', 'tasks', 'problems', 'preferences'].includes(step)
  }

  const isRequired = (step: StepType): boolean => {
    return ['role', 'industry', 'tools'].includes(step)
  }

  const handleNext = async () => {
    if (!state) return

    const step = state.currentStep
    let answer: string | string[]

    // Handle multi-select fields (can combine options + custom input)
    if (['industry', 'team', 'tasks', 'tools', 'problems'].includes(step)) {
      const combinedAnswers: string[] = []
      
      // Add selected options
      if (selectedOptions.length > 0) {
        combinedAnswers.push(...selectedOptions)
      }
      
      // Add custom input if provided
      if (customInput.trim()) {
        combinedAnswers.push(customInput.trim())
      }
      
      answer = combinedAnswers
    } else if (step === 'preferences') {
      // Preferences is text-only, no options
      answer = customInput.trim()
    } else {
      // Single-select fields like role (option OR custom input, not both)
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
      preferences: 'preferences',
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

  const handleEditAnswer = async (answerIndex: number, newValue: string, newOptions?: string[]) => {
    if (!state) return
    
    // Update the messages
    const updatedMessages = [...messages]
    const answerMsg = updatedMessages[answerIndex]
    
    if (answerMsg && answerMsg.type === 'answer') {
      // Update the answer content
      const finalValue = newOptions && newOptions.length > 0 
        ? newOptions.join(', ')
        : newValue
      
      answerMsg.content = finalValue
      answerMsg.selectedAnswer = newOptions && newOptions.length > 0 ? newOptions : finalValue
      answerMsg.timestamp = Date.now()
      
      setMessages(updatedMessages)
      
      // Update state responses
      const questionIndex = answerIndex - 1
      const questionMsg = updatedMessages[questionIndex]
      
      if (questionMsg && questionMsg.type === 'question') {
        const editedStep = questionMsg.step
        const newResponses = { ...state.responses }
        
        const fieldMap: Record<StepType, keyof OnboardingState['responses']> = {
          role: 'role',
          industry: 'industry',
          team: 'teamContext',
          tasks: 'tasks',
          tools: 'tools',
          problems: 'problems',
          preferences: 'preferences',
          complete: 'role',
        }
        
        const field = fieldMap[editedStep]
        if (field) {
          // Handle multi-select vs single select
          if (['industry', 'team', 'tasks', 'tools', 'problems'].includes(editedStep)) {
            // @ts-ignore
            newResponses[field] = newOptions && newOptions.length > 0 
              ? newOptions 
              : finalValue.split(', ').filter(v => v.trim())
          } else {
            // @ts-ignore
            newResponses[field] = finalValue
          }
        }
        
        const newState: OnboardingState = {
          ...state,
          responses: newResponses,
          conversationHistory: updatedMessages,
        }
        
        setState(newState)
        saveState(newState)
        
        // Check if we need to regenerate current options based on the edited step
        const currentStep = state.currentStep
        const needsRegeneration = shouldRegenerateOptions(editedStep, currentStep)
        
        if (needsRegeneration && ['team', 'tasks', 'tools', 'problems'].includes(currentStep)) {
          console.log(`🔄 Regenerating options for ${currentStep} due to ${editedStep} change`)
          await generateOptions(currentStep, newState, true) // true = isRegeneration
        }
      }
    }
    
    // Clear editing state
    setEditingMessageIndex(null)
    setEditingValue('')
    setEditingOptions([])
    setHasEditChanges(false)
  }
  
  // Determine if options need regeneration based on edited step
  const shouldRegenerateOptions = (editedStep: StepType, currentStep: StepType): boolean => {
    // Map of which steps depend on which previous steps
    const dependencies: Record<StepType, StepType[]> = {
      role: [],
      industry: [],
      team: ['role'],
      tasks: ['role', 'industry', 'team'],
      tools: ['role', 'industry', 'team', 'tasks'],
      problems: ['role', 'industry', 'team', 'tasks', 'tools'],
      preferences: [],
      complete: [],
    }
    
    const currentDeps = dependencies[currentStep] || []
    return currentDeps.includes(editedStep)
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
    const flow: StepType[] = ['role', 'industry', 'team', 'tasks', 'tools', 'problems', 'preferences', 'complete']
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
      {/* Persistent Top Right Note */}
      {state && state.currentStep !== 'complete' && (
        <div className="fixed top-6 right-6 z-50">
          <div 
            className="relative inline-flex items-center space-x-2.5 px-5 py-3 bg-gradient-to-r from-seer-primary/10 via-purple-400/10 to-seer-primary/10 backdrop-blur-xl rounded-full border border-white/40 shadow-lg cursor-pointer"
            onMouseEnter={() => setShowSecurityTooltip(true)}
            onMouseLeave={() => setShowSecurityTooltip(false)}
          >
            <Sparkles className="w-4 h-4 text-seer-primary/70" />
            <span className="text-xs md:text-sm text-slate-700 font-light italic">
              Share more context, unlock better content
            </span>
            <Info className="w-3.5 h-3.5 text-slate-400" />
            
            {/* Security Tooltip */}
            {showSecurityTooltip && (
              <div className="absolute top-full right-0 mt-2 w-80 p-4 bg-slate-900 text-white text-xs leading-relaxed rounded-xl shadow-2xl z-50">
                <div className="absolute -top-2 right-6 w-4 h-4 bg-slate-900 transform rotate-45"></div>
                <p className="font-light">
                  We store your onboarding context in a managed Postgres database (Supabase). Data is encrypted at rest and in transit, protected by row-level security and role-based access. Only authorized services can access it, and we log access for auditing.
                </p>
            </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Gradient Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large gradient orbs */}
        <div className="absolute -top-40 -right-40 w-80 md:w-96 h-80 md:h-96 bg-gradient-to-br from-seer-primary/20 to-seer-accent/18 md:from-seer-primary/30 md:to-seer-accent/25 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/3 -left-40 w-72 md:w-80 h-72 md:h-80 bg-gradient-to-tr from-seer-accent/22 to-seer-primary/20 md:from-seer-accent/35 md:to-seer-primary/30 rounded-full blur-3xl animate-float-medium" />
        <div className="absolute top-[60%] right-1/3 w-64 md:w-72 h-64 md:h-72 bg-gradient-to-bl from-seer-primary/20 to-seer-accent/18 md:from-seer-primary/28 md:to-seer-accent/25 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '3s' }} />
        <div className="absolute bottom-[10%] -left-20 w-80 md:w-96 h-80 md:h-96 bg-gradient-to-tr from-seer-primary/18 to-seer-accent/20 md:from-seer-primary/25 md:to-seer-accent/30 rounded-full blur-3xl animate-float-medium" style={{ animationDelay: '5s' }} />
        <div className="absolute bottom-[30%] right-[10%] w-72 md:w-80 h-72 md:h-80 bg-gradient-to-bl from-seer-accent/20 to-seer-primary/18 md:from-seer-accent/30 md:to-seer-primary/25 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '7s' }} />
        
        {/* Animated dots with movement */}
        <div className="absolute top-20 left-1/4 w-2 md:w-3 h-2 md:h-3 bg-seer-primary opacity-60 md:opacity-100 rounded-full animate-float-dot-1" style={{ animationDelay: '0s' }} />
        <div className="absolute top-40 right-1/3 w-1.5 md:w-2 h-1.5 md:h-2 bg-seer-accent opacity-60 md:opacity-100 rounded-full animate-float-dot-2" style={{ animationDelay: '1s' }} />
        <div className="absolute top-60 left-1/3 w-3 md:w-4 h-3 md:h-4 bg-seer-primary opacity-60 md:opacity-100 rounded-full animate-float-dot-3" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[70%] right-1/4 w-2 md:w-3 h-2 md:h-3 bg-seer-accent opacity-60 md:opacity-100 rounded-full animate-float-dot-1" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[50%] left-1/5 w-1.5 md:w-2 h-1.5 md:h-2 bg-seer-primary opacity-60 md:opacity-100 rounded-full animate-float-dot-2" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/2 right-1/5 w-3 md:w-5 h-3 md:h-5 bg-seer-accent opacity-60 md:opacity-100 rounded-full animate-float-dot-3" style={{ animationDelay: '2.5s' }} />
        <div className="absolute bottom-40 left-2/3 w-2 md:w-3 h-2 md:h-3 bg-seer-primary opacity-60 md:opacity-100 rounded-full animate-float-dot-2" style={{ animationDelay: '1.2s' }} />
        <div className="absolute top-1/4 right-2/3 w-3 md:w-4 h-3 md:h-4 bg-seer-accent opacity-60 md:opacity-100 rounded-full animate-float-dot-1" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[85%] left-1/2 w-2 md:w-3 h-2 md:h-3 bg-seer-primary opacity-60 md:opacity-100 rounded-full animate-float-dot-3" style={{ animationDelay: '4s' }} />
        <div className="absolute bottom-[15%] right-1/2 w-1.5 md:w-2 h-1.5 md:h-2 bg-seer-accent opacity-60 md:opacity-100 rounded-full animate-float-dot-1" style={{ animationDelay: '2.8s' }} />
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
                    
                    {/* Options (editable) */}
                    {questionOptions.length > 0 && (
                      <div className="flex flex-wrap gap-3 justify-center">
                        {questionOptions.map((option) => {
                          const isEditing = editingMessageIndex === i + 1
                          const isSelected = isEditing
                            ? editingOptions.includes(option)
                            : Array.isArray(selectedAnswer) 
                              ? selectedAnswer.includes(option)
                              : selectedAnswer === option
                          
                          return (
                            <button
                              key={option}
                              onClick={() => {
                                if (!isEditing) {
                                  // Start editing mode
                                  setEditingMessageIndex(i + 1)
                                  const currentAnswer = Array.isArray(selectedAnswer) ? selectedAnswer : [selectedAnswer].filter(Boolean) as string[]
                                  setEditingOptions(currentAnswer)
                                  setEditingValue(Array.isArray(nextMsg.content) ? nextMsg.content.join(', ') : nextMsg.content as string)
                                }
                                
                                // Toggle option
                                const questionMsg = messages[i]
                                if (questionMsg && questionMsg.type === 'question') {
                                  const step = questionMsg.step
                                  const isMultiSelect = ['industry', 'team', 'tasks', 'tools', 'problems'].includes(step)
                                  
                                  if (isMultiSelect) {
                                    setEditingOptions(prev => 
                                      prev.includes(option) 
                                        ? prev.filter(o => o !== option)
                                        : [...prev, option]
                                    )
                                  } else {
                                    // Single select - allow deselection
                                    setEditingOptions(prev =>
                                      prev.includes(option) ? [] : [option]
                                    )
                                  }
                                  setHasEditChanges(true)
                                }
                              }}
                              className={`px-6 py-3 rounded-full text-sm font-light backdrop-blur-xl shadow-lg transition-all ${
                                isSelected
                                  ? 'bg-[#4ECDC4] text-white border-2 border-white/40 shadow-2xl shadow-[#4ECDC4]/30'
                                  : isEditing
                                    ? 'bg-white/60 border-2 border-white/70 text-slate-700 hover:bg-white/80 hover:scale-105 cursor-pointer'
                                    : 'bg-white/40 border-2 border-white/60 text-slate-700 opacity-60 hover:opacity-100 hover:scale-105 cursor-pointer'
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
                      <div className="space-y-4">
                        <div className="relative group">
                          <input
                            type="text"
                            value={
                              editingMessageIndex === i + 1
                                ? editingValue
                                : Array.isArray(nextMsg.content) ? nextMsg.content.join(', ') : nextMsg.content as string
                            }
                            onChange={(e) => {
                              if (editingMessageIndex === i + 1) {
                                setEditingValue(e.target.value)
                                setHasEditChanges(true)
                              }
                            }}
                            onFocus={() => {
                              setEditingMessageIndex(i + 1)
                              const currentAnswer = Array.isArray(selectedAnswer) ? selectedAnswer : [selectedAnswer].filter(Boolean) as string[]
                              setEditingOptions(currentAnswer)
                              setEditingValue(Array.isArray(nextMsg.content) ? nextMsg.content.join(', ') : nextMsg.content as string)
                            }}
                            className="w-full bg-transparent border-b-2 border-[#4ECDC4]/50 hover:border-[#4ECDC4]/70 focus:border-[#4ECDC4] outline-none py-4 text-slate-900 text-center font-light text-xl cursor-pointer transition-all"
                            placeholder="Click to edit..."
                          />
                          {editingMessageIndex !== i + 1 && (
                            <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              Click to edit
                            </p>
                          )}
                        </div>
                        
                        {/* Update button when editing */}
                        {editingMessageIndex === i + 1 && hasEditChanges && (
                          <div className="flex justify-center gap-3">
                            <button
                              onClick={() => {
                                setEditingMessageIndex(null)
                                setEditingValue('')
                                setEditingOptions([])
                                setHasEditChanges(false)
                              }}
                              className="px-4 py-2 text-sm font-light text-slate-600 hover:text-slate-900 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                handleEditAnswer(i + 1, editingValue, editingOptions.length > 0 ? editingOptions : undefined)
                              }}
                              className="px-6 py-2 rounded-full bg-[#4ECDC4] text-white text-sm font-light hover:bg-[#45B7B8] transition-all shadow-lg shadow-[#4ECDC4]/30"
                            >
                              Update
                            </button>
                </div>
                        )}
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
                <div className="space-y-8">
                  {/* Show loading message while generating */}
                  {isGenerating && currentOptions.length === 0 && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-[#4ECDC4]" />
                      <span className="ml-4 text-slate-600 font-light text-lg">Finding some common answers for you...</span>
                    </div>
                  )}
                  
                  {/* Show options as they stream in */}
                  {currentOptions.length > 0 && (
                    <div className="flex flex-wrap gap-3 justify-center">
                      {currentOptions.map((option, idx) => (
                        <button
                          key={option}
                          onClick={() => handleOptionSelect(option)}
                          className={`px-6 py-3 rounded-full text-sm font-light transition-all backdrop-blur-xl shadow-lg animate-stream-in ${
                            selectedOptions.includes(option)
                              ? 'bg-[#4ECDC4] text-white border-2 border-white/40 shadow-2xl shadow-[#4ECDC4]/30 scale-105'
                              : 'bg-white/40 border-2 border-white/60 text-slate-700 hover:bg-white/60 hover:border-[#4ECDC4]/40 hover:shadow-xl hover:scale-105'
                          }`}
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
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
                      placeholder={
                        selectedOptions.length > 0 
                          ? "Add more (optional)..." 
                          : "Type your answer..."
                      }
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
