import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
  const role = context.role || 'unknown'
  const industry = Array.isArray(context.industry) 
    ? context.industry.sort().join('|') 
    : context.industry || 'unknown'
  
  return `${step}-${role}-${industry}`.toLowerCase().replace(/\s+/g, '-')
}

// Check cache for existing options
async function getCachedOptions(cacheKey: string): Promise<string[] | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('options_cache')
      .select('options, hit_count')
      .eq('cache_key', cacheKey)
      .single()

    if (error || !data) {
      return null
    }

    // Update hit count and last_used_at
    await supabaseAdmin
      .from('options_cache')
      .update({
        hit_count: (data.hit_count || 0) + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('cache_key', cacheKey)

    return data.options as string[]
  } catch (error) {
    console.error('Cache lookup error:', error)
    return null
  }
}

// Store options in cache
async function setCachedOptions(
  cacheKey: string,
  step: string,
  role: string,
  industry: string,
  options: string[]
): Promise<void> {
  try {
    const { data, error } = await supabaseAdmin
      .from('options_cache')
      .upsert({
        cache_key: cacheKey,
        step,
        role,
        industry,
        options,
        hit_count: 0,
        created_at: new Date().toISOString(),
        last_used_at: new Date().toISOString()
      })
      .select()
    
    if (error) {
      console.error('Cache storage error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
    } else {
      console.log(`✅ Cached options for ${cacheKey}`)
    }
  } catch (error) {
    console.error('Cache storage exception:', error)
    // Don't fail the request if cache storage fails
  }
}

function buildPrompt(step: string, context: any): string {
  switch (step) {
    case 'tasks':
      return `Generate 6 daily tasks for a ${context.role} working in ${
        Array.isArray(context.industry) ? context.industry.join(' and ') : context.industry
      }${context.teamContext ? ` in a ${context.teamContext} setup` : ''}.

Return specific, actionable tasks this person likely does regularly.
Keep each task under 4 words.
Consider industry-specific requirements.

Return as a JSON array of strings.`

    case 'tools':
      return `List 6-8 tools and frameworks used by a ${context.role} in ${
        Array.isArray(context.industry) ? context.industry.join(' and ') : context.industry
      }${context.tasks && context.tasks.length > 0 ? ` who does: ${context.tasks.join(', ')}` : ''}.

Mix of:
- Industry-standard tools
- Role-specific platforms
- Communication/collaboration tools
- Technical frameworks (if applicable)

Return as a JSON array of strings.`

    case 'problems':
      return `Identify 6 specific pain points for a ${context.role} in ${
        Array.isArray(context.industry) ? context.industry.join(' and ') : context.industry
      }${context.tools && context.tools.length > 0 ? ` using ${context.tools.join(', ')}` : ''}${
        context.tasks && context.tasks.length > 0 ? ` for ${context.tasks.join(', ')}` : ''
      }.

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

    // Handle semi-dynamic team context
    if (step === 'team') {
      const options = getTeamContextOptions(context.role || '')
      return NextResponse.json({ options })
    }

    // Handle fully dynamic steps with GPT-5-mini (with caching)
    if (['tasks', 'tools', 'problems'].includes(step)) {
      // Build cache key
      const cacheKey = buildCacheKey(step, context)
      
      // Check cache first
      const cachedOptions = await getCachedOptions(cacheKey)
      if (cachedOptions) {
        console.log(`Cache HIT for ${cacheKey}`)
        return NextResponse.json({ 
          options: cachedOptions,
          cached: true 
        })
      }
      
      console.log(`Cache MISS for ${cacheKey} - generating with LLM`)
      
      // Generate with LLM
      const prompt = buildPrompt(step, context)
      
      // Extract role and industry for caching
      const role = context.role || 'unknown'
      const industry = Array.isArray(context.industry) 
        ? context.industry.join(' and ') 
        : context.industry || 'unknown'

      const completion = await openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        // GPT-5-mini only supports temperature: 1 (default), so we omit it
        // Using structured outputs to reduce reasoning tokens and enforce schema
        max_completion_tokens: 500,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'options_response',
            schema: {
              type: 'object',
              properties: {
                options: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of 5-6 contextually relevant options'
                }
              },
              required: ['options'],
              additionalProperties: false
            },
            strict: true
          }
        }
      })

      // Check if we have choices and content
      if (!completion.choices || completion.choices.length === 0) {
        console.error('OpenAI returned no choices:', JSON.stringify(completion, null, 2))
        throw new Error('No choices returned from OpenAI')
      }

      const responseContent = completion.choices[0].message.content
      if (!responseContent) {
        console.error('OpenAI returned empty content. Full response:', JSON.stringify(completion, null, 2))
        console.log('Falling back to default options')
        const fallbackOptions = getFallbackOptions(step)
        await setCachedOptions(cacheKey, step, role, industry, fallbackOptions)
        return NextResponse.json({ 
          options: fallbackOptions,
          cached: false,
          fallback: true 
        })
      }

      // Parse the JSON response - structured outputs guarantee { options: [...] } format
      const parsed = JSON.parse(responseContent) as { options: string[] }
      
      let options: string[] = parsed.options || []

      if (!options || options.length === 0) {
        // Fallback options if generation fails
        console.log('Empty options array from LLM, using fallback')
        options = getFallbackOptions(step)
      }
      
      // Store in cache for future use
      await setCachedOptions(cacheKey, step, role, industry, options)

      return NextResponse.json({ 
        options,
        cached: false 
      })
    }

    return NextResponse.json({ error: 'Invalid step' }, { status: 400 })
  } catch (error) {
    console.error('Error generating options:', error)

    // Return fallback options on error
    const { step } = await req.json().catch(() => ({ step: 'tasks' }))
    const fallbackOptions = getFallbackOptions(step)

    return NextResponse.json({
      options: fallbackOptions,
      warning: 'Using fallback options due to generation error',
    })
  }
}

function getFallbackOptions(step: string): string[] {
  const fallbacks: Record<string, string[]> = {
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
