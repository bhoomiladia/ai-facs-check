import { NextRequest, NextResponse } from 'next/server'
import { VideoDetectionAgent } from '@/lib/video-detection-agent'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { frames } = body

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return NextResponse.json(
        { error: 'frames must be a non-empty array of base64-encoded frame images' },
        { status: 400 }
      )
    }

    if (frames.length > 8) {
      return NextResponse.json(
        { error: 'Maximum 8 frames allowed per analysis' },
        { status: 400 }
      )
    }

    const agent = new VideoDetectionAgent()
    const result = await agent.analyzeVideo(frames)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Video detection API error:', error)
    return NextResponse.json(
      {
        error: 'Video detection failed',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
