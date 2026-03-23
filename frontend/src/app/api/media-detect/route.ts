import { NextRequest, NextResponse } from 'next/server'
import { MediaDetectionAgent } from '@/lib/media-detection-agent'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mediaUrl, mediaType, mediaBase64, mimeType } = body

    if (!mediaUrl && !mediaBase64) {
      return NextResponse.json(
        { error: 'Either mediaUrl or mediaBase64 must be provided' },
        { status: 400 }
      )
    }

    if (!mediaType || !['image', 'audio'].includes(mediaType)) {
      return NextResponse.json(
        { error: 'mediaType must be "image" or "audio"' },
        { status: 400 }
      )
    }

    const agent = new MediaDetectionAgent()

    // If base64 data was sent (from file upload), build a data URL
    let url = mediaUrl
    if (mediaBase64 && !mediaUrl) {
      url = `data:${mimeType || 'image/jpeg'};base64,${mediaBase64}`
    }

    const result = await agent.analyzeMedia(url, mediaType as 'image' | 'audio')

    return NextResponse.json(result)
  } catch (error) {
    console.error('Media detection API error:', error)
    return NextResponse.json(
      {
        error: 'Media detection failed',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
