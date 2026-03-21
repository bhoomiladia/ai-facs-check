'use client'

import { useState } from 'react'
import { VerifiedClaim } from '@/types'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface HighlightedTextProps {
  text: string
  verifiedClaims: VerifiedClaim[]
  onClaimClick?: (claim: VerifiedClaim) => void
}

export function HighlightedText({ text, verifiedClaims, onClaimClick }: HighlightedTextProps) {
  const [hoveredClaim, setHoveredClaim] = useState<string | null>(null)

  const createHighlightedSegments = () => {
    const segments: Array<{
      text: string
      claim?: VerifiedClaim
      isHighlighted: boolean
    }> = []

    let currentIndex = 0
    const sortedClaims = [...verifiedClaims].sort((a, b) => {
      const aStart = a.claim.start_pos ?? text.indexOf(a.claim.text)
      const bStart = b.claim.start_pos ?? text.indexOf(b.claim.text)
      return aStart - bStart
    })

    for (const verifiedClaim of sortedClaims) {
      const claimText = verifiedClaim.claim.text
      const startPos = verifiedClaim.claim.start_pos ?? text.indexOf(claimText, currentIndex)
      const endPos = verifiedClaim.claim.end_pos ?? (startPos + claimText.length)

      if (startPos >= currentIndex && startPos !== -1) {
        if (startPos > currentIndex) {
          segments.push({ text: text.slice(currentIndex, startPos), isHighlighted: false })
        }
        segments.push({ text: text.slice(startPos, endPos), claim: verifiedClaim, isHighlighted: true })
        currentIndex = endPos
      }
    }

    if (currentIndex < text.length) {
      segments.push({ text: text.slice(currentIndex), isHighlighted: false })
    }

    return segments
  }

  const getHighlightClass = (status: string) => {
    switch (status) {
      case 'True': return 'claim-highlight claim-true'
      case 'False': return 'claim-highlight claim-false'
      case 'Partially True': return 'claim-highlight claim-partial'
      default: return 'claim-highlight'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'True': return <CheckCircle className="h-3 w-3 text-green-400" />
      case 'False': return <XCircle className="h-3 w-3 text-red-400" />
      case 'Partially True': return <AlertTriangle className="h-3 w-3 text-yellow-400" />
      default: return null
    }
  }

  const segments = createHighlightedSegments()

  return (
    <div className="prose prose-invert max-w-none">
      <div className="text-slate-300 leading-relaxed text-sm">
        {segments.map((segment, index) => (
          <span key={index}>
            {segment.isHighlighted && segment.claim ? (
              <span className="relative inline">
                <span
                  className={getHighlightClass(segment.claim.status)}
                  onClick={() => onClaimClick?.(segment.claim!)}
                  onMouseEnter={() => setHoveredClaim(segment.claim!.claim.id)}
                  onMouseLeave={() => setHoveredClaim(null)}
                >
                  {segment.text}
                </span>
                {/* Tooltip */}
                {hoveredClaim === segment.claim.claim.id && (
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 whitespace-nowrap text-xs flex items-center gap-1.5 pointer-events-none animate-fade-in-up">
                    {getStatusIcon(segment.claim.status)}
                    <span className="text-white font-medium">{segment.claim.status}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{Math.round(segment.claim.confidence * 100)}%</span>
                  </span>
                )}
              </span>
            ) : (
              segment.text
            )}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 bg-green-500 rounded" />
          <span>True</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 bg-red-500 rounded" />
          <span>False</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 bg-yellow-500 rounded" />
          <span>Partial</span>
        </div>
        <span className="text-slate-600">• Hover for details</span>
      </div>
    </div>
  )
}