# Dynamic Onboarding Agent - Implementation Guide v2

## Overview
A conversational onboarding system with a vertical chat-like flow, using components to create a premium, dynamic experience. Uses anonymous client ID for frictionless onboarding with no login required.

## Core Flow
```
Role → Industry → Team Context → Tasks → Tools & Frameworks → Problems & Pain Points
```

### Required Fields
- **Role** (required)
- **Industry** (required)  
- **Tools & Frameworks** (required)

### Optional Fields (with skip)
- Team Context
- Tasks
- Problems & Pain Points

## Architecture

### Anonymous Session Management
```typescript
// Generate client ID on first load
const clientId = crypto.randomUUID();
localStorage.setItem('onboarding_client_id', clientId);

// Track all interactions server-side
interface OnboardingSession {
  clientId: string;
  startedAt: Date;
  currentStep: string;
  responses: Map<string, any>;
  completed: boolean;
}
```

## UI Design - Vertical Chat Flow

### Layout Structure
```
┌─────────────────────────────────────┐
│  [Previous responses stay visible]   │
│                                      │
│  Role: Product Manager ✓            │
│  ─────────────────────────          │
│                                      │
│  Industry: Healthcare ✓             │
│  ─────────────────────────          │
│                                      │
│  [Current Question Fades In]        │
│  "What's your team structure?"      │
│                                      │
│  ┌────────┐  ┌────────┐            │
│  │ Option │  │ Option │            │
│  └────────┘  └────────┘            │
│                                      │
│  [💬 Type your answer...]           │
│                                      │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─         │
│  💡 More context = better results   │
└─────────────────────────────────────┘
```

### Animation Behavior
- New sections fade in from bottom (200ms)
- Previous answers collapse to single line
- Smooth scroll to keep current question in view
- Typing indicator appears during AI processing

## Step-by-Step Implementation

### Step 1: Role Selection (Static Options)
**Prompt:** "What's your role?"

**Fixed Options:**
```javascript
const roleOptions = [
  "Software Engineer",
  "Product Manager",
  "Data Scientist",
  "Founder & CEO",
  "Marketing Manager",
  "Sales Representative"
];
```

**Component Style:**
- 2x3 grid on desktop
- 2x2 on tablet
- Single column on mobile
- 14px text size
- Subtle borders, hover states

### Step 2: Industry Selection (Static Options)
**Prompt:** "Which industry best describes your work?"

**Fixed Options:**
```javascript
const industryOptions = [
  "Healthcare & Life Sciences",
  "Financial Services",
  "Technology & Software",
  "Manufacturing",
  "Retail & E-commerce",
  "Education",
  "Media & Entertainment",
  "Transportation",
  "Energy & Utilities",
  "Government & Public Sector"
];
```

**Multi-select:** Allow multiple industries if applicable

### Step 3: Team Context (Semi-Dynamic)
**Prompt:** "Tell me about your team setup"

**Dynamic Options Based on Role:**
```javascript
function getTeamContextOptions(role: string) {
  const options = {
    "Software Engineer": [
      "Solo developer",
      "Small team (2-10)",
      "Large engineering org (10+)",
      "Open source contributor",
      "Freelance/Contract"
    ],
    "Product Manager": [
      "Single product",
      "Multiple products", 
      "Platform team",
      "Growth team",
      "B2B Enterprise"
    ],
    "Founder & CEO": [
      "Solo founder",
      "Co-founding team",
      "Early stage (<10 people)",
      "Growth stage (10-50)",
      "Scaling (50+)"
    ],
    "Data Scientist": [
      "Embedded in product",
      "Central data team",
      "Research focused",
      "Client-facing",
      "Solo practitioner"
    ]
    // ... other roles
  };
  
  return options[role] || getDefaultTeamOptions();
}
```

### Step 4: Tasks (Fully Dynamic)
**Prompt:** "As a {role} in {industry}, what are your main work activities?"

**Agent Context for Generation:**
```javascript
const taskPrompt = `
Generate 6 relevant daily tasks for:
- Role: ${role}
- Industry: ${industry}
- Team: ${teamContext}

Return specific, actionable tasks that this person likely does.
Keep each under 4 words.
Consider industry-specific requirements.

Example for "Product Manager in Healthcare with B2B Enterprise team":
- Clinical workflow analysis
- Compliance documentation
- Enterprise client calls
- Feature prioritization
- Stakeholder alignment
- Market research
`;
```

**Dynamic Generation Example:**
```javascript
// Software Engineer in Fintech, Large org
[
  "Payment system development",
  "Security audits",
  "Code reviews",
  "API integration",
  "Performance optimization",
  "Incident response"
]

// Marketing Manager in EdTech, Small team
[
  "Content creation",
  "Teacher outreach",
  "Social campaigns",
  "Webinar hosting",
  "SEO optimization",
  "Email marketing"
]
```

