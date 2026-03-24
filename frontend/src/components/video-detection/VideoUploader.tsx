'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, Film, X, Sparkles } from 'lucide-react'
import type { VideoFile } from '@/types/video-detection'

interface VideoUploaderProps {
  onVideoSelected: (video: VideoFile, frames: string[]) => void
}

const ACCEPTED_FORMATS = 'video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska,.mp4,.webm,.mov,.avi,.mkv'

function extractFrames(videoUrl: string, count: number = 4): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.playsInline = true

    video.onloadedmetadata = () => {
      const duration = video.duration
      if (!duration || duration <= 0) {
        reject(new Error('Could not determine video duration'))
        return
      }

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      // Cap dimensions for performance
      const MAX_DIM = 800
      let { videoWidth: w, videoHeight: h } = video
      if (w > MAX_DIM || h > MAX_DIM) {
        if (w > h) {
          h = Math.round((h * MAX_DIM) / w)
          w = MAX_DIM
        } else {
          w = Math.round((w * MAX_DIM) / h)
          h = MAX_DIM
        }
      }
      canvas.width = w
      canvas.height = h

      const frames: string[] = []
      let idx = 0
      // Pick evenly spaced times, avoiding the very start/end
      const times = Array.from({ length: count }, (_, i) =>
        Math.max(0.5, (duration * (i + 1)) / (count + 1))
      )

      const captureNext = () => {
        if (idx >= times.length) {
          URL.revokeObjectURL(video.src)
          resolve(frames)
          return
        }
        video.currentTime = times[idx]
      }

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.75)
        const base64 = dataUrl.split(',')[1]
        frames.push(base64)
        idx++
        captureNext()
      }

      captureNext()
    }

    video.onerror = () => {
      reject(new Error('Failed to load video'))
    }

    video.src = videoUrl
    video.load()
  })
}

export function VideoUploader({ onVideoSelected }: VideoUploaderProps) {
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<VideoFile | null>(null)
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    if (!file.type.startsWith('video/')) {
      setError('Please upload a video file (MP4, WebM, MOV, AVI, MKV)')
      return
    }

    // 100MB limit
    if (file.size > 100 * 1024 * 1024) {
      setError('File size exceeds 100MB limit')
      return
    }

    setError(null)
    const objUrl = URL.createObjectURL(file)
    setVideoObjectUrl(objUrl)

    const video: VideoFile = {
      name: file.name,
      url: objUrl,
      size: file.size,
      mimeType: file.type,
    }
    setPreview(video)
  }

  const clearPreview = () => {
    if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl)
    setPreview(null)
    setVideoObjectUrl(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const startAnalysis = async () => {
    if (!preview || !videoObjectUrl) return

    setExtracting(true)
    setError(null)

    try {
      const frames = await extractFrames(videoObjectUrl, 4)
      if (frames.length === 0) {
        throw new Error('Could not extract any frames from the video')
      }
      onVideoSelected(preview, frames)
    } catch (err) {
      console.error('Frame extraction error:', err)
      setError(err instanceof Error ? err.message : 'Failed to extract frames')
    } finally {
      setExtracting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto animate-slide-up">
      {preview ? (
        <div className="panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-foreground uppercase">Video Preview</h3>
            <button onClick={clearPreview} className="text-foreground/50 hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="media-preview-overlay bg-muted flex items-center justify-center p-4 min-h-[200px]">
            <video
              src={preview.url}
              controls
              className="max-h-[280px] w-full object-contain"
              muted
              playsInline
            />
          </div>
          <div className="flex items-center justify-between text-xs text-foreground/50 font-bold">
            <span>{preview.name}</span>
            {preview.size && (
              <span>{(preview.size / (1024 * 1024)).toFixed(1)} MB</span>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-700 text-red-900 text-sm font-bold">
              {error}
            </div>
          )}

          <button
            onClick={startAnalysis}
            disabled={extracting}
            className="w-full btn-verify h-11 text-sm flex items-center justify-center gap-2"
          >
            {extracting ? (
              <>
                <div className="inline-block ai-detection-spinner mr-2 w-4 h-4 border-2" style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: 'white' }} />
                Extracting Frames...
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
                  Drop your video file here
                </p>
                <p className="text-xs text-foreground/50 mt-1">
                  or click to browse • MP4, WebM, MOV, AVI, MKV • Max 100MB
                </p>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center gap-1 text-[11px] text-foreground/60 font-bold">
                  <Film className="h-3 w-3" /> Video Files
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
