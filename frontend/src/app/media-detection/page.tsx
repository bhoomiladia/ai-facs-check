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
      {/* Graphical Background */}
      <div className="scene-bg">
        <div className="dot-grid" />
        <div className="scan-line" />
        <div className="geo-shape geo-1" />
        <div className="geo-shape geo-2" />
        <div className="geo-shape geo-3" />
        <div className="geo-shape geo-4" />
        <div className="connection-lines">
          <svg>
            <line className="conn-line" x1="10%" y1="20%" x2="45%" y2="55%" />
            <line className="conn-line" x1="90%" y1="15%" x2="55%" y2="50%" />
            <line className="conn-line" x1="20%" y1="80%" x2="60%" y2="45%" />
            <line className="conn-line" x1="80%" y1="75%" x2="50%" y2="40%" />
          </svg>
        </div>
        <div className="pulse-dot" />
        <div className="pulse-dot" />
        <div className="pulse-dot" />
        <div className="pulse-dot" />
        <div className="pulse-dot" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Header />
        <main className="container mx-auto px-4 py-6">
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