### Step 5: Tools & Frameworks (Fully Dynamic)
**Prompt:** "What tools and frameworks do you use for {tasks_summary}?"

**Agent Context:**
```javascript
const toolsPrompt = `
Based on:
- Role: ${role}
- Industry: ${industry}
- Tasks: ${selectedTasks}

Suggest 6-8 most relevant tools/frameworks.
Mix of:
- Industry-standard tools
- Role-specific platforms
- Communication/collaboration tools
- Technical frameworks (if applicable)

Prioritize tools actually used for their specific tasks.
`;
```

**Dynamic Examples:**
```javascript
// PM in Healthcare doing compliance & workflows
[
  "Jira/Linear",
  "Figma",
  "Confluence",
  "HIPAA tools",
  "Miro",
  "Slack",
  "Mixpanel",
  "Doximity"
]

// Engineer in Fintech doing payment systems
[
  "Python/Java",
  "PostgreSQL",
  "Redis",
  "Stripe/Square APIs",
  "Docker/K8s",
  "GitHub",
  "PCI compliance tools",
  "DataDog"
]
```

### Step 6: Problems & Pain Points (Fully Dynamic)
**Prompt:** "Based on your work, what challenges are you looking to solve?"

**Agent Context:**
```javascript
const problemsPrompt = `
Given:
- Role: ${role} in ${industry}
- Team: ${teamContext}
- Daily tasks: ${tasks}
- Current tools: ${tools}

Generate 6 specific pain points they likely face.
Focus on:
- Inefficiencies in their workflow
- Gaps in their current tooling
- Industry-specific challenges
- Scale/growth related issues

Make them specific and solvable.
`;
```

**Dynamic Examples:**
```javascript
// Based on accumulated context
[
  "Manual compliance reporting",
  "Slow deployment cycles",
  "Scattered documentation",
  "Stakeholder visibility",
  "Data silos",
  "Repetitive testing"
]
```

## Component Implementation

### Reusable Option Card
```typescript
interface OptionCardProps {
  text: string;
  selected: boolean;
  onSelect: () => void;
  size?: 'small' | 'medium';
}

function OptionCard({ text, selected, onSelect, size = 'medium' }: OptionCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`
        p-3 rounded-lg border transition-all
        ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
        ${size === 'small' ? 'text-sm' : 'text-base'}
      `}
    >
      {text}
      {selected && <CheckIcon className="ml-2 inline" />}
    </button>
  );
}
```

### Chat Input Component
```typescript
function ChatInput({ 
  placeholder, 
  onSubmit,
  currentStep 
}: ChatInputProps) {
  const contextualPlaceholders = {
    role: "Or type your specific role...",
    industry: "Can't find yours? Type it here...",
    team: "Describe your team structure...",
    tasks: "Add more specific tasks you do...",
    tools: "What else do you use?",
    problems: "Tell me about other challenges..."
  };

  return (
    <div className="relative">
      <input
        type="text"
        placeholder={contextualPlaceholders[currentStep]}
        className="w-full p-3 pr-10 border rounded-lg text-sm"
        onKeyDown={(e) => e.key === 'Enter' && onSubmit(e.currentTarget.value)}
      />
      <SendIcon className="absolute right-3 top-3 text-gray-400" />
    </div>
  );
}
```

### Vertical Chat Container
```typescript
function OnboardingChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState('role');
  
  const addMessage = (content: ReactNode, type: 'question' | 'answer') => {
    setMessages(prev => [...prev, { content, type, timestamp: Date.now() }]);
    // Auto-scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="max-w-2xl mx-auto h-screen flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`animate-fadeIn ${msg.type === 'answer' ? 'ml-8' : ''}`}
          >
            {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-4">
        <ChatInput currentStep={currentStep} onSubmit={handleSubmit} />
        <p className="text-xs text-gray-500 mt-2 text-center">
          💡 The more context you provide, the better our recommendations
        </p>
      </div>
    </div>
  );
}
```

## State Management

### Onboarding State
```typescript
interface OnboardingState {
  clientId: string;
  currentStep: StepType;
  responses: {
    role?: string;
    industry?: string | string[];
    teamContext?: string;
    tasks?: string[];
    tools?: string[];
    problems?: string[];
  };
  conversationHistory: Message[];
  startedAt: Date;
  completedAt?: Date;
}

// Persist to localStorage for resume capability
function saveState(state: OnboardingState) {
  localStorage.setItem('onboarding_state', JSON.stringify(state));
}

// Send to server for analytics
async function trackProgress(state: OnboardingState) {
  await fetch('/api/onboarding/track', {
    method: 'POST',
    body: JSON.stringify({
      clientId: state.clientId,
      step: state.currentStep,
      data: state.responses
    })
  });
}
```

## Dynamic Option Generation

