# Dynamic Onboarding System - Implementation Guide v2

## Overview
A conversational onboarding system with a vertical chat-like flow, using components to create a premium, dynamic experience. Uses anonymous client ID for frictionless onboarding with no login required.

## Technical Stack

**Frontend:**
- Next.js 16.0.0 with App Router
- React 19.2.0, TypeScript 5.9.2
- Tailwind CSS 3.4.17

**Backend:**
- Supabase (PostgreSQL + PostgREST)
- Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) via Anthropic SDK 0.67.0
- Response streaming with ReadableStream API

**Key Features:**
- Intelligent caching system (Supabase `options_cache` table)
- Progressive persistence (localStorage + Supabase dual save)
- Robust fallback system (cache → hardcoded → Claude → generic)
- Streaming UX (options animate in one-by-one)
- Session resume capability (localStorage state rehydration)

## Environment Variables Required

```bash
# Supabase (from Supabase dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-api03-...
```

## Database Schema

### `onboarding_profiles` Table
Primary user data storage. Anonymous, no auth required.

```sql
CREATE TABLE onboarding_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid UNIQUE NOT NULL,  -- Anonymous identifier from crypto.randomUUID()
  
  -- Profile data
  role text NOT NULL,
  industry jsonb NOT NULL,         -- Array: ["Healthcare", "Technology"]
  team_context text,               -- String or array depending on selection
  tasks jsonb DEFAULT '[]',
  tools jsonb DEFAULT '[]',
  problems jsonb DEFAULT '[]',
  
  -- Metadata
  completed boolean DEFAULT false,
  conversation_history jsonb DEFAULT '[]',
  time_spent_seconds integer,
  
  -- Timestamps
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_onboarding_profiles_client_id ON onboarding_profiles(client_id);
CREATE INDEX idx_onboarding_profiles_completed ON onboarding_profiles(completed);
```

### `options_cache` Table
Caches Claude-generated options by role/industry/step.

```sql
CREATE TABLE options_cache (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key text UNIQUE NOT NULL,  -- Format: "step-role-industry"
  step text NOT NULL,              -- team | tasks | tools | problems
  role text,
  industry text,                   -- Normalized: "Healthcare | Technology"
  options jsonb NOT NULL,          -- Array of generated options
  hit_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_options_cache_key ON options_cache(cache_key);
CREATE INDEX idx_options_cache_step ON options_cache(step);
CREATE INDEX idx_options_cache_last_used ON options_cache(last_used_at);
```

## Core Flow
```
Role → Industry (multi-select) → Team Context (multi-select) → Tasks → Tools & Frameworks → Problems & Pain Points
```

### Required Fields
- **Role** (required, single-select)
- **Industry** (required, multi-select)
- **Tasks** (required, multi-select)
- **Tools & Frameworks** (required, multi-select)

### Optional Fields (can skip)
- Team Context (multi-select)
- Problems & Pain Points (multi-select)
- Preferences (free-form text)

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

### Step 2: Industry Selection (Static Options, Multi-Select)
**Prompt:** "Which industry best describes your work?"

**Fixed Options:**
```javascript
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
  'Government & Public Sector'
]
```

**Multi-select:** Users can select multiple industries. Stored as array in database (JSONB field).

### Step 3: Team Context (Hybrid: Hardcoded Fallback → Claude → Cache, Multi-Select)
**Prompt:** "Tell me about your team setup"

**Generation Strategy:**
1. Check `options_cache` table (by cache_key: `team-{role}-{industry}`)
2. If cache miss and role has hardcoded options → use hardcoded + cache them
3. If no hardcoded options → Generate with Claude Haiku 4.5 + cache result
4. Stream options one-by-one to frontend (50ms delay for cached, 150ms for fresh)

**Hardcoded Options for Common Roles:**
```javascript
const TEAM_CONTEXT_OPTIONS: Record<string, string[]> = {
  'Software Engineer': [
    'Solo developer',
    'Small team (2-10)',
    'Large engineering org (10+)',
    'Open source contributor',
    'Freelance/Contract',
  ],
  'Product Manager': [
    'Single product',
    'Multiple products',
    'Platform team',
    'Growth team',
    'B2B Enterprise',
  ],
  'Founder & CEO': [
    'Solo founder',
    'Co-founding team',
    'Early stage (<10 people)',
    'Growth stage (10-50)',
    'Scaling (50+)',
  ],
    // ... other roles
}
```

**Multi-select:** Users can select multiple team contexts. Stored as array (or single text if only one selected).

### Step 4: Tasks (Fully Dynamic via Claude)
**Prompt:** "As a {role} in {industry}, what are your main work activities?"

