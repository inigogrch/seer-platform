import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase admin client for caching
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// System prompt for the onboarding agent
const SYSTEM_PROMPT = `You are an expert at understanding professional roles and generating relevant, specific options for user onboarding.

Your goal is to generate contextually relevant options based on the user's accumulated profile.

Guidelines:
- Keep options concise (2-10 words each)
- Be specific to the industry and role
- Prioritize practical, common choices
- Generate exactly 5-6 options
- Make each option distinct and actionable`

// Semi-dynamic team context options based on role
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
  'Data Scientist': [
    'Embedded in product',
    'Central data team',
    'Research focused',
    'Client-facing',
    'Solo practitioner',
  ],
  'Founder & CEO': [
    'Solo founder',
    'Co-founding team',
    'Early stage (<10 people)',
    'Growth stage (10-50)',
    'Scaling (50+)',
  ],
  'Marketing Manager': [
    'Growth marketing',
    'Brand/Content team',
    'Product marketing',
    'Solo marketer',
    'Agency partner',
  ],
  'Sales Representative': [
    'Enterprise sales',
    'SMB/Mid-market',
    'Inside sales team',
    'Solo sales rep',
    'Sales leadership',
  ],
}

function getTeamContextOptions(role: string): string[] {
  return (
    TEAM_CONTEXT_OPTIONS[role] || [
      'Solo contributor',
      'Small team (2-10)',
      'Medium team (10-50)',
      'Large organization (50+)',
      'Distributed team',
    ]
  )
}

// Build cache key from context
function buildCacheKey(step: string, context: any): string {
  const role = (context.role || 'unknown').trim()
  const industry = Array.isArray(context.industry) 
    ? context.industry.sort().join('|') 
    : (context.industry || 'unknown').trim()
  
  // Normalize to lowercase and replace spaces/special chars with dashes
  const cacheKey = `${step}-${role}-${industry}`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/&/g, 'and')
  
  return cacheKey
}

// Normalize industry for storage (consistent format)
function normalizeIndustry(industry: any): string {
  if (Array.isArray(industry)) {
    return industry.sort().join(' | ')
  }
  return industry || 'unknown'
}

// Check cache for existing options
async function getCachedOptions(cacheKey: string): Promise<string[] | null> {
  try {
    console.log(`🔍 Looking up cache for key: ${cacheKey}`)
    
    const { data, error } = await supabaseAdmin
      .from('options_cache')
      .select('options, hit_count')
      .eq('cache_key', cacheKey)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - not an error, just a cache miss
        console.log(`❌ Cache MISS: ${cacheKey}`)
      } else {
        console.error('Cache lookup error:', error)
      }
      return null
    }

    if (!data) {
      console.log(`❌ Cache MISS: ${cacheKey}`)
      return null
    }

    console.log(`✅ Cache HIT: ${cacheKey} (hit count: ${data.hit_count})`)

    // Update hit count and last_used_at asynchronously (don't wait)
    supabaseAdmin
      .from('options_cache')
      .update({
        hit_count: (data.hit_count || 0) + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('cache_key', cacheKey)
      .then(({ error }) => {
        if (error) console.error('Failed to update hit count:', error)
      })

    return data.options as string[]
  } catch (error) {
    console.error('Cache lookup exception:', error)
    return null
  }
}

