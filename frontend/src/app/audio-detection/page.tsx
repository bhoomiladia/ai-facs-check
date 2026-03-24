'use client'

import { useState, useCallback } from 'react'
import { AudioDetectionHero } from '@/components/audio-detection/AudioDetectionHero'
import { AudioUploader } from '@/components/audio-detection/AudioUploader'
import { AudioAnalysisView } from '@/components/audio-detection/AudioAnalysisView'
import { AudioResultsDashboard } from '@/components/audio-detection/AudioResultsDashboard'
import type { AudioFile, AudioAnalysisResult } from '@/types/audio-detection'

type ViewState = 'upload' | 'analyzing' | 'results'

export default function AudioDetectionPage() {
  const [view, setView] = useState<ViewState>('upload')
  const [selectedAudio, setSelectedAudio] = useState<AudioFile | null>(null)
  const [audioBase64, setAudioBase64] = useState<string>('')
  const [audioMimeType, setAudioMimeType] = useState<string>('audio/mpeg')
  const [analysisResult, setAnalysisResult] = useState<AudioAnalysisResult | null>(null)

  const handleAudioSelected = useCallback((audio: AudioFile, base64: string, mimeType: string) => {
    setSelectedAudio(audio)
    setAudioBase64(base64)
    setAudioMimeType(mimeType)
    setView('analyzing')
  }, [])

  const handleAnalysisComplete = useCallback((result: AudioAnalysisResult) => {
    setAnalysisResult(result)
    setView('results')
  }, [])

  const handleStartNew = useCallback(() => {
    setView('upload')
    setSelectedAudio(null)
    setAudioBase64('')
    setAnalysisResult(null)
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10">
        <main className="container mx-auto px-4 py-6 max-w-6xl">
          {view === 'upload' && (
            <>
              <AudioDetectionHero />
              <AudioUploader onAudioSelected={handleAudioSelected} />
            </>
          )}
          {view === 'analyzing' && selectedAudio && (
            <AudioAnalysisView
              audio={selectedAudio}
              audioBase64={audioBase64}
              audioMimeType={audioMimeType}
              onComplete={handleAnalysisComplete}
              onCancel={handleStartNew}
            />
          )}
          {view === 'results' && analysisResult && (
            <AudioResultsDashboard
              result={analysisResult}
              onStartNew={handleStartNew}
            />
          )}
        </main>
      </div>
    </div>
  )
}
