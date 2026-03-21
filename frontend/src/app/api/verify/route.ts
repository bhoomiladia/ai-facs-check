import { NextRequest, NextResponse } from 'next/server'
import { AdvancedFactCheckerAgent } from '@/lib/fact-checker-agent'

export async function POST(request: NextRequest) {
  try {
    const { text, url, imageUrl } = await request.json()

    if (!text && !url && !imageUrl) {
      return NextResponse.json(
        { error: 'Either text, url, or imageUrl must be provided' },
        { status: 400 }
      )
    }

    // Get text content from URL if provided
    let content = text
    if (url && !text) {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to fetch URL content')
        }
        const html = await response.text()
        // Basic text extraction
        content = html
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 3000) // Increased limit for more content
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to fetch URL content' },
          { status: 400 }
        )
      }
    }

    // Handle image-only requests
    if (!content && imageUrl) {
      content = 'Image analysis request'
    }

    if (!content?.trim() && !imageUrl) {
      return NextResponse.json(
        { error: 'No content to process' },
        { status: 400 }
      )
    }

    // Initialize the advanced fact-checker
    const factChecker = new AdvancedFactCheckerAgent()

    // Verify content using multiple sources
    const result = await factChecker.verifyContent(content?.trim() || '', imageUrl)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { 
        error: 'Verification failed', 
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}