// Store options in cache
async function setCachedOptions(
  cacheKey: string,
  step: string,
  context: any,
  options: string[]
): Promise<void> {
  try {
    const role = context.role || 'unknown'
    const industry = normalizeIndustry(context.industry)
    
    console.log(`💾 Storing in cache: ${cacheKey}`)
    console.log(`   - Step: ${step}`)
    console.log(`   - Role: ${role}`)
    console.log(`   - Industry: ${industry}`)
    console.log(`   - Options count: ${options.length}`)
    
    const { data, error } = await supabaseAdmin
      .from('options_cache')
      .upsert(
        {
          cache_key: cacheKey,
          step,
          role,
          industry,
          options,
          hit_count: 0,
          last_used_at: new Date().toISOString()
        },
        {
          onConflict: 'cache_key'
        }
      )
      .select()
    
    if (error) {
      console.error('❌ Cache storage error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
    } else if (data && data.length > 0) {
      console.log(`✅ Successfully cached options for ${cacheKey}`)
    } else {
      console.warn(`⚠️ Cache upsert returned no data for ${cacheKey}`)
    }
  } catch (error) {
    console.error('❌ Cache storage exception:', error)
    // Don't fail the request if cache storage fails
  }
}

function buildPrompt(step: string, context: any): string {
  const industryText = Array.isArray(context.industry) 
    ? context.industry.join(' and ') 
    : context.industry

  switch (step) {
    case 'team':
      return `Generate 5-6 team context options for a ${context.role} working in ${industryText}.

Consider typical team structures and setups for this role/industry combination:
- Team size variations
- Organizational structures  
- Working arrangements
- Reporting structures

Keep each option under 6 words.
Return as a JSON array of strings.`

    case 'tasks':
      const teamText = context.teamContext 
        ? Array.isArray(context.teamContext)
          ? ` in a ${context.teamContext.join(' and ')} setup`
          : ` in a ${context.teamContext} setup`
        : ''
      
      return `Generate 6 daily tasks for a ${context.role} working in ${industryText}${teamText}.

Return specific, actionable tasks this person likely does regularly.
Keep each task under 4 words.
Consider industry-specific requirements.

Return as a JSON array of strings.`

    case 'tools':
      return `List 6-8 tools and frameworks used by a ${context.role} in ${industryText}${
        context.tasks && context.tasks.length > 0 ? ` who does: ${context.tasks.join(', ')}` : ''
      }.

Mix of:
- Industry-standard tools
- Role-specific platforms
- Communication/collaboration tools
- Technical frameworks (if applicable)

Return as a JSON array of strings.`

    case 'problems':
      return `Identify 6 specific pain points for a ${context.role} in ${industryText}${
        context.tools && context.tools.length > 0 ? ` using ${context.tools.join(', ')}` : ''
      }${context.tasks && context.tasks.length > 0 ? ` for ${context.tasks.join(', ')}` : ''}.

Focus on:
- Workflow inefficiencies
- Tooling gaps
- Industry-specific challenges
- Scale/growth related issues

Keep each under 5 words.
Return as a JSON array of strings.`

    default:
      return 'Generate relevant options.'
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { step, context } = body

    if (!step) {
      return NextResponse.json({ error: 'Step is required' }, { status: 400 })
    }

    // Handle dynamic steps with Claude Haiku 4.5 (with caching)
    if (['team', 'tasks', 'tools', 'problems'].includes(step)) {
      // Build cache key
      const cacheKey = buildCacheKey(step, context)
      
      // Check cache first
      const cachedOptions = await getCachedOptions(cacheKey)
      if (cachedOptions) {
        // Stream cached options for consistent UX
        return streamOptions(cachedOptions, true)
      }
      
      // If team step cache miss, try hardcoded fallback first (only for known roles)
      if (step === 'team' && context.role && TEAM_CONTEXT_OPTIONS[context.role]) {
        const hardcodedOptions = getTeamContextOptions(context.role)
        console.log(`Using hardcoded team options for ${context.role}`)
        // Cache the hardcoded options for next time
        await setCachedOptions(cacheKey, step, context, hardcodedOptions)
        return streamOptions(hardcodedOptions, true)
      }
      
      console.log(`🤖 Generating with LLM for ${cacheKey}`)
      
      // Generate with LLM
      const prompt = buildPrompt(step, context)
      
      // Debug logging
      console.log('Context received:', JSON.stringify(context, null, 2))
      console.log('Prompt:', prompt)

      // Initialize Anthropic client per request to ensure env vars are loaded
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        temperature: 0.7,
        system: SYSTEM_PROMPT,
        messages: [
          { 
            role: 'user', 
            content: prompt + '\n\nRespond with ONLY a JSON object in this exact format: {"options": ["option1", "option2", ...]}' 
          }
        ]
      })

      // Check if we have content
      if (!message.content || message.content.length === 0) {
        console.error('Claude returned no content')
        const fallbackOptions = getFallbackOptions(step)
        await setCachedOptions(cacheKey, step, context, fallbackOptions)
        return streamOptions(fallbackOptions, true)
      }

      // Handle refusal stop reason (new in Claude 4.5)
      if (message.stop_reason === 'refusal') {
        console.log('Claude refused the request, using fallback')
        const fallbackOptions = getFallbackOptions(step)
        await setCachedOptions(cacheKey, step, context, fallbackOptions)
        return streamOptions(fallbackOptions, true)
      }

      // Extract text content from Claude's response
      const textContent = message.content.find(block => block.type === 'text')
      if (!textContent || textContent.type !== 'text') {
        console.error('No text content in Claude response')
        const fallbackOptions = getFallbackOptions(step)
        await setCachedOptions(cacheKey, step, context, fallbackOptions)
        return streamOptions(fallbackOptions, true)
      }

      // Parse the JSON response
      console.log('Raw Claude response:', textContent.text)
      
      let options: string[] = []
      try {
        // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
        let cleanedText = textContent.text.trim()
        if (cleanedText.startsWith('```')) {
          // Remove opening fence (```json or ```)
          cleanedText = cleanedText.replace(/^```(?:json)?\n?/, '')
          // Remove closing fence
          cleanedText = cleanedText.replace(/\n?```$/, '')
          cleanedText = cleanedText.trim()
        }
        
        const parsed = JSON.parse(cleanedText)
        
        // Handle both formats: {"options": [...]} or just [...]
        if (Array.isArray(parsed)) {
          options = parsed
        } else if (parsed.options && Array.isArray(parsed.options)) {
          options = parsed.options
        } else {
          console.error('Unexpected JSON structure:', parsed)
          options = getFallbackOptions(step)
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        console.error('Failed to parse:', textContent.text)
        options = getFallbackOptions(step)
      }

      if (!options || options.length === 0) {
        // Fallback options if generation fails
        console.log('Empty options array from LLM, using fallback')
        options = getFallbackOptions(step)
      }
      
      // Store in cache for future use
      await setCachedOptions(cacheKey, step, context, options)

      // Stream options to frontend
      return streamOptions(options, false)
    }

    return NextResponse.json({ error: 'Invalid step' }, { status: 400 })
  } catch (error) {
    console.error('Error generating options:', error)

    // Return fallback options on error
    const { step } = await req.json().catch(() => ({ step: 'tasks' }))
    const fallbackOptions = getFallbackOptions(step)

    return streamOptions(fallbackOptions, true)
  }
}

// Helper function to stream options one by one
function streamOptions(options: string[], isCached: boolean) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send options one by one with slight delay for animation
        for (let i = 0; i < options.length; i++) {
          const data = JSON.stringify({ 
            option: options[i],
            index: i,
            total: options.length,
            cached: isCached
          }) + '\n'
          
          controller.enqueue(encoder.encode(data))
          
          // Shorter delay for cached options, longer for generated
          if (i < options.length - 1) {
            await new Promise(resolve => setTimeout(resolve, isCached ? 50 : 150))
          }
        }
        
        // Send completion signal
        controller.enqueue(encoder.encode(JSON.stringify({ done: true }) + '\n'))
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    }
  })
}

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
