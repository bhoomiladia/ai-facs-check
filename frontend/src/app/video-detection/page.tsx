'use client'

import { useState, useCallback } from 'react'
import { VideoDetectionHero } from '@/components/video-detection/VideoDetectionHero'
import { VideoUploader } from '@/components/video-detection/VideoUploader'
import { VideoAnalysisView } from '@/components/video-detection/VideoAnalysisView'
import { VideoResultsDashboard } from '@/components/video-detection/VideoResultsDashboard'
import type { VideoFile, VideoAnalysisResult } from '@/types/video-detection'

type ViewState = 'upload' | 'analyzing' | 'results'

export default function VideoDetectionPage() {
  const [view, setView] = useState<ViewState>('upload')
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null)
  const [extractedFrames, setExtractedFrames] = useState<string[]>([])
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null)

  const handleVideoSelected = useCallback((video: VideoFile, frames: string[]) => {
    setSelectedVideo(video)
    setExtractedFrames(frames)
    setView('analyzing')
  }, [])

  const handleAnalysisComplete = useCallback((result: VideoAnalysisResult) => {
    setAnalysisResult(result)
    setView('results')
  }, [])

  const handleStartNew = useCallback(() => {
    setView('upload')
    setSelectedVideo(null)
    setExtractedFrames([])
    setAnalysisResult(null)
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10">
        <main className="container mx-auto px-4 py-6 max-w-6xl">
          {view === 'upload' && (
            <>
              <VideoDetectionHero />
              <VideoUploader onVideoSelected={handleVideoSelected} />
            </>
          )}
          {view === 'analyzing' && selectedVideo && (
            <VideoAnalysisView
              video={selectedVideo}
              frames={extractedFrames}
              onComplete={handleAnalysisComplete}
              onCancel={handleStartNew}
            />
          )}
          {view === 'results' && analysisResult && (
            <VideoResultsDashboard
              result={analysisResult}
              onStartNew={handleStartNew}
            />
          )}
        </main>
      </div>
    </div>
  )
}
