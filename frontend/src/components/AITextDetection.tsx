'use client'

import { useState } from 'react'
import { AITextDetectionResult } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Fingerprint,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

interface AITextDetectionProps {
  result: AITextDetectionResult
}

export function AITextDetection({ result }: AITextDetectionProps) {
  const [showSignals, setShowSignals] = useState(false)
  const [showSentences, setShowSentences] = useState(false)

  const scorePct = Math.round(result.overallScore * 100)

  const getVerdictConfig = () => {
    switch (result.verdict) {
      case 'Human Written':
        return { color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-800', icon: User, label: 'Human Written' }
      case 'Likely Human':
        return { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-700', icon: User, label: 'Likely Human' }
      case 'Mixed/Uncertain':
        return { color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-800', icon: AlertTriangle, label: 'Mixed / Uncertain' }
      case 'Likely AI':
        return { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-700', icon: Bot, label: 'Likely AI' }
      case 'AI Generated':
        return { color: 'text-red-800', bg: 'bg-red-50', border: 'border-red-800', icon: Bot, label: 'AI Generated' }
      default:
        return { color: 'text-foreground/60', bg: 'bg-muted', border: 'border-foreground/30', icon: AlertTriangle, label: 'Unknown' }
    }
  }

  const verdictCfg = getVerdictConfig()
  const VerdictIcon = verdictCfg.icon

  // Heatmap color for sentence scores
  const getSentenceColor = (score: number) => {
    if (score <= 0.3) return 'bg-emerald-100 border-emerald-600'
    if (score <= 0.5) return 'bg-amber-100 border-amber-600'
    if (score <= 0.7) return 'bg-orange-100 border-orange-600'
    return 'bg-red-100 border-red-700'
  }

  const getSentenceLabel = (score: number) => {
    if (score <= 0.3) return 'Human'
    if (score <= 0.5) return 'Neutral'
    if (score <= 0.7) return 'Suspect'
    return 'AI'
  }

  const getStampText = () => {
    if (result.verdict === 'AI Generated') return 'AI DETECTED'
    if (result.verdict === 'Likely AI') return 'SUSPECT'
    if (result.verdict === 'Human Written') return 'HUMAN'
    if (result.verdict === 'Likely Human') return 'AUTHENTIC'
    return 'REVIEWED'
  }

  return (
    <Card className={`border-2 ${verdictCfg.border} ${verdictCfg.bg} overflow-hidden relative shake-container`}>
      {/* Rubber Stamp Slam Animation */}
      <div
        className={`absolute pointer-events-none z-0 flex items-center justify-center -right-4 top-4 ${verdictCfg.color} stamp-slam-animation`}
        style={{ mixBlendMode: 'multiply' }}
      >
        <div className="border-8 border-current p-3 text-6xl md:text-8xl font-black uppercase tracking-widest whitespace-nowrap opacity-60" style={{ fontFamily: 'var(--font-playfair-display), serif' }}>
          {getStampText()}
        </div>
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground text-base font-black uppercase">
          <Fingerprint className="h-4 w-4 text-foreground" />
          AI Authorship Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ─── Main Verdict Row ─── */}
        <div className="flex items-center gap-5 flex-wrap">
          {/* Gauge */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="45" fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className={`gauge-ring ${verdictCfg.color}`}
                style={{ '--gauge-value': scorePct } as React.CSSProperties}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-black ${verdictCfg.color}`}>{scorePct}%</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <VerdictIcon className={`h-5 w-5 ${verdictCfg.color}`} />
              <h3 className={`text-xl font-black uppercase ${verdictCfg.color}`}>{verdictCfg.label}</h3>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed">{result.analysis}</p>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="secondary" className={`${verdictCfg.bg} ${verdictCfg.color} border ${verdictCfg.border} text-xs rounded-none font-bold`}>
                Confidence: {Math.round(result.confidence * 100)}%
              </Badge>
              <span className="text-xs text-foreground/50 font-bold">
                {result.processingTime.toFixed(1)}s analysis
              </span>
            </div>
          </div>
        </div>

        {/* ─── Signal Indicators ─── */}
        {result.signals.length > 0 && (
          <div>
            <button
              onClick={() => setShowSignals(!showSignals)}
              className="w-full flex items-center justify-between py-2 border-t-2 border-foreground/10"
            >
              <span className="text-xs font-black text-foreground/60 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                Detected Signals ({result.signals.length})
              </span>
              {showSignals
                ? <ChevronUp className="h-4 w-4 text-foreground/50" />
                : <ChevronDown className="h-4 w-4 text-foreground/50" />
              }
            </button>

            <div className={`expand-collapse ${showSignals ? 'open' : ''}`}>
              <div className="space-y-2 pt-2">
                {result.signals.map((signal, i) => (
                  <div key={i} className="p-3 bg-background border border-foreground/20">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {signal.direction === 'ai'
                          ? <Bot className="h-3.5 w-3.5 text-red-700" />
                          : <User className="h-3.5 w-3.5 text-emerald-700" />
                        }
                        <span className="text-sm font-bold text-foreground">{signal.name}</span>
                      </div>
                      <Badge variant="secondary" className={`text-[10px] rounded-none font-bold border ${
                        signal.direction === 'ai'
                          ? 'bg-red-50 text-red-800 border-red-800'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-800'
                      }`}>
                        {signal.direction === 'ai' ? '⚑ AI signal' : '✓ Human signal'}
                      </Badge>
                    </div>
                    <p className="text-xs text-foreground/70 mb-2">{signal.description}</p>
                    {/* Strength bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 score-bar">
                        <div
                          className={`score-bar-fill ${signal.direction === 'ai' ? 'ai-signal-fill' : 'human-signal-fill'}`}
                          style={{ width: `${Math.round(signal.strength * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-foreground/60 w-8 text-right">
                        {Math.round(signal.strength * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Sentence-Level Heatmap ─── */}
        {result.sentenceAnalysis.length > 0 && (
          <div>
            <button
              onClick={() => setShowSentences(!showSentences)}
              className="w-full flex items-center justify-between py-2 border-t-2 border-foreground/10"
            >
              <span className="text-xs font-black text-foreground/60 uppercase tracking-wide flex items-center gap-1.5">
                <ArrowRight className="h-3 w-3" />
                Sentence Heatmap ({result.sentenceAnalysis.length} sentences)
              </span>
              {showSentences
                ? <ChevronUp className="h-4 w-4 text-foreground/50" />
                : <ChevronDown className="h-4 w-4 text-foreground/50" />
              }
            </button>

            <div className={`expand-collapse ${showSentences ? 'open' : ''}`}>
              <div className="space-y-1.5 pt-2">
                {/* Legend */}
                <div className="flex items-center gap-3 mb-3 text-[10px] font-bold text-foreground/50">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-100 border border-emerald-600 inline-block" /> Human</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-100 border border-amber-600 inline-block" /> Neutral</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-100 border border-orange-600 inline-block" /> Suspect</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 border border-red-700 inline-block" /> AI</span>
                </div>

                {result.sentenceAnalysis.map((sentence, i) => (
                  <div
                    key={i}
                    className={`p-2.5 border-l-4 ${getSentenceColor(sentence.score)} transition-colors`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-foreground/80 leading-relaxed flex-1">{sentence.text}</p>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] rounded-none font-bold whitespace-nowrap border flex-shrink-0 ${
                          sentence.score <= 0.3 ? 'bg-emerald-50 text-emerald-800 border-emerald-800'
                            : sentence.score <= 0.5 ? 'bg-amber-50 text-amber-800 border-amber-800'
                            : sentence.score <= 0.7 ? 'bg-orange-50 text-orange-800 border-orange-800'
                            : 'bg-red-50 text-red-800 border-red-800'
                        }`}
                      >
                        {getSentenceLabel(sentence.score)} {Math.round(sentence.score * 100)}%
                      </Badge>
                    </div>
                    {sentence.flags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {sentence.flags.map((flag, fi) => (
                          <span key={fi} className="text-[10px] font-bold bg-muted text-foreground/60 border border-foreground/20 px-1.5 py-0.5">
                            {flag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
