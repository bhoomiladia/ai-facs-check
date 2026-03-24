'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, AudioWaveform, X, Sparkles, Play, Pause } from 'lucide-react'
import type { AudioFile } from '@/types/audio-detection'

interface AudioUploaderProps {
  onAudioSelected: (audio: AudioFile, base64: string, mimeType: string) => void
}

const ACCEPTED_FORMATS = 'audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/flac,audio/aac,audio/webm,audio/x-m4a,.mp3,.wav,.ogg,.flac,.aac,.m4a,.webm'

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the data URL prefix to get pure base64
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function AudioUploader({ onAudioSelected }: AudioUploaderProps) {
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<AudioFile | null>(null)
  const [audioObjectUrl, setAudioObjectUrl] = useState<string | null>(null)
  const [audioMimeType, setAudioMimeType] = useState<string>('audio/mpeg')
  const [rawFile, setRawFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => setDragOver(false), [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const processFile = (file: File) => {
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|flac|aac|m4a|webm)$/i)) {
      setError('Please upload an audio file (MP3, WAV, OGG, FLAC, AAC, M4A)')
      return
    }

    // 50MB limit
    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB limit')
      return
    }

    setError(null)
    const objUrl = URL.createObjectURL(file)
    setAudioObjectUrl(objUrl)
    setAudioMimeType(file.type || 'audio/mpeg')
    setRawFile(file)

    const audio: AudioFile = {
      name: file.name,
      url: objUrl,
      size: file.size,
      mimeType: file.type,
    }
    setPreview(audio)
  }

  const clearPreview = () => {
    if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl)
    setPreview(null)
    setAudioObjectUrl(null)
    setRawFile(null)
    setError(null)
    setIsPlaying(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const startAnalysis = async () => {
    if (!rawFile) return
    setSubmitting(true)
    setError(null)

    try {
      const base64 = await readFileAsBase64(rawFile)
      onAudioSelected(preview!, base64, audioMimeType)
    } catch (err) {
      console.error('File read error:', err)
      setError(err instanceof Error ? err.message : 'Failed to read audio file')
      setSubmitting(false)
    }
  }

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-3xl mx-auto animate-slide-up">
      {preview ? (
        <div className="panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-foreground uppercase">Audio Preview</h3>
            <button onClick={clearPreview} className="text-foreground/50 hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Audio player */}
          <div className="panel-accent p-5 flex flex-col items-center gap-4">
            <div className="w-20 h-20 border-2 border-foreground bg-muted flex items-center justify-center">
              <AudioWaveform className="h-8 w-8 text-foreground" />
            </div>

            <audio
              ref={audioRef}
              src={preview.url}
              onEnded={() => setIsPlaying(false)}
              onLoadedMetadata={(e) => {
                const dur = (e.target as HTMLAudioElement).duration
                if (dur && isFinite(dur)) {
                  setPreview(prev => prev ? { ...prev, duration: dur } : prev)
                }
              }}
              className="hidden"
            />

            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="w-10 h-10 border-2 border-foreground bg-foreground text-background flex items-center justify-center hover:bg-primary transition-colors"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </button>
              <div className="text-center">
                <p className="text-sm text-foreground font-bold truncate max-w-[240px]">{preview.name}</p>
                <p className="text-[11px] text-foreground/50 font-bold uppercase">
                  {preview.mimeType || 'Audio'} • {(preview.size ? (preview.size / (1024 * 1024)).toFixed(1) : '?')} MB
                  {preview.duration ? ` • ${formatDuration(preview.duration)}` : ''}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-700 text-red-900 text-sm font-bold">
              {error}
            </div>
          )}

          <button
            onClick={startAnalysis}
            disabled={submitting}
            className="w-full btn-verify h-11 text-sm flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="inline-block ai-detection-spinner mr-2 w-4 h-4 border-2" style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: 'white' }} />
                Reading Audio...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyze for AI Generation
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            className={`upload-zone p-10 text-center ${dragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-scan-line" />
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FORMATS}
              className="hidden"
              onChange={handleFileSelect}
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 border-2 border-foreground bg-muted flex items-center justify-center">
                <Upload className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <p className="text-sm text-foreground font-bold uppercase">
                  Drop your audio file here
                </p>
                <p className="text-xs text-foreground/50 mt-1">
                  or click to browse • MP3, WAV, OGG, FLAC, AAC, M4A • Max 50MB
                </p>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center gap-1 text-[11px] text-foreground/60 font-bold">
                  <AudioWaveform className="h-3 w-3" /> Audio Files
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-700 text-red-900 text-sm font-bold">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
