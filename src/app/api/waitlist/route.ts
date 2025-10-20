import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Add a GET handler for testing
export async function GET() {
  return NextResponse.json({ 
    message: 'Waitlist API is working. Use POST to submit an email.',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    
    // Basic email validation
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Insert email into Supabase
    // The unique constraint on LOWER(email) will prevent duplicates automatically
    const { data, error } = await supabase
      .from('waitlist_emails')
      .insert({ email: email.trim() })
      .select()
      .single()

    if (error) {
      // Check if it's a duplicate email error
      if (error.code === '23505') { // Postgres unique violation code
        return NextResponse.json(
          { message: 'Email already registered' },
          { status: 200 }
        )
      }
      
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to add to waitlist' },
        { status: 500 }
      )
    }

    console.log('✅ Successfully added to waitlist:', email)
    
    return NextResponse.json(
      { 
        message: 'Successfully added to waitlist',
        data 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error processing waitlist submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