**Generation Process:**
1. Check cache: `tasks-{role}-{industry}`
2. If miss → Call Claude Haiku 4.5 with context
3. Cache result in `options_cache` table
4. Stream to frontend

**Actual Claude Prompt Template:**
```javascript
const teamText = context.teamContext 
  ? Array.isArray(context.teamContext)
    ? ` in a ${context.teamContext.join(' and ')} setup`
    : ` in a ${context.teamContext} setup`
  : ''

`Generate 6 daily tasks for a ${context.role} working in ${industryText}${teamText}.

Return specific, actionable tasks this person likely does regularly.
Keep each task under 4 words.
Consider industry-specific requirements.

Return as a JSON array of strings.`
```

**Response Format:** 
- Claude returns: `{"options": ["task1", "task2", ...]}` or just `["task1", "task2", ...]`
- May be wrapped in markdown fences: ` ```json ... ``` ` (parser handles this)

**Fallback Options (if Claude fails):**
```javascript
['Product development', 'Team collaboration', 'Strategic planning', 
 'Code reviews', 'Client meetings', 'Documentation']
```

### Step 5: Tools & Frameworks (Fully Dynamic via Claude)
**Prompt:** "What tools and frameworks do you use for {tasks_summary}?"

**Actual Claude Prompt Template:**
```javascript
`List 6-8 tools and frameworks used by a ${context.role} in ${industryText}${
  context.tasks && context.tasks.length > 0 
    ? ` who does: ${context.tasks.join(', ')}` 
    : ''
}.

Mix of:
- Industry-standard tools
- Role-specific platforms
- Communication/collaboration tools
- Technical frameworks (if applicable)

Return as a JSON array of strings.`
```

**Cache Key:** `tools-{role}-{industry}`

**Fallback Options:**
```javascript
['Slack', 'Google Workspace', 'Jira', 'GitHub', 
 'Notion', 'Zoom', 'Figma', 'VS Code']
```

### Step 6: Problems & Pain Points (Fully Dynamic via Claude)
**Prompt:** "Based on your work, what challenges are you looking to solve?"

**Actual Claude Prompt Template:**
```javascript
`Identify 6 specific pain points for a ${context.role} in ${industryText}${
  context.tools && context.tools.length > 0 
    ? ` using ${context.tools.join(', ')}` 
    : ''
}${
  context.tasks && context.tasks.length > 0 
    ? ` for ${context.tasks.join(', ')}` 
    : ''
}.

Focus on:
- Workflow inefficiencies
- Tooling gaps
- Industry-specific challenges
- Scale/growth related issues

Keep each under 5 words.
Return as a JSON array of strings.`
```

**Cache Key:** `problems-{role}-{industry}`

**Fallback Options:**
```javascript
['Process inefficiency', 'Tool fragmentation', 'Scaling challenges', 
 'Communication gaps', 'Data silos', 'Manual workflows']
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

### Onboarding State (TypeScript Interface)
```typescript
interface OnboardingState {
  clientId: string                    // crypto.randomUUID()
  currentStep: StepType               // 'role' | 'industry' | 'team' | ...
  responses: {
    role?: string                     // Single-select
    industry?: string | string[]      // Multi-select (array if multiple)
    teamContext?: string | string[]   // Multi-select (array if multiple)
    tasks?: string[]                  // Multi-select
    tools?: string[]                  // Multi-select
    problems?: string[]               // Multi-select
    preferences?: string              // Optional free text
  }
  conversationHistory: Message[]      // Full chat log with timestamps
  startedAt: Date
}

interface Message {
  type: 'question' | 'answer' | 'options'
  content: string | React.ReactNode
  timestamp: number
  step: StepType
  options?: string[]                  // Options shown for this question
  selectedAnswer?: string | string[]  // What user selected
}
```

### Progressive Persistence (Dual Storage)

**1. localStorage (Client-Side Resume)**
```typescript
function saveState(newState: OnboardingState) {
  // Save to localStorage for instant resume on refresh
  localStorage.setItem('onboarding_state', JSON.stringify(newState))
  
  // Trigger server save (non-blocking)
  saveProgress(newState)
}

