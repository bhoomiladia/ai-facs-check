'use client'

import { useState, useCallback } from 'react'
import { Header } from '@/components/Header'
import { MediaDetectionHero } from '@/components/media-detection/MediaDetectionHero'
import { MediaUploader } from '@/components/media-detection/MediaUploader'
import { MediaAnalysisView } from '@/components/media-detection/MediaAnalysisView'
import { MediaResultsDashboard } from '@/components/media-detection/MediaResultsDashboard'
import type { MediaFile, MediaAnalysisResult } from '@/types/media-detection'

type ViewState = 'upload' | 'analyzing' | 'results'

export default function MediaDetectionPage() {
  const [view, setView] = useState<ViewState>('upload')
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null)
  const [analysisResult, setAnalysisResult] = useState<MediaAnalysisResult | null>(null)

  const handleMediaSelected = useCallback((media: MediaFile) => {
    setSelectedMedia(media)
    setView('analyzing')
  }, [])

  const handleAnalysisComplete = useCallback((result: MediaAnalysisResult) => {
    setAnalysisResult(result)
    setView('results')
  }, [])

  const handleStartNew = useCallback(() => {
    setView('upload')
    setSelectedMedia(null)
    setAnalysisResult(null)
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Content */}
      <div className="relative z-10">
        <Header />
        <main className="container mx-auto px-4 py-6 max-w-6xl">
          {view === 'upload' && (
            <>
              <MediaDetectionHero />
              <MediaUploader onMediaSelected={handleMediaSelected} />
            </>
          )}
          {view === 'analyzing' && selectedMedia && (
            <MediaAnalysisView
              media={selectedMedia}
              onComplete={handleAnalysisComplete}
              onCancel={handleStartNew}
            />
          )}
          {view === 'results' && analysisResult && (
            <MediaResultsDashboard
              result={analysisResult}
              onStartNew={handleStartNew}
            />
          )}
        </main>
      </div>
    </div>
  )
}
