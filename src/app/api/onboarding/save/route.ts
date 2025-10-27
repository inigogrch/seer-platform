import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      clientId,
      currentStep,
      responses,
      conversationHistory,
      startedAt
    } = body

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Upsert the onboarding progress
    const { data, error } = await supabase
      .from('onboarding_profiles')
      .upsert(
        {
          client_id: clientId,
          role: responses.role || null,
          industry: responses.industry || null,
          team_context: responses.teamContext || null,
          tasks: responses.tasks || [],
          tools: responses.tools || [],
          problems: responses.problems || [],
          conversation_history: conversationHistory || [],
          started_at: startedAt,
          completed: false,
        },
        {
          onConflict: 'client_id',
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Error saving onboarding progress:', error)
      return NextResponse.json(
        { error: 'Failed to save progress', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in onboarding save route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
