import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      clientId,
      responses,
      conversationHistory,
      startedAt,
      completedAt,
      timeSpentSeconds
    } = body

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!responses.role || !responses.industry || !responses.tools) {
      return NextResponse.json(
        { error: 'Missing required fields: role, industry, and tools are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Update the profile as completed
    const { data, error } = await supabase
      .from('onboarding_profiles')
      .upsert(
        {
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
        },
        {
          onConflict: 'client_id',
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Error completing onboarding:', error)
      return NextResponse.json(
        { error: 'Failed to complete onboarding', details: error.message },
        { status: 500 }
      )
    }

    // TODO: Trigger next agent (retrieval agent) here
    // This is where we would call the next agent to process the completed profile
    // For now, we'll just return success
    console.log('[PLACEHOLDER] Next agent call would happen here for client:', clientId)

    return NextResponse.json({
      success: true,
      data,
      message: 'Onboarding completed successfully'
    })
  } catch (error) {
    console.error('Error in onboarding complete route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
