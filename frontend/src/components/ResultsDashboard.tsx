'use client'

import { useState } from 'react'
import { VerificationResult, VerifiedClaim } from '@/types'
import { exportVerificationAsPDF } from '@/lib/export-pdf'
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
  BarChart3,
  HelpCircle,
  GitBranch,
  Timer,
  Download
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
    if (total_claims === 0) return { label: 'No Claims', color: 'text-foreground/60', bg: 'bg-muted', border: 'border-foreground/30', icon: AlertTriangle }
    const trueRatio = (true_claims + partially_true_claims * 0.5) / total_claims
    if (trueRatio >= 0.7) return { label: 'Mostly True', color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-800', icon: CheckCircle }
    if (trueRatio <= 0.3) return { label: 'Mostly False', color: 'text-red-800', bg: 'bg-red-50', border: 'border-red-800', icon: XCircle }
    return { label: 'Mixed Results', color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-800', icon: AlertTriangle }
  }

  const verdict = getOverallVerdict()
  const VerdictIcon = verdict.icon
  const accuracyPct = Math.round(result.overall_accuracy * 100)

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'True': return { icon: CheckCircle, color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-800', barColor: 'bg-emerald-700' }
      case 'False': return { icon: XCircle, color: 'text-red-800', bg: 'bg-red-50', border: 'border-red-800', barColor: 'bg-red-700' }
      case 'Partially True': return { icon: AlertTriangle, color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-800', barColor: 'bg-amber-600' }
      case 'Outdated': return { icon: Timer, color: 'text-orange-800', bg: 'bg-orange-50', border: 'border-orange-800', barColor: 'bg-orange-600' }
      case 'Disputed': return { icon: GitBranch, color: 'text-purple-800', bg: 'bg-purple-50', border: 'border-purple-800', barColor: 'bg-purple-600' }
      case 'Insufficient Context': return { icon: HelpCircle, color: 'text-foreground/60', bg: 'bg-muted', border: 'border-foreground/30', barColor: 'bg-foreground/40' }
      default: return { icon: AlertTriangle, color: 'text-foreground/60', bg: 'bg-muted', border: 'border-foreground/30', barColor: 'bg-foreground/40' }
    }
  }

  const truncateImageDesc = (desc: string) => {
    if (desc.length <= 200) return desc
    return desc.slice(0, 200) + '...'
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-slide-up">
      {/* ─── Verdict Banner ─── */}
      <div className={`relative overflow-hidden border-2 ${verdict.border} ${verdict.bg} p-5 panel`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-5">
            {/* Gauge */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="8" />
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
                <span className={`text-lg font-black ${verdict.color}`}>{accuracyPct}%</span>
              </div>
            </div>
            <div>
              <div className={`flex items-center gap-2 mb-1`}>
                <VerdictIcon className={`h-5 w-5 ${verdict.color}`} />
                <h2 className={`text-2xl font-black uppercase ${verdict.color}`}>{verdict.label}</h2>
              </div>
              <p className="text-foreground/60 text-sm italic">
                {result.metadata.total_claims} claims analyzed • {result.processing_time.toFixed(1)}s
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => exportVerificationAsPDF(result)}
              variant="outline"
              className="border-foreground text-foreground hover:bg-foreground hover:text-background rounded-none font-bold uppercase text-xs"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={onStartNew} variant="outline" className="border-foreground text-foreground hover:bg-foreground hover:text-background rounded-none font-bold uppercase text-xs">
              <RotateCcw className="h-4 w-4 mr-2" />
              New Check
            </Button>
          </div>
        </div>

        {/* Mini stats row */}
        <div className="flex gap-6 mt-5 pt-4 border-t-2 border-foreground/20">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-800" />
            <span className="text-sm text-foreground/80"><span className="font-bold text-foreground">{result.metadata.true_claims}</span> True</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-800" />
            <span className="text-sm text-foreground/80"><span className="font-bold text-foreground">{result.metadata.false_claims}</span> False</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-800" />
            <span className="text-sm text-foreground/80"><span className="font-bold text-foreground">{result.metadata.partially_true_claims}</span> Partial</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Clock className="h-4 w-4 text-foreground/50" />
            <span className="text-xs text-foreground/50 font-bold">{result.metadata.sources_consulted?.length || 0} sources consulted</span>
          </div>
        </div>
      </div>

      {/* ─── Image Analysis (if present) ─── */}
      {result.metadata.image_analysis && (
        <Card className="border-2 border-foreground bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-foreground text-base font-black uppercase">
              <Image className="h-4 w-4 text-foreground" />
              Image Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {showFullImageDesc
                ? result.metadata.image_analysis.description
                : truncateImageDesc(result.metadata.image_analysis.description)
              }
            </p>
            {result.metadata.image_analysis.description.length > 200 && (
              <button
                onClick={() => setShowFullImageDesc(!showFullImageDesc)}
                className="mt-2 text-xs text-primary hover:underline flex items-center gap-1 font-bold"
              >
                {showFullImageDesc ? <><ChevronUp className="h-3 w-3" /> Show Less</> : <><ChevronDown className="h-3 w-3" /> Show More</>}
              </button>
            )}
            {result.metadata.image_analysis.objects && result.metadata.image_analysis.objects.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {result.metadata.image_analysis.objects.map((obj, i) => (
                  <Badge key={i} variant="secondary" className="bg-muted text-foreground/80 border border-foreground text-xs rounded-none">
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
        <h3 className="text-xl font-black text-foreground flex items-center gap-2 uppercase border-b-2 border-foreground pb-2">
          <Shield className="h-5 w-5 text-foreground" />
          Verified Claims
        </h3>

        {result.verified_claims.map((vc) => {
          const config = getStatusConfig(vc.status)
          const StatusIcon = config.icon
          const isExpanded = expandedClaim === vc.claim.id

          return (
            <div
              key={vc.claim.id}
              className={`border-2 ${config.border} ${config.bg} transition-all duration-200`}
            >
              {/* Claim Header — always visible */}
              <button
                onClick={() => setExpandedClaim(isExpanded ? null : vc.claim.id)}
                className="w-full text-left p-4 flex items-start gap-3"
              >
                <StatusIcon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm leading-relaxed font-medium">{vc.claim.text}</p>
                  {/* Confidence bar */}
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="secondary" className={`${config.bg} ${config.color} border ${config.border} text-xs rounded-none font-bold`}>
                      {vc.status}
                    </Badge>
                    <div className="flex-1 max-w-[120px]">
                      <div className="conf-bar">
                        <div className={`conf-bar-fill ${config.barColor}`} style={{ width: `${Math.round(vc.confidence * 100)}%` }} />
                      </div>
                    </div>
                    <span className={`text-xs font-bold ${config.color}`}>
                      {Math.round(vc.confidence * 100)}%
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 mt-1">
                  {isExpanded
                    ? <ChevronUp className="h-4 w-4 text-foreground/50" />
                    : <ChevronDown className="h-4 w-4 text-foreground/50" />
                  }
                </div>
              </button>

              {/* Expanded Details */}
              <div className={`expand-collapse ${isExpanded ? 'open' : ''}`}>
                <div>
                  <div className="px-4 pb-4 pt-0 border-t-2 border-foreground/10 space-y-4">
                    {/* Reasoning */}
                    <div className="mt-3">
                      <h4 className="text-xs font-black text-foreground/60 uppercase tracking-wide mb-1.5">Analysis</h4>
                      <p className="text-sm text-foreground/80 leading-relaxed">{vc.reasoning}</p>
                    </div>

                    {/* Correct Answer */}
                    {vc.correct_answer && (
                      <div className="mt-3 p-3 bg-emerald-50 border-2 border-emerald-800">
                        <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wide mb-1">Correct Answer</h4>
                        <p className="text-sm text-emerald-900 leading-relaxed">{vc.correct_answer}</p>
                      </div>
                    )}

                    {/* Temporal Note */}
                    {vc.temporal_note && (
                      <div className="mt-3 p-3 bg-orange-50 border-2 border-orange-800">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Timer className="h-3 w-3 text-orange-800" />
                          <h4 className="text-xs font-black text-orange-800 uppercase tracking-wide">Temporal Context</h4>
                        </div>
                        <p className="text-sm text-orange-900 leading-relaxed">{vc.temporal_note}</p>
                      </div>
                    )}

                    {/* Conflicting Sources */}
                    {vc.conflicting_sources && vc.conflicting_sources.length > 0 && (
                      <div className="mt-3 p-3 bg-purple-50 border-2 border-purple-800">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <GitBranch className="h-3 w-3 text-purple-800" />
                          <h4 className="text-xs font-black text-purple-800 uppercase tracking-wide">Conflicting Sources</h4>
                        </div>
                        <ul className="space-y-1">
                          {vc.conflicting_sources.map((cs, i) => (
                            <li key={i} className="text-sm text-purple-900 leading-relaxed flex items-start gap-2">
                              <span className="text-purple-600 mt-1">•</span>
                              {cs}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Evidence Sources - max 3 */}
                    {vc.evidence.length > 0 && (
                      <div>
                        <h4 className="text-xs font-black text-foreground/60 uppercase tracking-wide mb-2">Sources ({Math.min(vc.evidence.length, 3)})</h4>
                        <div className="space-y-2">
                          {vc.evidence.slice(0, 3).map((ev, i) => (
                            <div key={i} className="flex items-center gap-3 p-2.5 bg-muted border border-foreground/20">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-foreground font-medium truncate">{ev.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant="secondary" className="bg-background text-foreground/70 border border-foreground/30 text-[10px] rounded-none">
                                    {ev.source}
                                  </Badge>
                                  {ev.publishedDate && (
                                    <span className="text-[10px] text-foreground/50">{ev.publishedDate}</span>
                                  )}
                                </div>
                              </div>
                              <a
                                href={ev.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 p-1.5 hover:bg-muted text-primary hover:underline transition-colors"
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
        <Card className="border-2 border-foreground bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-foreground text-base font-black uppercase">
              <FileText className="h-4 w-4 text-foreground/60" />
              Original Text
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap">
              {result.original_text}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}