function initializeSession() {
  const savedState = localStorage.getItem('onboarding_state')
  if (savedState) {
    // Resume existing session
    const state = JSON.parse(savedState)
    state.startedAt = new Date(state.startedAt) // Rehydrate Date
    return state
  } else {
    // Create new session
    return {
      clientId: crypto.randomUUID(),
      currentStep: 'role',
      responses: {},
      conversationHistory: [],
      startedAt: new Date()
    }
  }
}
```

**2. Supabase (Server-Side Persistence)**
```typescript
async function saveProgress(state: OnboardingState) {
  // Save to Supabase at every step for:
  // - Analytics
  // - Cross-device resume (future)
  // - Data science on onboarding patterns
  
  await fetch('/api/onboarding/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: state.clientId,
      currentStep: state.currentStep,
      responses: state.responses,
      conversationHistory: state.conversationHistory,
      startedAt: state.startedAt,
    })
  })
  
  // Note: Don't block UI on save errors
  // User can continue even if save fails
}
```

**Save Triggers:**
- On every step completion
- On option selection
- On custom input submission
- Before navigation away (beforeunload)

## Dynamic Option Generation

### API Route for Dynamic Options
```typescript
// src/app/api/onboarding/generate-options/route.ts
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  const { step, context } = await req.json()

  if (!['team', 'tasks', 'tools', 'problems'].includes(step)) {
    return NextResponse.json({ error: 'Invalid step' }, { status: 400 })
  }

  // 1. Build cache key
  const cacheKey = buildCacheKey(step, context)
  
  // 2. Check Supabase cache first
  const cachedOptions = await getCachedOptions(cacheKey)
  if (cachedOptions) {
    return streamOptions(cachedOptions, true) // Stream with 50ms delay
  }
  
  // 3. For team step, try hardcoded fallback
  if (step === 'team' && TEAM_CONTEXT_OPTIONS[context.role]) {
    const options = getTeamContextOptions(context.role)
    await setCachedOptions(cacheKey, step, context, options)
    return streamOptions(options, true)
  }
  
  // 4. Generate with Claude Haiku 4.5
  const prompt = buildPrompt(step, context)
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
      temperature: 0.7,
    system: SYSTEM_PROMPT,
    messages: [{ 
      role: 'user', 
      content: prompt + '\n\nRespond with ONLY a JSON object: {"options": [...]}'
    }]
  })
  
  // 5. Parse response (handle markdown fences)
  const textContent = message.content.find(block => block.type === 'text')
  let cleanedText = textContent.text.trim()
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  }
  
  const parsed = JSON.parse(cleanedText)
  const options = Array.isArray(parsed) ? parsed : parsed.options || []
  
  // 6. Cache result
  await setCachedOptions(cacheKey, step, context, options)
  
  // 7. Stream to frontend with 150ms delay
  return streamOptions(options, false)
}

