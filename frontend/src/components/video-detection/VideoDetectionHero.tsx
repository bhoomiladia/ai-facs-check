'use client'

import { Film, Scan, Eye, Activity, Lightbulb, Layers, Zap, Fingerprint } from 'lucide-react'

const features = [
  {
    icon: <Activity className="h-5 w-5" />,
    title: 'Temporal Consistency',
    desc: 'Detects frame-to-frame flickering, unnatural motion, and interpolation artifacts across the timeline',
    stat: 'Frames',
  },
  {
    icon: <Eye className="h-5 w-5" />,
    title: 'Facial & Body',
    desc: 'Identifies deepfake facial warping, lip-sync errors, and unnatural body movements',
    stat: 'Biometric',
  },
  {
    icon: <Fingerprint className="h-5 w-5" />,
    title: 'GAN/Diffusion Print',
    desc: 'Scans for generative model fingerprints — checkerboard artifacts, spectral peaks, and denoising traces',
    stat: 'Neural',
  },
  {
    icon: <Layers className="h-5 w-5" />,
    title: 'Compression Analysis',
    desc: 'Examines codec artifacts, double-encoding signatures, and unusual bitrate patterns',
    stat: 'Codec',
  },
  {
    icon: <Lightbulb className="h-5 w-5" />,
    title: 'Physics & Lighting',
    desc: 'Evaluates physical plausibility of motion, lighting consistency, and impossible reflections',
    stat: 'Physics',
  },
  {
    icon: <Scan className="h-5 w-5" />,
    title: 'Background Stability',
    desc: 'Checks for morphing, warping, or dissolving backgrounds and perspective inconsistencies',
    stat: 'Spatial',
  },
]

export function VideoDetectionHero() {
  return (
    <div className="relative mb-8 animate-slide-up">
      <div className="relative text-center mb-8 pt-2">
        <div className="inline-flex items-center gap-2 text-[11px] text-foreground font-bold bg-muted border border-foreground px-3 py-1.5 tracking-widest uppercase mb-4">
          <Film className="h-3 w-3" />
          AI Video Forensics Engine
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-3 uppercase">
          Detect AI-Generated Video
        </h1>
        <p className="text-sm md:text-base text-foreground/60 max-w-2xl mx-auto leading-relaxed italic">
          Upload video files to detect deepfakes, AI-generated content, and synthetic
          manipulations using multi-frame forensic analysis across 6 dimensions.
        </p>
      </div>

      {/* Feature cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 stagger">
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
          <Zap className="h-3 w-3 text-foreground" /> 6-stage pipeline
        </span>
        <span>•</span>
        <span className="inline-flex items-center gap-1.5 text-[11px]">
          <Film className="h-3 w-3 text-foreground" /> Multi-frame analysis
        </span>
        <span>•</span>
        <span className="inline-flex items-center gap-1.5 text-[11px]">
          <Fingerprint className="h-3 w-3 text-foreground" /> Model attribution
        </span>
      </div>
    </div>
  )
}