### API Route for Dynamic Options
```typescript
// app/api/onboarding/generate-options/route.ts
export async function POST(req: Request) {
  const { step, context } = await req.json();
  
  // For team context - semi-dynamic
  if (step === 'team') {
    return NextResponse.json({
      options: getTeamContextOptions(context.role)
    });
  }
  
  // For fully dynamic steps
  if (['tasks', 'tools', 'problems'].includes(step)) {
    const prompt = buildPrompt(step, context);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: ONBOARDING_SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 150
    });
    
    const options = parseOptions(completion.choices[0].message.content);
    
    return NextResponse.json({ options });
  }
}
```

### Context Building
```typescript
function buildPrompt(step: string, context: OnboardingContext): string {
  const templates = {
    tasks: `Generate 6 daily tasks for a ${context.role} in ${context.industry} 
            working in a ${context.teamContext} setup.`,
    
    tools: `List 6-8 tools/frameworks used by a ${context.role} who does:
            ${context.tasks.join(', ')}`,
    
    problems: `Identify 6 pain points for a ${context.role} using 
               ${context.tools.join(', ')} for ${context.tasks.join(', ')}`
  };
  
  return templates[step];
}
```

## Skip Logic

### Skip Button Implementation
```typescript
function SkipButton({ onSkip, step }: SkipButtonProps) {
  const skipMessages = {
    team: "Skip team context",
    tasks: "I'll figure this out later",
    problems: "Complete setup"
  };
  
  if (['role', 'industry', 'tools'].includes(step)) {
    return null; // No skip for required fields
  }
  
  return (
    <button
      onClick={onSkip}
      className="text-sm text-gray-500 hover:text-gray-700 mt-4"
    >
      {skipMessages[step]} →
    </button>
  );
}
```

## Completion Flow

### Profile Assembly
```typescript
async function completeOnboarding(state: OnboardingState) {
  const profile = {
    clientId: state.clientId,
    role: state.responses.role,
    industry: state.responses.industry,
    teamContext: state.responses.teamContext || 'Not specified',
    tools: state.responses.tools || [],
    tasks: state.responses.tasks || [],
    problems: state.responses.problems || [],
    completedAt: new Date(),
    timeSpent: Date.now() - state.startedAt.getTime()
  };
  
  // Save to database
  await fetch('/api/onboarding/complete', {
    method: 'POST',
    body: JSON.stringify(profile)
  });
  
  // Transition to main app
  router.push('/dashboard');
}
```

## Success Metrics

### Analytics to Track
```typescript
interface OnboardingAnalytics {
  clientId: string;
  events: Array<{
    type: 'step_completed' | 'option_selected' | 'custom_input' | 'skip';
    step: string;
    value?: string;
    timestamp: number;
  }>;
  dropoffStep?: string;
  completionTime?: number;
  customInputRatio: number; // % of custom vs suggested
}
```

### Key Metrics
- Completion rate by step
- Time per step
- Custom input frequency
- Most selected options per role/industry
- Skip patterns

## Error Handling

### Graceful Failures
```typescript
// Network failure during option generation
function handleGenerationError(step: string): string[] {
  const fallbacks = {
    tasks: ["Product development", "Team collaboration", "Strategic planning"],
    tools: ["Slack", "Google Workspace", "Jira", "GitHub"],
    problems: ["Process inefficiency", "Tool fragmentation", "Scaling challenges"]
  };
  
  return fallbacks[step] || [];
}

// Invalid input handling
function validateInput(input: string, step: string): boolean {
  if (input.length > 100) return false;
  if (input.includes('<script>')) return false;
  // Additional validation per step
  return true;
}
```

## Testing Checklist

### User Flows to Test
1. **Speed run**: Select all pre-made options
2. **Custom path**: Type everything manually  
3. **Mixed approach**: Some options, some typed
4. **Skip heavy**: Skip all optional steps
5. **Back navigation**: Go back and change answers
6. **Refresh resilience**: Refresh mid-flow and resume
7. **Slow network**: Test with throttled connection

### Edge Cases
- Unusual role/industry combinations
- Very long custom inputs
- Rapid clicking through options
- Multiple simultaneous selections
- Browser back button usage

## Performance Optimizations

### Essential Optimizations Only
1. **Debounce text input** (300ms)
2. **Cache option generations** for common combinations
3. **Preload next step** while user reads current
4. **Minimize re-renders** with proper React keys
5. **Lazy load analytics** (fire and forget)

## Post-Launch Iterations

### Quick Wins
- Add "Why we ask this" tooltips
- Implement smart defaults based on patterns
- Add progress indicator (Step 2 of 6)
- Include example selections for inspiration

### Future Enhancements  
- Branching paths for specialized roles
- Integration with auth system
- Bulk team onboarding
- Onboarding templates by company type
- AI-powered profile enrichment from LinkedIn