// Stream options one by one for smooth UX
function streamOptions(options: string[], isCached: boolean) {
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < options.length; i++) {
        controller.enqueue(encoder.encode(JSON.stringify({ 
          option: options[i],
          index: i,
          total: options.length,
          cached: isCached
        }) + '\n'))
        
        if (i < options.length - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, isCached ? 50 : 150)
          )
        }
      }
      controller.enqueue(encoder.encode(JSON.stringify({ done: true }) + '\n'))
      controller.close()
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    }
  })
}
```

### Caching System (`options_cache` Table)

**Cache Key Format:** `{step}-{role}-{industry}` (normalized: lowercase, spaces→dashes, &→and)

**Example Keys:**
- `team-software-engineer-healthcare-and-life-sciences`
- `tasks-product-manager-financial-services`
- `tools-data-scientist-technology-and-software`

**Cache Table Schema:**
```sql
CREATE TABLE options_cache (
  id uuid PRIMARY KEY,
  cache_key text UNIQUE NOT NULL,
  step text NOT NULL,
  role text,
  industry text,  -- Normalized: "Healthcare | Technology"
  options jsonb NOT NULL,
  hit_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now()
);
```

**Cache Hit Tracking:**
- Each cache hit increments `hit_count`
- Updates `last_used_at` timestamp
- Enables analytics on most common role/industry combinations

**Estimated Cache Size:**
- ~20 roles × ~20 industries × 4 steps = ~1,600 max entries
- Most combinations never occur → actual ~200-500 entries
- Each entry ~500 bytes → Total ~250KB-800KB

### Context Building Helper
```typescript
function buildCacheKey(step: string, context: any): string {
  const role = (context.role || 'unknown').trim()
  const industry = Array.isArray(context.industry) 
    ? context.industry.sort().join('|') 
    : (context.industry || 'unknown').trim()
  
  return `${step}-${role}-${industry}`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/&/g, 'and')
}
```

## Skip Logic

### Skip Button Implementation
```typescript
function SkipButton({ onSkip, step }: SkipButtonProps) {
  const skipMessages = {
    team: "Skip team context",
    problems: "Skip for now",
    preferences: "Complete setup"
  };

  if (['role', 'industry', 'tasks', 'tools'].includes(step)) {
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

### Profile Assembly & Handoff
```typescript
async function completeOnboarding() {
  const completedAt = new Date()
  const timeSpentSeconds = Math.floor((completedAt - state.startedAt) / 1000)
  
  const response = await fetch('/api/onboarding/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: state.clientId,
      responses: state.responses,
      conversationHistory: state.conversationHistory,
      startedAt: state.startedAt,
      completedAt,
      timeSpentSeconds
    })
  })
  
  if (!response.ok) {
    throw new Error('Failed to complete onboarding')
  }
  
  // Clear localStorage (session complete)
  localStorage.removeItem('onboarding_state')
  
  // Redirect to dashboard
  router.push('/dashboard')
}
```

### Backend Completion Handler
```typescript
// src/app/api/onboarding/complete/route.ts
export async function POST(req: NextRequest) {
  const { clientId, responses, conversationHistory, startedAt, completedAt, timeSpentSeconds } = await req.json()
  
  // Validate required fields
  if (!responses.role || !responses.industry || !responses.tasks || !responses.tools) {
    return NextResponse.json({
      error: 'Missing required fields: role, industry, tasks, and tools are required'
    }, { status: 400 })
  }
  
  const supabase = createAdminClient()
  
  // Mark profile as completed
  const { data, error } = await supabase
    .from('onboarding_profiles')
    .upsert({
      client_id: clientId,
      role: responses.role,
      industry: responses.industry,
      team_context: responses.teamContext || null,
      tasks: responses.tasks || [],
      tools: responses.tools,
      problems: responses.problems || [],
      conversation_history: conversationHistory || [],
      started_at: startedAt,
      completed: true,
      completed_at: completedAt,
      time_spent_seconds: timeSpentSeconds,
    }, { onConflict: 'client_id' })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 })
  }
  
  // 🔗 TODO: Trigger retrieval agent here
  // This is where the Python LangGraph agent would be called
  console.log('[PLACEHOLDER] Next agent call would happen here for client:', clientId)
  
  return NextResponse.json({
    success: true,
    data,
    message: 'Onboarding completed successfully'
  })
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

### Comprehensive Fallback System

**Error Hierarchy:**
1. **Cache hit** → Use cached options (fastest, zero cost)
2. **Hardcoded options** → Use role-specific defaults (team context only)
3. **Claude generation** → Call API if 1 & 2 fail
4. **Fallback options** → Generic defaults if Claude fails/refuses
5. **Never block user** → Always return something

```typescript
function getFallbackOptions(step: string): string[] {
  const fallbacks: Record<string, string[]> = {
    team: [
      'Solo contributor',
      'Small team (2-10)',
      'Medium team (10-50)',
      'Large organization (50+)',
      'Distributed team',
    ],
    tasks: [
      'Product development',
      'Team collaboration',
      'Strategic planning',
      'Code reviews',
      'Client meetings',
      'Documentation',
    ],
    tools: [
      'Slack',
      'Google Workspace',
      'Jira',
      'GitHub',
      'Notion',
      'Zoom',
      'Figma',
      'VS Code',
    ],
    problems: [
      'Process inefficiency',
      'Tool fragmentation',
      'Scaling challenges',
      'Communication gaps',
      'Data silos',
      'Manual workflows',
    ],
  }
  
  return fallbacks[step] || ['General option 1', 'General option 2', 'General option 3']
}
```

### Error Scenarios Handled

**1. Claude API Failure**
```typescript
try {
  const message = await anthropic.messages.create({...})
} catch (error) {
  console.error('Claude API error:', error)
  const fallbackOptions = getFallbackOptions(step)
  await setCachedOptions(cacheKey, step, context, fallbackOptions)
  return streamOptions(fallbackOptions, true)
}
```

**2. Claude Refusal (Content Policy)**
```typescript
if (message.stop_reason === 'refusal') {
  console.log('Claude refused the request, using fallback')
  return streamOptions(getFallbackOptions(step), true)
}
```

**3. JSON Parse Error (Malformed Response)**
```typescript
try {
  // Strip markdown fences
  let cleanedText = textContent.text.trim()
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```(?:json)?\n?/, '')
                             .replace(/\n?```$/, '')
                             .trim()
  }
  
  const parsed = JSON.parse(cleanedText)
  options = Array.isArray(parsed) ? parsed : parsed.options || []
} catch (parseError) {
  console.error('JSON parse error:', parseError)
  options = getFallbackOptions(step)
}
```

**4. Empty Response**
```typescript
if (!options || options.length === 0) {
  console.log('Empty options array from LLM, using fallback')
  options = getFallbackOptions(step)
}
```

**5. Cache Lookup Failure**
```typescript
try {
  const cachedOptions = await getCachedOptions(cacheKey)
  if (cachedOptions) return streamOptions(cachedOptions, true)
} catch (error) {
  console.error('Cache lookup exception:', error)
  // Continue to generation, don't fail request
}
```

**6. Cache Storage Failure**
```typescript
try {
  await setCachedOptions(cacheKey, step, context, options)
} catch (error) {
  console.error('Cache storage exception:', error)
  // Don't fail the request if cache storage fails
  // User still gets their options
}
```

**7. Supabase Save Failure**
```typescript
async function saveProgress(state: OnboardingState) {
  try {
    await fetch('/api/onboarding/save', {...})
  } catch (error) {
    console.error('Error saving progress:', error)
    // Don't throw - user can continue without server save
    // localStorage keeps their session alive
  }
}
```

### Never Block UX Principles
- **Cache failures** → Continue to generation
- **API failures** → Use fallback options
- **Save failures** → Log and continue (localStorage still works)
- **Parse errors** → Use fallback options
- **Network timeouts** → Use fallback options
- **Always stream something** → User never sees a blank screen

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

## Performance & Cost Optimization

### Caching Strategy
**Goal**: Minimize Claude API calls while maintaining fresh, relevant options

**Cache Hit Rates (Expected):**
- Common role/industry combos: **95%+ hit rate** after first week
- Uncommon combos: **20-50%** hit rate
- Overall: **70-80%** cache hit rate

**Cost Savings:**
- No cache: ~$0.25 per onboarding (4 API calls × ~$0.06)
- With cache: ~$0.05 per onboarding (80% cached)
- **80% cost reduction** on Claude API

**Cache Warming Strategies:**
1. Pre-generate top 50 role/industry combinations
2. Monitor `hit_count` to identify popular combos
3. Regenerate stale options (>30 days old) during off-peak

### Frontend Performance
1. **Streaming animation**: Options appear progressively (50-150ms delays)
2. **Non-blocking saves**: `saveProgress()` doesn't block UI
3. **localStorage first**: Instant session resume on refresh
4. **Debounced input**: Custom text input debounced at 300ms
5. **Lazy renders**: Only render visible messages (virtual scrolling for long histories)

### API Performance
- **Streaming response**: Options stream to frontend as they're ready
- **Parallel operations**: Cache lookup + hardcoded fallback checked simultaneously
- **Lazy Anthropic init**: Client created per-request (env vars loaded)
- **Early returns**: Cache hit → stream immediately, no LLM wait

### Database Performance
- **Indexed lookups**: All key fields (client_id, cache_key) indexed
- **JSONB efficiency**: Industry/tasks stored as JSONB for flexible querying
- **Upsert pattern**: Single query for insert/update (no race conditions)
- **Fire-and-forget cache updates**: `hit_count` increment doesn't block response

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

---

## Implementation Summary

### What's Actually Built (vs Initial Spec)

✅ **Implemented & Working:**
- Claude Haiku 4.5 integration (not GPT-4)
- Sophisticated caching system (Supabase `options_cache`)
- Response streaming with progressive animation
- Multi-select for industry and team context
- Markdown fence handling in JSON parsing
- Comprehensive fallback system (5-layer)
- Progressive persistence (localStorage + Supabase)
- Session resume capability
- Hardcoded team options for common roles
- Real-time save on every step

🔄 **Key Differences from Initial Design:**
- **AI Model**: Claude Haiku 4.5 (cheaper, faster) instead of GPT-4 Turbo
- **Streaming**: Options stream one-by-one (50-150ms delays) for smooth UX
- **Caching**: Full Supabase caching layer (not just in-memory)
- **Multi-select**: Industry and team context allow multiple selections
- **Error Handling**: Extensive fallback system (never blocks user)
- **Cost**: ~80% reduction via caching vs naive LLM calls

📊 **Current Stats:**
- API Routes: 3 (`save`, `complete`, `generate-options`)
- Database Tables: 2 (`onboarding_profiles`, `options_cache`)
- Steps: 7 (role, industry, team, tasks, tools, problems, preferences)
- Required Fields: 4 (role, industry, tasks, tools)
- Cache Strategy: 5-layer fallback (cache → hardcoded → Claude → generic)
- Average Onboarding Time: ~2-3 minutes
- Estimated Cache Hit Rate: 70-80% after first week

🔗 **Integration Points:**
- **Line 66** in `/api/onboarding/complete/route.ts` → Python LangGraph retrieval agent trigger
- All user data stored in `onboarding_profiles` table with `client_id` as key
- Dashboard currently shows mock data → needs retrieval agent integration


