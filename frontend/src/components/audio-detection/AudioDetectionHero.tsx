'use client'

import { AudioWaveform, Mic, Fingerprint, Activity, Headphones, Waves, Zap } from 'lucide-react'

const features = [
  {
    icon: <Mic className="h-5 w-5" />,
    title: 'Neural TTS Detection',
    desc: 'Identifies text-to-speech artifacts from WaveNet, Tacotron, VITS, XTTS, and other neural TTS systems',
    stat: 'Neural',
  },
  {
    icon: <AudioWaveform className="h-5 w-5" />,
    title: 'Prosody & Rhythm',
    desc: 'Evaluates speech rhythm, pauses, breathing patterns, and natural disfluencies missing in AI voices',
    stat: 'Cadence',
  },
  {
    icon: <Activity className="h-5 w-5" />,
    title: 'Spectral Analysis',
    desc: 'Examines frequency distribution, formant patterns, and vocoder processing signatures',
    stat: 'Spectral',
  },
  {
    icon: <Fingerprint className="h-5 w-5" />,
    title: 'Voice Cloning',
    desc: 'Detects voice cloning signatures including consistent timbre without natural micro-variations',
    stat: 'Identity',
  },
  {
    icon: <Headphones className="h-5 w-5" />,
    title: 'Environment Check',
    desc: 'Evaluates background noise authenticity, room acoustics, spatial cues, and ambient consistency',
    stat: 'Ambient',
  },
  {
    icon: <Waves className="h-5 w-5" />,
    title: 'Encoding Analysis',
    desc: 'Examines audio codec artifacts, bitrate patterns, and compression signatures specific to AI audio',
    stat: 'Codec',
  },
]

export function AudioDetectionHero() {
  return (
    <div className="relative mb-8 animate-slide-up">
      <div className="relative text-center mb-8 pt-2">
        <div className="inline-flex items-center gap-2 text-[11px] text-foreground font-bold bg-muted border border-foreground px-3 py-1.5 tracking-widest uppercase mb-4">
          <AudioWaveform className="h-3 w-3" />
          AI Audio Forensics Engine
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-3 uppercase">
          Detect AI-Generated Audio
        </h1>
        <p className="text-sm md:text-base text-foreground/60 max-w-2xl mx-auto leading-relaxed italic">
          Upload audio files to detect AI-generated speech, voice clones, deepfake audio,
          and synthetic manipulations using multi-stage forensic analysis across 6 dimensions.
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
          <Mic className="h-3 w-3 text-foreground" /> Whisper transcription
        </span>
        <span>•</span>
        <span className="inline-flex items-center gap-1.5 text-[11px]">
          <Fingerprint className="h-3 w-3 text-foreground" /> Model attribution
        </span>
      </div>
    </div>
  )
}
