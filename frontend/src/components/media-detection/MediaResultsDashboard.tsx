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
    color: 'text-red-400',
    bg: 'bg-red-500/15',
    ringColor: '#f87171',
    icon: <ShieldAlert className="h-5 w-5" />,
  },
  likely_ai: {
    label: 'Likely AI',
    color: 'text-orange-400',
    bg: 'bg-orange-500/15',
    ringColor: '#fb923c',
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  inconclusive: {
    label: 'Inconclusive',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    ringColor: '#fbbf24',
    icon: <ShieldQuestion className="h-5 w-5" />,
  },
  likely_authentic: {
    label: 'Likely Authentic',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    ringColor: '#34d399',
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  authentic: {
    label: 'Authentic',
    color: 'text-green-400',
    bg: 'bg-green-500/15',
    ringColor: '#4ade80',
    icon: <Shield className="h-5 w-5" />,
  },
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#f87171'
  if (score >= 60) return '#fb923c'
  if (score >= 40) return '#fbbf24'
  if (score >= 20) return '#34d399'
  return '#4ade80'
}

function getScoreGradient(score: number): string {
  if (score >= 80) return 'from-red-500 to-red-400'
  if (score >= 60) return 'from-orange-500 to-orange-400'
  if (score >= 40) return 'from-amber-500 to-amber-400'
  if (score >= 20) return 'from-emerald-500 to-emerald-400'
  return 'from-green-500 to-green-400'
}

export function MediaResultsDashboard({ result, onStartNew }: MediaResultsDashboardProps) {
  const verdict = VERDICT_CONFIG[result.verdict]
  const gaugeOffset = 283 - (283 * result.overallScore) / 100

  return (
    <div className="max-w-5xl mx-auto animate-slide-up space-y-5">
      {/* Top: Verdict + Gauge */}
      <div className="panel p-6">
        <div className="grid md:grid-cols-[280px_1fr] gap-6 items-center">
          {/* Gauge */}
          <div className="flex flex-col items-center">
            <div className="relative w-44 h-44 verdict-ring rounded-full">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke="rgba(255,255,255,0.04)"
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
                <span className="text-3xl font-bold text-white">{result.overallScore}%</span>
                <span className="text-[11px] text-slate-500 mt-0.5">AI Detection Score</span>
              </div>
            </div>
            <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${verdict.color} ${verdict.bg}`}>
              {verdict.icon}
              {verdict.label}
            </div>
          </div>

          {/* Right side info */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white">Detection Analysis Complete</h2>
              <p className="text-sm text-slate-400 mt-1 mb-4">
                Our forensic pipeline evaluated this {result.mediaType} to determine if it is AI-generated or synthetically manipulated.
              </p>
              
              {result.imageDescription && (
                <div className="panel-accent p-4 border border-slate-700/50 rounded-xl mt-4 bg-slate-800/20">
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Image Description</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {result.imageDescription}
                  </p>
                </div>
              )}

              {result.analysisSummary && (
                <div className="panel-accent p-4 border border-slate-700/50 rounded-xl mt-4 bg-slate-800/20">
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Analysis Reasoning</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {result.analysisSummary}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={onStartNew}
              className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Analyze Another
            </button>
          </div>
        </div>
      </div>



      {/* Timestamp + restart */}
      <div className="flex items-center justify-between text-xs text-slate-600 pb-4">
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
