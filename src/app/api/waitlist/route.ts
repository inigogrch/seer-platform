import { NextResponse } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(request: Request) {
  try {
    const { email, timestamp } = await request.json()
    
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Define the path for the waitlist file in the project root
    const dataDir = path.join(process.cwd(), 'data')
    const filePath = path.join(dataDir, 'waitlist.json')
    
    // Create data directory if it doesn't exist
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true })
    }
    
    // Read existing data or initialize empty array
    let waitlistData: Array<{ email: string; timestamp: string }> = []
    
    if (existsSync(filePath)) {
      const fileContent = await readFile(filePath, 'utf-8')
      waitlistData = JSON.parse(fileContent)
    }
    
    // Check if email already exists
    if (waitlistData.some(entry => entry.email === email)) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 200 }
      )
    }
    
    // Add new email
    waitlistData.push({ email, timestamp })
    
    // Write back to file
    await writeFile(filePath, JSON.stringify(waitlistData, null, 2))
    
    return NextResponse.json(
      { message: 'Successfully added to waitlist' },
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

