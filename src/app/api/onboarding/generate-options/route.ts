import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// System prompt for the onboarding agent
const SYSTEM_PROMPT = `You are an expert at understanding professional roles and generating relevant, specific options for user onboarding.

Your goal is to generate contextually relevant options based on the user's accumulated profile.

Guidelines:
- Keep options concise (2-5 words each)
- Be specific to the industry and role
- Prioritize practical, common choices
- Return exactly the number of options requested
- Format: Return a JSON array of strings only, no additional text`

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

    // Handle fully dynamic steps with GPT-4o-mini
    if (['tasks', 'tools', 'problems'].includes(step)) {
      const prompt = buildPrompt(step, context)

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      })

      const responseContent = completion.choices[0].message.content
      if (!responseContent) {
        throw new Error('No response from OpenAI')
      }

      // Parse the JSON response
      const parsed = JSON.parse(responseContent)

      // Handle different possible response formats
      let options: string[]
      if (Array.isArray(parsed)) {
        options = parsed
      } else if (parsed.options && Array.isArray(parsed.options)) {
        options = parsed.options
      } else if (parsed.items && Array.isArray(parsed.items)) {
        options = parsed.items
      } else {
        // Try to extract any array from the response
        const firstArray = Object.values(parsed).find(val => Array.isArray(val))
        options = firstArray as string[] || []
      }

      if (!options || options.length === 0) {
        // Fallback options if generation fails
        options = getFallbackOptions(step)
      }

      return NextResponse.json({ options })
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
