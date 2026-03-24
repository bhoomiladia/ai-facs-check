'use client'

import {
  RotateCcw, AlertTriangle, ShieldAlert, ShieldCheck,
  ShieldQuestion, Shield, AudioWaveform, FileText, CheckCircle2, MessageSquareQuote
} from 'lucide-react'
import type { AudioAnalysisResult, AudioVerdict } from '@/types/audio-detection'

interface AudioResultsDashboardProps {
  result: AudioAnalysisResult
  onStartNew: () => void
}

const VERDICT_CONFIG: Record<AudioVerdict, { label: string; color: string; bg: string; ringColor: string; icon: React.ReactNode }> = {
  ai_generated: {
    label: 'AI Generated',
    color: 'text-red-800',
    bg: 'bg-red-50',
    ringColor: '#991b1b',
    icon: <ShieldAlert className="h-5 w-5" />,
  },
  likely_ai: {
    label: 'Likely AI',
    color: 'text-orange-800',
    bg: 'bg-orange-50',
    ringColor: '#9a3412',
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  inconclusive: {
    label: 'Inconclusive',
    color: 'text-amber-800',
    bg: 'bg-amber-50',
    ringColor: '#92400e',
    icon: <ShieldQuestion className="h-5 w-5" />,
  },
  likely_authentic: {
    label: 'Likely Authentic',
    color: 'text-emerald-800',
    bg: 'bg-emerald-50',
    ringColor: '#065f46',
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  authentic: {
    label: 'Authentic',
    color: 'text-green-800',
    bg: 'bg-green-50',
    ringColor: '#166534',
    icon: <Shield className="h-5 w-5" />,
  },
}

export function AudioResultsDashboard({ result, onStartNew }: AudioResultsDashboardProps) {
  const verdict = VERDICT_CONFIG[result.verdict]
  const gaugeOffset = 283 - (283 * result.overallScore) / 100

  const getStampText = () => {
    if (result.verdict === 'ai_generated') return 'SYNTHETIC'
    if (result.verdict === 'likely_ai') return 'SUSPECT'
    if (result.verdict === 'authentic') return 'AUTHENTIC'
    if (result.verdict === 'likely_authentic') return 'VERIFIED'
    return 'REVIEWED'
  }

  return (
    <div className="max-w-5xl mx-auto animate-slide-up space-y-6 pb-12 shake-container">
      {/* Top: Verdict + Gauge */}
      <div className="panel p-8 relative overflow-hidden">
        {/* Rubber Stamp */}
        <div
          className={`absolute pointer-events-none z-0 flex items-center justify-center -right-6 top-6 ${verdict.color} stamp-slam-animation`}
          style={{ mixBlendMode: 'multiply' }}
        >
          <div className="border-[12px] border-current p-5 text-6xl md:text-9xl font-black uppercase tracking-tighter whitespace-nowrap opacity-20 rotate-[-15deg]" style={{ fontFamily: 'Georgia, serif' }}>
            {getStampText()}
          </div>
        </div>

        <div className="grid md:grid-cols-[300px_1fr] gap-8 items-center relative z-10">
          {/* Gauge */}
          <div className="flex flex-col items-center">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke="rgba(0,0,0,0.06)"
                  strokeWidth="8"
                />
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke={verdict.ringColor}
                  strokeWidth="8"
                  style={{
                    strokeDasharray: '283',
                    strokeDashoffset: gaugeOffset,
                    transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-foreground tracking-tighter">{result.overallScore}%</span>
                <span className="text-[10px] text-foreground/60 mt-1 font-black uppercase tracking-widest text-center px-4 leading-tight">
                  AI Synthesis Probability
                </span>
              </div>
            </div>
            <div className={`mt-5 inline-flex items-center gap-2 px-4 py-2 border-2 text-sm font-black uppercase tracking-widest ${verdict.color} ${verdict.bg}`} style={{ borderColor: verdict.ringColor }}>
              {verdict.icon}
              {verdict.label}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AudioWaveform className="h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-widest bg-muted border border-foreground px-2 py-0.5">Audio Forensics Result</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-foreground uppercase tracking-tight leading-none mb-4">
                Voice Synthesis Detection Report
              </h2>
              <p className="text-base text-foreground/80 leading-relaxed font-serif italic mb-6">
                Forensic pipeline analyzed audio stream for AI voice synthesis signatures,
                prosody anomalies, spectral artifacts, and voice cloning indicators.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="panel-accent p-4">
                  <h3 className="text-xs font-black text-foreground uppercase mb-2 border-b border-foreground/20 pb-1">Audio Assessment</h3>
                  <p className="text-sm text-foreground/70 leading-relaxed italic">
                    {result.audioDescription || "Audio content analysis completed."}
                  </p>
                </div>
                <div className="panel-accent p-4">
                  <h3 className="text-xs font-black text-foreground uppercase mb-2 border-b border-foreground/20 pb-1">Analyst Summary</h3>
                  <p className="text-sm text-foreground/80 leading-relaxed font-bold">
                    {result.analysisSummary || "The forensic scores indicate this content is likely authentic audio."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transcription Panel */}
      {result.transcription && (
        <div className="panel p-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquareQuote className="h-4 w-4" />
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Whisper Transcription</h3>
          </div>
          <div className="panel-accent p-4 max-h-48 overflow-y-auto">
            <p className="text-sm text-foreground/80 leading-relaxed font-serif italic">
              &ldquo;{result.transcription}&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* Dimension Scores Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {result.detectionScores.map((score) => (
          <div key={score.id} className="panel p-5 bg-card/50">
            <div className="flex items-center justify-between mb-3 border-b border-foreground/10 pb-2">
              <span className="text-xs font-black uppercase tracking-wider">{score.label}</span>
              <span className="text-sm font-black">{score.score}%</span>
            </div>
            <div className="h-1.5 bg-muted border border-foreground/20 mb-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  score.score > 70 ? 'bg-red-700' : score.score > 40 ? 'bg-orange-600' : 'bg-emerald-700'
                }`}
                style={{ width: `${score.score}%` }}
              />
            </div>
            <p className="text-xs text-foreground/60 leading-relaxed">{score.description}</p>
          </div>
        ))}
      </div>

      {/* Findings Table */}
      <div className="panel overflow-hidden">
        <div className="bg-foreground text-background px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <h3 className="text-sm font-black uppercase tracking-widest">Forensic Findings Log</h3>
          </div>
          <span className="text-[10px] font-bold uppercase opacity-80">{result.findings.length} Anomalies Logged</span>
        </div>
        <div className="divide-y-2 divide-foreground/10">
          {result.findings.map((finding) => (
            <div key={finding.id} className="p-4 px-6 hover:bg-muted/30 transition-colors group">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-tight group-hover:underline">{finding.title}</span>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 border border-foreground/20 bg-muted">{finding.category}</span>
                  </div>
                  <p className="text-xs text-foreground/70 leading-relaxed font-serif">{finding.description}</p>
                </div>
                <div className={`text-[10px] font-black uppercase px-2 py-1 border-2 flex-shrink-0 mt-1 ${
                  finding.severity === 'critical' ? 'bg-red-100 text-red-800 border-red-800' :
                  finding.severity === 'warning' ? 'bg-orange-100 text-orange-800 border-orange-800' :
                  'bg-background text-foreground/60 border-foreground/20'
                }`}>
                  {finding.severity}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model Attribution & Pipeline */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="panel-accent p-4 flex-1 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RotateCcw className="h-5 w-5 opacity-40" />
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase text-foreground/40">Model Attribution</p>
              <p className="text-sm font-bold uppercase">{result.modelAttribution || "Unknown / Not Determined"}</p>
            </div>
          </div>
          {result.modelAttribution && (
            <div className="bg-foreground text-background text-[10px] font-black uppercase px-2 py-1">Identified</div>
          )}
        </div>
        <div className="panel-accent p-4 flex-1 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 opacity-40" />
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase text-foreground/40">Analysis Pipeline</p>
              <p className="text-sm font-bold uppercase">WHISPER-V3 + LLAMA-3.3-70B</p>
            </div>
          </div>
          <div className="bg-foreground text-background text-[10px] font-black uppercase px-2 py-1">Verified</div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-foreground/50 pb-8 font-bold border-t-2 border-foreground pt-4 mb-10">
        <span>Report Generated: {new Date(result.analyzedAt).toLocaleString().toUpperCase()}</span>
        <button
          onClick={onStartNew}
          className="btn-verify px-6 py-2.5 text-xs flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          START NEW ANALYSIS
        </button>
      </div>
    </div>
  )
}
