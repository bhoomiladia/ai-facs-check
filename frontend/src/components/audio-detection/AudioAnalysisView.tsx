'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { CheckCircle2, Loader2, AudioWaveform, AlertCircle } from 'lucide-react'
import type { AudioFile, AudioAnalysisStage, AudioAnalysisResult } from '@/types/audio-detection'

interface AudioAnalysisViewProps {
  audio: AudioFile
  audioBase64: string
  audioMimeType: string
  onComplete: (result: AudioAnalysisResult) => void
  onCancel: () => void
}

const STAGES: Omit<AudioAnalysisStage, 'status' | 'progress'>[] = [
  { id: 'transcribe', label: 'Whisper Transcription', description: 'Transcribing audio with Whisper Large V3 for linguistic analysis...' },
  { id: 'tts', label: 'TTS Fingerprint Scan', description: 'Scanning for neural text-to-speech synthesis artifacts...' },
  { id: 'prosody', label: 'Prosody & Rhythm', description: 'Evaluating speech rhythm, pauses, and breathing patterns...' },
  { id: 'spectral', label: 'Spectral Analysis', description: 'Analyzing frequency distribution and formant consistency...' },
  { id: 'attribution', label: 'Model Attribution', description: 'Cross-referencing with known AI voice model signatures...' },
]

export function AudioAnalysisView({ audio, audioBase64, audioMimeType, onComplete, onCancel }: AudioAnalysisViewProps) {
  const [stages, setStages] = useState<AudioAnalysisStage[]>(
    STAGES.map((s) => ({ ...s, status: 'pending', progress: 0 }))
  )
  const [currentStageIdx, setCurrentStageIdx] = useState(0)
  const [overallProgress, setOverallProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const apiCalledRef = useRef(false)
  const apiResultRef = useRef<AudioAnalysisResult | null>(null)
  const apiDoneRef = useRef(false)
  const stageTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Fire the real API call immediately
  useEffect(() => {
    if (apiCalledRef.current) return
    apiCalledRef.current = true

    const callApi = async () => {
      try {
        const response = await fetch('/api/audio-detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioBase64, mimeType: audioMimeType }),
        })

        if (!response.ok) {
          const errData = await response.json()
          throw new Error(errData.error || errData.detail || 'Analysis failed')
        }

        const result: AudioAnalysisResult = await response.json()
        apiResultRef.current = result
        apiDoneRef.current = true
      } catch (err) {
        console.error('Audio detection API error:', err)
        setError(err instanceof Error ? err.message : 'Analysis failed')
        apiDoneRef.current = true
      }
    }

    callApi()
  }, [audioBase64, audioMimeType])

  // Animate stages while waiting for API
  const advanceStage = useCallback(() => {
    setCurrentStageIdx((prev) => {
      const next = prev + 1
      if (next >= STAGES.length) {
        const checkResult = () => {
          if (apiDoneRef.current) {
            if (apiResultRef.current) {
              onComplete(apiResultRef.current)
            }
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
    const isLastStage = currentStageIdx === STAGES.length - 1
    const baseSpeed = isLastStage && apiDoneRef.current ? 30 : 5

    stageTimerRef.current = setInterval(() => {
      const speed = apiDoneRef.current ? baseSpeed + 10 : baseSpeed + Math.random() * 8
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
        setTimeout(advanceStage, apiDoneRef.current ? 100 : 300)
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
            <h3 className="text-lg font-black text-foreground uppercase">Analyzing Audio File</h3>
            <p className="text-xs text-foreground/50 mt-0.5 font-bold">
              Running {STAGES.length}-stage forensic audio analysis via Groq AI
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-xs text-foreground/50 hover:text-foreground transition-colors px-3 py-1.5 border border-foreground/30 hover:border-foreground font-bold uppercase"
          >
            Cancel
          </button>
        </div>

        {/* Audio info bar */}
        <div className="panel-accent p-3 flex items-center gap-3">
          <div className="w-12 h-12 bg-muted border border-foreground flex items-center justify-center overflow-hidden flex-shrink-0">
            <AudioWaveform className="h-5 w-5 text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground font-bold truncate tracking-tight">{audio.name}</p>
            <p className="text-[11px] text-foreground/50 flex items-center gap-1.5 mt-0.5 font-bold uppercase tracking-wider">
              {audio.mimeType || 'Audio'} • {(audio.size ? (audio.size / (1024 * 1024)).toFixed(1) : 0)} MB
            </p>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="panel-accent p-4 border-2 border-red-800 bg-red-50 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-800 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-800 font-bold uppercase">Analysis Failed</p>
              <p className="text-xs text-red-700 mt-1 font-medium">{error}</p>
              <button
                onClick={onCancel}
                className="mt-3 text-xs text-primary hover:underline font-black uppercase tracking-widest"
              >
                ← Try another file
              </button>
            </div>
          </div>
        )}

        {/* Progress */}
        {!error && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground/60 font-black uppercase tracking-widest">Processing Analysis</span>
                <span className="text-foreground font-black">{Math.round(overallProgress)}%</span>
              </div>
              <div className="h-2 bg-muted border border-foreground overflow-hidden">
                <div
                  className="h-full transition-all duration-300 ease-out bg-foreground"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>

            {/* Stages */}
            <div className="space-y-2">
              {stages.map((stage, i) => (
                <div
                  key={stage.id}
                  className={`border-2 p-4 transition-all duration-300 ${
                    stage.status === 'running'
                      ? 'border-foreground bg-muted'
                      : stage.status === 'completed'
                      ? 'border-emerald-800 bg-emerald-50'
                      : 'border-foreground/20 bg-background opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {stage.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-800" />
                      ) : stage.status === 'running' ? (
                        <Loader2 className="h-5 w-5 text-foreground animate-spin" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-foreground/30 flex items-center justify-center">
                          <span className="text-[10px] text-foreground/40 font-black">{i + 1}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-black uppercase tracking-tight ${
                          stage.status === 'completed' ? 'text-emerald-800' :
                          stage.status === 'running' ? 'text-foreground' : 'text-foreground/40'
                        }`}>
                          {stage.label}
                        </span>
                        {stage.status === 'running' && (
                          <span className="text-[11px] text-foreground font-black">
                            {Math.round(stage.progress)}%
                          </span>
                        )}
                        {stage.status === 'completed' && (
                          <span className="text-[10px] text-emerald-800 font-black uppercase bg-emerald-100 px-1.5 py-0.5 border border-emerald-800/30">PASSED</span>
                        )}
                      </div>
                      {stage.status === 'running' && (
                        <p className="text-[11px] text-foreground/50 mt-1 italic font-medium">{stage.description}</p>
                      )}
                    </div>
                  </div>
                  {stage.status === 'running' && (
                    <div className="mt-3 h-1 bg-muted border border-foreground/30 overflow-hidden">
                      <div
                        className="h-full bg-foreground transition-all duration-200"
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
