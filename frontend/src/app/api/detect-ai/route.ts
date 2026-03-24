import { NextRequest, NextResponse } from 'next/server'
import { aiTextDetector } from '@/lib/ai-text-detector'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'A "text" field (string) is required.' },
        { status: 400 }
      )
    }

    if (text.trim().length < 50) {
      return NextResponse.json(
        { error: 'Text must be at least 50 characters for meaningful analysis.' },
        { status: 400 }
      )
    }

    const result = await aiTextDetector.analyze(text.trim())

    return NextResponse.json(result)
  } catch (error) {
    console.error('AI text detection error:', error)
    return NextResponse.json(
      {
        error: 'AI text detection failed',
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
