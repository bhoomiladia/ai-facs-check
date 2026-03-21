'use client'

import { useState } from 'react'
import { VerificationResult, VerifiedClaim } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Image,
  FileText,
  Shield,
  Clock,
  BarChart3
} from 'lucide-react'

interface ResultsDashboardProps {
  result: VerificationResult
  onStartNew: () => void
}

export function ResultsDashboard({ result, onStartNew }: ResultsDashboardProps) {
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null)
  const [showFullImageDesc, setShowFullImageDesc] = useState(false)

  const getOverallVerdict = () => {
    const { true_claims, false_claims, partially_true_claims, total_claims } = result.metadata
    if (total_claims === 0) return { label: 'No Claims', color: 'text-slate-400', bg: 'from-slate-500/20 to-slate-600/20', border: 'border-slate-500/30', icon: AlertTriangle }
    const trueRatio = (true_claims + partially_true_claims * 0.5) / total_claims
    if (trueRatio >= 0.7) return { label: 'Mostly True', color: 'text-green-400', bg: 'from-green-500/10 to-emerald-500/10', border: 'border-green-500/20', icon: CheckCircle }
    if (trueRatio <= 0.3) return { label: 'Mostly False', color: 'text-red-400', bg: 'from-red-500/10 to-rose-500/10', border: 'border-red-500/20', icon: XCircle }
    return { label: 'Mixed Results', color: 'text-yellow-400', bg: 'from-yellow-500/10 to-amber-500/10', border: 'border-yellow-500/20', icon: AlertTriangle }
  }

  const verdict = getOverallVerdict()
  const VerdictIcon = verdict.icon
  const accuracyPct = Math.round(result.overall_accuracy * 100)

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'True': return { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', barColor: 'bg-green-500' }
      case 'False': return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', barColor: 'bg-red-500' }
      case 'Partially True': return { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', barColor: 'bg-yellow-500' }
      default: return { icon: AlertTriangle, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', barColor: 'bg-slate-500' }
    }
  }

  const truncateImageDesc = (desc: string) => {
    if (desc.length <= 200) return desc
    return desc.slice(0, 200) + '...'
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-slide-up">
      {/* ─── Verdict Banner ─── */}
      <div className={`relative overflow-hidden rounded-xl border ${verdict.border} ${verdict.bg} p-5 panel`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            {/* Gauge */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="45" fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className={`gauge-ring ${verdict.color}`}
                  style={{ '--gauge-value': accuracyPct } as React.CSSProperties}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-bold ${verdict.color}`}>{accuracyPct}%</span>
              </div>
            </div>
            <div>
              <div className={`flex items-center gap-2 mb-1`}>
                <VerdictIcon className={`h-5 w-5 ${verdict.color}`} />
                <h2 className={`text-2xl font-bold ${verdict.color}`}>{verdict.label}</h2>
              </div>
              <p className="text-slate-400 text-sm">
                {result.metadata.total_claims} claims analyzed • {result.processing_time.toFixed(1)}s
              </p>
            </div>
          </div>
          <Button onClick={onStartNew} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white">
            <RotateCcw className="h-4 w-4 mr-2" />
            New Check
          </Button>
        </div>

        {/* Mini stats row */}
        <div className="flex gap-6 mt-5 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-sm text-slate-300"><span className="font-semibold text-white">{result.metadata.true_claims}</span> True</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-400" />
            <span className="text-sm text-slate-300"><span className="font-semibold text-white">{result.metadata.false_claims}</span> False</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-slate-300"><span className="font-semibold text-white">{result.metadata.partially_true_claims}</span> Partial</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Clock className="h-4 w-4 text-slate-500" />
            <span className="text-xs text-slate-500">{result.metadata.sources_consulted?.length || 0} sources consulted</span>
          </div>
        </div>
      </div>

      {/* ─── Image Analysis (if present) ─── */}
      {result.metadata.image_analysis && (
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-white text-base">
              <Image className="h-4 w-4 text-purple-400" />
              Image Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-300 leading-relaxed">
              {showFullImageDesc
                ? result.metadata.image_analysis.description
                : truncateImageDesc(result.metadata.image_analysis.description)
              }
            </p>
            {result.metadata.image_analysis.description.length > 200 && (
              <button
                onClick={() => setShowFullImageDesc(!showFullImageDesc)}
                className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                {showFullImageDesc ? <><ChevronUp className="h-3 w-3" /> Show Less</> : <><ChevronDown className="h-3 w-3" /> Show More</>}
              </button>
            )}
            {result.metadata.image_analysis.objects && result.metadata.image_analysis.objects.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {result.metadata.image_analysis.objects.map((obj, i) => (
                  <Badge key={i} variant="secondary" className="bg-slate-800 text-slate-400 border-slate-700 text-xs">
                    {obj}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Claims List ─── */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-400" />
          Verified Claims
        </h3>

        {result.verified_claims.map((vc) => {
          const config = getStatusConfig(vc.status)
          const StatusIcon = config.icon
          const isExpanded = expandedClaim === vc.claim.id

          return (
            <div
              key={vc.claim.id}
              className={`rounded-xl border ${config.border} ${config.bg} transition-all duration-200 hover:border-opacity-50`}
            >
              {/* Claim Header — always visible */}
              <button
                onClick={() => setExpandedClaim(isExpanded ? null : vc.claim.id)}
                className="w-full text-left p-4 flex items-start gap-3"
              >
                <StatusIcon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm leading-relaxed">{vc.claim.text}</p>
                  {/* Confidence bar */}
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="secondary" className={`${config.bg} ${config.color} border ${config.border} text-xs`}>
                      {vc.status}
                    </Badge>
                    <div className="flex-1 max-w-[120px]">
                      <div className="confidence-bar">
                        <div className={`confidence-bar-fill ${config.barColor}`} style={{ width: `${Math.round(vc.confidence * 100)}%` }} />
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${config.color}`}>
                      {Math.round(vc.confidence * 100)}%
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 mt-1">
                  {isExpanded
                    ? <ChevronUp className="h-4 w-4 text-slate-500" />
                    : <ChevronDown className="h-4 w-4 text-slate-500" />
                  }
                </div>
              </button>

              {/* Expanded Details */}
              <div className={`expand-collapse ${isExpanded ? 'open' : ''}`}>
                <div>
                  <div className="px-4 pb-4 pt-0 border-t border-white/5 space-y-4">
                    {/* Reasoning */}
                    <div className="mt-3">
                      <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Analysis</h4>
                      <p className="text-sm text-slate-300 leading-relaxed">{vc.reasoning}</p>
                    </div>

                    {/* Evidence Sources - max 3 */}
                    {vc.evidence.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Sources ({Math.min(vc.evidence.length, 3)})</h4>
                        <div className="space-y-2">
                          {vc.evidence.slice(0, 3).map((ev, i) => (
                            <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-800/50 rounded-lg">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{ev.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant="secondary" className="bg-slate-700/50 text-slate-400 border-0 text-[10px]">
                                    {ev.source}
                                  </Badge>
                                  {ev.publishedDate && (
                                    <span className="text-[10px] text-slate-600">{ev.publishedDate}</span>
                                  )}
                                </div>
                              </div>
                              <a
                                href={ev.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 p-1.5 rounded-md hover:bg-slate-700/50 text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ─── Original Text ─── */}
      {result.original_text &&
        result.original_text !== 'Image analysis request' &&
        result.original_text.length < 2000 &&
        !result.original_text.includes('window.') &&
        !result.original_text.includes('function ') &&
        !result.original_text.includes('<script') && (
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-white text-base">
              <FileText className="h-4 w-4 text-slate-400" />
              Original Text
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
              {result.original_text}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}