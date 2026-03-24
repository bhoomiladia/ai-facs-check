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
      case 'True': return <CheckCircle className="h-3 w-3 text-emerald-800" />
      case 'False': return <XCircle className="h-3 w-3 text-red-800" />
      case 'Partially True': return <AlertTriangle className="h-3 w-3 text-amber-800" />
      default: return null
    }
  }

  const segments = createHighlightedSegments()

  return (
    <div className="max-w-none">
      <div className="text-foreground/80 leading-relaxed text-sm">
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
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-foreground text-background border-2 border-foreground shadow-xl z-50 whitespace-nowrap text-xs flex items-center gap-1.5 pointer-events-none">
                    {getStatusIcon(segment.claim.status)}
                    <span className="font-bold">{segment.claim.status}</span>
                    <span className="text-background/50">•</span>
                    <span className="text-background/80">{Math.round(segment.claim.confidence * 100)}%</span>
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
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-foreground/60 font-bold uppercase">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-1 bg-emerald-700" />
          <span>True</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-1 bg-red-700" />
          <span>False</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-1 bg-amber-600" />
          <span>Partial</span>
        </div>
        <span className="text-foreground/40">• Hover for details</span>
      </div>
    </div>
  )
}