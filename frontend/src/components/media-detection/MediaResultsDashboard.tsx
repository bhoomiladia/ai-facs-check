'use client'

import {
  RotateCcw, AlertTriangle, ShieldAlert, ShieldCheck,
  ShieldQuestion, Shield
} from 'lucide-react'
import type { MediaAnalysisResult, Verdict } from '@/types/media-detection'

interface MediaResultsDashboardProps {
  result: MediaAnalysisResult
  onStartNew: () => void
}

const VERDICT_CONFIG: Record<Verdict, { label: string; color: string; bg: string; ringColor: string; icon: React.ReactNode }> = {
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

export function MediaResultsDashboard({ result, onStartNew }: MediaResultsDashboardProps) {
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
    <div className="max-w-5xl mx-auto animate-slide-up space-y-5 shake-container">
      {/* Top: Verdict + Gauge */}
      <div className="panel p-6 relative overflow-hidden">
        {/* Rubber Stamp Slam Animation */}
        <div
          className={`absolute pointer-events-none z-0 flex items-center justify-center -right-4 top-4 ${verdict.color} stamp-slam-animation`}
          style={{ mixBlendMode: 'multiply' }}
        >
          <div className="border-8 border-current p-3 text-6xl md:text-8xl font-black uppercase tracking-widest whitespace-nowrap opacity-60" style={{ fontFamily: 'var(--font-playfair-display), serif' }}>
            {getStampText()}
          </div>
        </div>
        <div className="grid md:grid-cols-[280px_1fr] gap-6 items-center relative z-10">
          {/* Gauge */}
          <div className="flex flex-col items-center">
            <div className="relative w-44 h-44">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke="rgba(0,0,0,0.08)"
                  strokeWidth="6"
                />
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke={verdict.ringColor}
                  strokeWidth="6"
                  className="gauge-label-ring"
                  strokeDashoffset={gaugeOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-foreground">{result.overallScore}%</span>
                <span className="text-[11px] text-foreground/50 mt-0.5 font-bold uppercase">AI Detection Score</span>
              </div>
            </div>
            <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 border-2 text-xs font-black uppercase ${verdict.color} ${verdict.bg}`} style={{ borderColor: verdict.ringColor }}>
              {verdict.icon}
              {verdict.label}
            </div>
          </div>

          {/* Right side info */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-foreground uppercase">Detection Analysis Complete</h2>
              <p className="text-sm text-foreground/60 mt-1 mb-4 italic">
                Our forensic pipeline evaluated this {result.mediaType} to determine if it is AI-generated or synthetically manipulated.
              </p>
              
              {result.imageDescription && (
                <div className="panel-accent p-4 border-2 border-foreground/30 mt-4">
                  <h3 className="text-sm font-black text-foreground uppercase mb-2">Image Description</h3>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    {result.imageDescription}
                  </p>
                </div>
              )}

              {result.analysisSummary && (
                <div className="panel-accent p-4 border-2 border-foreground/30 mt-4">
                  <h3 className="text-sm font-black text-foreground uppercase mb-2">Analysis Reasoning</h3>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    {result.analysisSummary}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={onStartNew}
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-bold uppercase"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Analyze Another
            </button>
          </div>
        </div>
      </div>

      {/* Timestamp + restart */}
      <div className="flex items-center justify-between text-xs text-foreground/50 pb-4 font-bold border-t-2 border-foreground pt-4">
        <span>Analyzed at {new Date(result.analyzedAt).toLocaleString()}</span>
        <button
          onClick={onStartNew}
          className="btn-verify px-4 py-2 text-xs flex items-center gap-1.5"
        >
          <RotateCcw className="h-3 w-3" />
          Analyze Another
        </button>
      </div>
    </div>
  )
}
