import { NextRequest, NextResponse } from 'next/server'
import { AudioDetectionAgent } from '@/lib/audio-detection-agent'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { audioBase64, mimeType } = body

    if (!audioBase64) {
      return NextResponse.json(
        { error: 'audioBase64 must be provided' },
        { status: 400 }
      )
    }

    const agent = new AudioDetectionAgent()
    const result = await agent.analyzeAudio(audioBase64, mimeType || 'audio/mpeg')

    return NextResponse.json(result)
  } catch (error) {
    console.error('Audio detection API error:', error)
    return NextResponse.json(
      {
        error: 'Audio detection failed',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
