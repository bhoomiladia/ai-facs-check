'use client'

import { Scan, AudioWaveform, Fingerprint, FileSearch, Sparkles, Zap, Activity } from 'lucide-react'

const features = [
  {
    icon: <Scan className="h-5 w-5" />,
    title: 'Image Forensics',
    desc: 'Pixel-level analysis detecting GAN artifacts, inconsistent noise patterns, and manipulation traces',
    stat: 'Pixel-level',
  },
  {
    icon: <AudioWaveform className="h-5 w-5" />,
    title: 'Audio Analysis',
    desc: 'Spectral analysis to detect voice cloning, splicing artifacts, and synthetic speech patterns',
    stat: 'Spectral',
  },
  {
    icon: <Fingerprint className="h-5 w-5" />,
    title: 'Deepfake Detection',
    desc: 'Advanced neural network fingerprint detection for identifying AI-generated or manipulated content',
    stat: 'Neural',
  },
  {
    icon: <FileSearch className="h-5 w-5" />,
    title: 'Metadata Analysis',
    desc: 'Deep EXIF and container metadata inspection to identify inconsistencies and synthetic origins',
    stat: 'EXIF+',
  },
  {
    icon: <Activity className="h-5 w-5" />,
    title: 'Temporal Analysis',
    desc: 'Frame-by-frame consistency checks detecting temporal artifacts and unnatural motion patterns',
    stat: 'Temporal',
  },
]

export function MediaDetectionHero() {
  return (
    <div className="relative mb-8 animate-slide-up">
      <div className="relative text-center mb-8 pt-2">
        <div className="inline-flex items-center gap-2 text-[11px] text-foreground font-bold bg-muted border border-foreground px-3 py-1.5 tracking-widest uppercase mb-4">
          <Sparkles className="h-3 w-3" />
          AI Media Forensics Engine
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-3 uppercase">
          Detect AI-Generated Media
        </h1>
        <p className="text-sm md:text-base text-foreground/60 max-w-2xl mx-auto leading-relaxed italic">
          Upload images or audio files to detect deepfakes, AI-generated content,
          and synthetic manipulations using multi-layered forensic analysis.
        </p>
      </div>

      {/* Feature cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 stagger">
        {features.map((f) => (
          <div key={f.title} className="panel p-4 hover-lift cursor-default group">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 border border-foreground bg-muted text-foreground transition-transform group-hover:scale-110">
                {f.icon}
              </div>
              <span className="text-[10px] text-foreground font-bold bg-muted border border-foreground px-2 py-0.5 uppercase">
                {f.stat}
              </span>
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1 uppercase">{f.title}</h3>
            <p className="text-[11px] text-foreground/60 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Performance badges */}
      <div className="flex items-center justify-center gap-4 mt-5 flex-wrap text-foreground/60 font-bold uppercase">
        <span className="inline-flex items-center gap-1.5 text-[11px]">
          <Zap className="h-3 w-3 text-foreground" /> 5-stage pipeline
        </span>
        <span>•</span>
        <span className="inline-flex items-center gap-1.5 text-[11px]">
          <Scan className="h-3 w-3 text-foreground" /> GAN fingerprinting
        </span>
        <span>•</span>
        <span className="inline-flex items-center gap-1.5 text-[11px]">
          <Fingerprint className="h-3 w-3 text-foreground" /> Model attribution
        </span>
      </div>
    </div>
  )
}
