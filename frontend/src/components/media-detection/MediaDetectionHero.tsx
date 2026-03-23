'use client'

import { Scan, AudioWaveform, Fingerprint, FileSearch, Sparkles, Zap, Activity } from 'lucide-react'

const features = [
  {
    icon: <Scan className="h-5 w-5" />,
    title: 'Image Forensics',
    desc: 'Pixel-level analysis detecting GAN artifacts, inconsistent noise patterns, and manipulation traces',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    stat: 'Pixel-level',
  },
  {
    icon: <AudioWaveform className="h-5 w-5" />,
    title: 'Audio Analysis',
    desc: 'Spectral analysis to detect voice cloning, splicing artifacts, and synthetic speech patterns',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    stat: 'Spectral',
  },
  {
    icon: <Fingerprint className="h-5 w-5" />,
    title: 'Deepfake Detection',
    desc: 'Advanced neural network fingerprint detection for identifying AI-generated or manipulated content',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    stat: 'Neural',
  },
  {
    icon: <FileSearch className="h-5 w-5" />,
    title: 'Metadata Analysis',
    desc: 'Deep EXIF and container metadata inspection to identify inconsistencies and synthetic origins',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    stat: 'EXIF+',
  },
  {
    icon: <Activity className="h-5 w-5" />,
    title: 'Temporal Analysis',
    desc: 'Frame-by-frame consistency checks detecting temporal artifacts and unnatural motion patterns',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    stat: 'Temporal',
  },
]

export function MediaDetectionHero() {
  return (
    <div className="relative mb-8 animate-slide-up">
      {/* DNA stripe background */}
      <div className="absolute inset-0 dna-stripe rounded-2xl opacity-50" />

      <div className="relative text-center mb-8 pt-2">
        <div className="inline-flex items-center gap-2 text-[11px] text-indigo-400 font-mono bg-indigo-500/10 px-3 py-1.5 rounded-full mb-4 tracking-wider uppercase">
          <Sparkles className="h-3 w-3" />
          AI Media Forensics Engine
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
          Detect AI-Generated{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Media
          </span>
        </h1>
        <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Upload images or audio files to detect deepfakes, AI-generated content,
          and synthetic manipulations using multi-layered forensic analysis.
        </p>
      </div>

      {/* Feature cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 stagger">
        {features.map((f) => (
          <div key={f.title} className="panel-accent p-4 hover-lift cursor-default group">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${f.bgColor} ${f.color} transition-transform group-hover:scale-110`}>
                {f.icon}
              </div>
              <span className="text-[10px] text-slate-500 font-mono bg-slate-800/50 px-2 py-0.5 rounded">
                {f.stat}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">{f.title}</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Performance badges */}
      <div className="flex items-center justify-center gap-4 mt-5 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
          <Zap className="h-3 w-3 text-amber-400" /> 5-stage pipeline
        </span>
        <span className="text-slate-700">•</span>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
          <Scan className="h-3 w-3 text-indigo-400" /> GAN fingerprinting
        </span>
        <span className="text-slate-700">•</span>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
          <Fingerprint className="h-3 w-3 text-pink-400" /> Model attribution
        </span>
      </div>
    </div>
  )
}
