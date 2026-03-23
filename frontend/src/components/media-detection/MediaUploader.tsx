'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, Link2, Image, Music, X, Sparkles } from 'lucide-react'
import type { MediaFile } from '@/types/media-detection'

interface MediaUploaderProps {
  onMediaSelected: (media: MediaFile) => void
}


export function MediaUploader({ onMediaSelected }: MediaUploaderProps) {
  const [dragOver, setDragOver] = useState(false)
  const [mode, setMode] = useState<'upload' | 'url'>('upload')
  const [urlInput, setUrlInput] = useState('')
  const [preview, setPreview] = useState<MediaFile | null>(null)
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
    const isImage = file.type.startsWith('image/')
    const isAudio = file.type.startsWith('audio/')
    if (!isImage && !isAudio) return

    const media: MediaFile = {
      name: file.name,
      type: isImage ? 'image' : 'audio',
      url: URL.createObjectURL(file),
      size: file.size,
      mimeType: file.type,
    }
    setPreview(media)
  }

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return
    const isAudio = /\.(mp3|wav|ogg|flac)(\?.*)?$/i.test(urlInput)
    const media: MediaFile = {
      name: urlInput.split('/').pop() || 'media',
      type: isAudio ? 'audio' : 'image',
      url: urlInput.trim(),
      mimeType: isAudio ? 'audio/mpeg' : 'image/jpeg',
    }
    setPreview(media)
  }

  const clearPreview = () => {
    setPreview(null)
    setUrlInput('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const startAnalysis = () => {
    if (preview) onMediaSelected(preview)
  }

  return (
    <div className="max-w-3xl mx-auto animate-slide-up">
      {/* If preview is set, show preview + analyse button */}
      {preview ? (
        <div className="panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Media Preview</h3>
            <button onClick={clearPreview} className="text-slate-500 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="media-preview-overlay bg-slate-900/60 flex items-center justify-center p-4 min-h-[200px]">
            {preview.type === 'image' ? (
              <img
                src={preview.url}
                alt={preview.name}
                className="max-h-[280px] rounded-lg object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <Music className="h-12 w-12" />
                <span className="text-sm">{preview.name}</span>
                <audio controls src={preview.url} className="w-full max-w-md" />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{preview.name}</span>
            {preview.size && (
              <span>{(preview.size / 1024).toFixed(1)} KB</span>
            )}
          </div>
          <button
            onClick={startAnalysis}
            className="w-full btn-verify h-11 text-sm flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Analyze for AI Generation
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mode tabs */}
          <div className="flex items-center gap-2 justify-center">
            <button
              onClick={() => setMode('upload')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                mode === 'upload'
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Upload className="h-3.5 w-3.5 inline mr-1.5" />
              Upload File
            </button>
            <button
              onClick={() => setMode('url')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                mode === 'url'
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Link2 className="h-3.5 w-3.5 inline mr-1.5" />
              Paste URL
            </button>
          </div>

          {mode === 'upload' ? (
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
                accept="image/*,audio/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/10">
                  <Upload className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm text-white font-medium">
                    Drop your media file here
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    or click to browse • Images (JPG, PNG, WebP) & Audio (MP3, WAV, OGG)
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                    <Image className="h-3 w-3" /> Images
                  </span>
                  <span className="text-slate-800">|</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                    <Music className="h-3 w-3" /> Audio
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="panel p-5 space-y-3">
              <label className="text-xs text-slate-500">Media URL (image or audio)</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 bg-slate-900/60 border border-slate-700/40 text-white text-sm placeholder:text-slate-600 rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500/40 transition-colors"
                />
                <button
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim()}
                  className="btn-verify px-5 py-2.5 text-sm"
                >
                  Load
                </button>
              </div>
            </div>
          )}


        </div>
      )}
    </div>
  )
}
