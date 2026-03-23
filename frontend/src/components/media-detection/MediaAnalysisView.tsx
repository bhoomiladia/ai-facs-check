'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { CheckCircle2, Loader2, Image, Music, AlertCircle } from 'lucide-react'
import type { MediaFile, AnalysisStage, MediaAnalysisResult } from '@/types/media-detection'

interface MediaAnalysisViewProps {
  media: MediaFile
  onComplete: (result: MediaAnalysisResult) => void
  onCancel: () => void
}

const STAGES: Omit<AnalysisStage, 'status' | 'progress'>[] = [
  { id: 'metadata', label: 'Metadata Extraction', description: 'Parsing EXIF data, container info, and creation timestamps...' },
  { id: 'pixel', label: 'Pixel & Frequency Analysis', description: 'Analyzing spatial frequencies, noise patterns, and color distributions...' },
  { id: 'gan', label: 'GAN Fingerprint Detection', description: 'Scanning for generative adversarial network artifacts and model signatures...' },
  { id: 'compression', label: 'Compression Artifact Analysis', description: 'Examining JPEG/PNG compression patterns for inconsistencies...' },
  { id: 'attribution', label: 'AI Model Attribution', description: 'Cross-referencing detected patterns with known AI model signatures...' },
]

export function MediaAnalysisView({ media, onComplete, onCancel }: MediaAnalysisViewProps) {
  const [stages, setStages] = useState<AnalysisStage[]>(
    STAGES.map((s) => ({ ...s, status: 'pending', progress: 0 }))
  )
  const [currentStageIdx, setCurrentStageIdx] = useState(0)
  const [overallProgress, setOverallProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const apiCalledRef = useRef(false)
  const apiResultRef = useRef<MediaAnalysisResult | null>(null)
  const apiDoneRef = useRef(false)
  const stageTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Start the real API call immediately
  useEffect(() => {
    if (apiCalledRef.current) return
    apiCalledRef.current = true

    const callApi = async () => {
      try {
        const body: Record<string, string> = {
          mediaType: media.type,
        }

        // If URL is a blob/object URL, convert to base64
        if (media.url.startsWith('blob:') || media.url.startsWith('data:')) {
          try {
            const resp = await fetch(media.url)
            const blob = await resp.blob()
            const reader = new FileReader()
            const base64Promise = new Promise<string>((resolve) => {
              reader.onloadend = () => {
                const dataUrl = reader.result as string
                // dataUrl = "data:image/jpeg;base64,xxxxx"
                const base64 = dataUrl.split(',')[1]
                resolve(base64)
              }
              reader.readAsDataURL(blob)
            })
            body.mediaBase64 = await base64Promise
            body.mimeType = media.mimeType || blob.type || 'image/jpeg'
          } catch {
            // If blob conversion fails, just pass the URL
            body.mediaUrl = media.url
          }
        } else {
          body.mediaUrl = media.url
        }

        const response = await fetch('/api/media-detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          const errData = await response.json()
          throw new Error(errData.error || errData.detail || 'Analysis failed')
        }

        const result: MediaAnalysisResult = await response.json()
        apiResultRef.current = result
        apiDoneRef.current = true
      } catch (err) {
        console.error('Media detection API error:', err)
        setError(err instanceof Error ? err.message : 'Analysis failed')
        apiDoneRef.current = true
      }
    }

    callApi()
  }, [media])

  // Animate stages while waiting for API
  const advanceStage = useCallback(() => {
    setCurrentStageIdx((prev) => {
      const next = prev + 1
      if (next >= STAGES.length) {
        // All UI stages done — wait for API if needed, then deliver result
        const checkResult = () => {
          if (apiDoneRef.current) {
            if (apiResultRef.current) {
              onComplete(apiResultRef.current)
            }
            // If error, it's already set in state
          } else {
            setTimeout(checkResult, 300)
          }
        }
        setTimeout(checkResult, 200)
      }
      return next
    })
  }, [onComplete])

  useEffect(() => {
    if (currentStageIdx >= STAGES.length) return
    if (error) return

    setStages((prev) =>
      prev.map((s, i) =>
        i === currentStageIdx ? { ...s, status: 'running', progress: 0 } : s
      )
    )

    let progress = 0
    // If API is done and we're on the last stage, speed through
    const isLastStage = currentStageIdx === STAGES.length - 1
    const baseSpeed = isLastStage && apiDoneRef.current ? 25 : 8

    stageTimerRef.current = setInterval(() => {
      // If API is done, speed up remaining stages
      const speed = apiDoneRef.current ? baseSpeed + 15 : baseSpeed + Math.random() * 10
      progress += speed

      if (progress >= 100) {
        progress = 100
        if (stageTimerRef.current) clearInterval(stageTimerRef.current)
        setStages((prev) =>
          prev.map((s, i) =>
            i === currentStageIdx ? { ...s, status: 'completed', progress: 100 } : s
          )
        )
        setOverallProgress(((currentStageIdx + 1) / STAGES.length) * 100)
        setTimeout(advanceStage, apiDoneRef.current ? 150 : 400)
      } else {
        setStages((prev) =>
          prev.map((s, i) =>
            i === currentStageIdx ? { ...s, progress } : s
          )
        )
        setOverallProgress(
          ((currentStageIdx + progress / 100) / STAGES.length) * 100
        )
      }
    }, 200)

    return () => {
      if (stageTimerRef.current) clearInterval(stageTimerRef.current)
    }
  }, [currentStageIdx, advanceStage, error])

  return (
    <div className="max-w-3xl mx-auto animate-slide-up">
      <div className="panel p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Analyzing Media</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Running {STAGES.length}-stage forensic analysis via Groq AI
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-xs text-slate-500 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800/60"
          >
            Cancel
          </button>
        </div>

        {/* Media preview bar */}
        <div className="panel-accent p-3 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-slate-900/80 flex items-center justify-center overflow-hidden flex-shrink-0">
            {media.type === 'image' ? (
              <img src={media.url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Music className="h-5 w-5 text-cyan-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{media.name}</p>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
              {media.type === 'image' ? (
                <Image className="h-3 w-3" />
              ) : (
                <Music className="h-3 w-3" />
              )}
              {media.type === 'image' ? 'Image' : 'Audio'} file
              {media.size ? ` • ${(media.size / 1024).toFixed(1)} KB` : ''}
            </p>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="panel-accent p-4 border-red-500/20 bg-red-500/5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-300 font-medium">Analysis Failed</p>
              <p className="text-xs text-red-400/70 mt-1">{error}</p>
              <button
                onClick={onCancel}
                className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                ← Try again
              </button>
            </div>
          </div>
        )}

        {/* Overall progress */}
        {!error && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Overall Progress</span>
                <span className="text-indigo-400 font-mono">{Math.round(overallProgress)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out bg-gradient-to-r from-indigo-500 to-purple-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>

            {/* Stages */}
            <div className="space-y-2">
              {stages.map((stage, i) => (
                <div
                  key={stage.id}
                  className={`rounded-xl border p-4 transition-all duration-300 ${
                    stage.status === 'running'
                      ? 'stage-active border-indigo-500/20 bg-indigo-500/[0.03]'
                      : stage.status === 'completed'
                      ? 'border-emerald-500/15 bg-emerald-500/[0.02]'
                      : 'border-slate-800/40 bg-slate-900/30 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {stage.status === 'completed' ? (
                        <div className="stage-check-anim">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        </div>
                      ) : stage.status === 'running' ? (
                        <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center">
                          <span className="text-[10px] text-slate-600">{i + 1}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${
                          stage.status === 'completed' ? 'text-emerald-300' :
                          stage.status === 'running' ? 'text-white' : 'text-slate-500'
                        }`}>
                          {stage.label}
                        </span>
                        {stage.status === 'running' && (
                          <span className="text-[11px] text-indigo-400 font-mono">
                            {Math.round(stage.progress)}%
                          </span>
                        )}
                        {stage.status === 'completed' && (
                          <span className="text-[10px] text-emerald-500 font-mono">DONE</span>
                        )}
                      </div>
                      {stage.status === 'running' && (
                        <p className="text-[11px] text-slate-500 mt-1">{stage.description}</p>
                      )}
                    </div>
                  </div>
                  {stage.status === 'running' && (
                    <div className="mt-3 h-1 rounded-full bg-slate-800/80 overflow-hidden">
                      <div
                        className="h-full rounded-full progress-shimmer transition-all duration-200"
                        style={{ width: `${stage.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
