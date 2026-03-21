'use client'

import { VerifiedClaim } from '@/types'

interface HighlightedTextProps {
  text: string
  verifiedClaims: VerifiedClaim[]
  onClaimClick?: (claim: VerifiedClaim) => void
}

export function HighlightedText({ text, verifiedClaims, onClaimClick }: HighlightedTextProps) {
  // Create segments with highlighting
  const createHighlightedSegments = () => {
    const segments: Array<{
      text: string
      claim?: VerifiedClaim
      isHighlighted: boolean
    }> = []

    let currentIndex = 0
    const sortedClaims = [...verifiedClaims].sort((a, b) => {
      const aStart = a.claim.start_pos || text.indexOf(a.claim.text)
      const bStart = b.claim.start_pos || text.indexOf(b.claim.text)
      return aStart - bStart
    })

    for (const verifiedClaim of sortedClaims) {
      const claimText = verifiedClaim.claim.text
      const startPos = verifiedClaim.claim.start_pos ?? text.indexOf(claimText, currentIndex)
      const endPos = verifiedClaim.claim.end_pos ?? (startPos + claimText.length)

      if (startPos >= currentIndex && startPos !== -1) {
        // Add non-highlighted text before the claim
        if (startPos > currentIndex) {
          segments.push({
            text: text.slice(currentIndex, startPos),
            isHighlighted: false
          })
        }

        // Add highlighted claim
        segments.push({
          text: text.slice(startPos, endPos),
          claim: verifiedClaim,
          isHighlighted: true
        })

        currentIndex = endPos
      }
    }

    // Add remaining text
    if (currentIndex < text.length) {
      segments.push({
        text: text.slice(currentIndex),
        isHighlighted: false
      })
    }

    return segments
  }

  const getHighlightClass = (status: string) => {
    switch (status) {
      case 'True':
        return 'bg-green-500/20 border-l-4 border-green-500 hover:bg-green-500/30 cursor-pointer px-1 py-0.5 rounded-r transition-all duration-200'
      case 'False':
        return 'bg-red-500/20 border-l-4 border-red-500 hover:bg-red-500/30 cursor-pointer px-1 py-0.5 rounded-r transition-all duration-200'
      case 'Partially True':
        return 'bg-yellow-500/20 border-l-4 border-yellow-500 hover:bg-yellow-500/30 cursor-pointer px-1 py-0.5 rounded-r transition-all duration-200'
      default:
        return 'bg-gray-500/20 border-l-4 border-gray-500 hover:bg-gray-500/30 cursor-pointer px-1 py-0.5 rounded-r transition-all duration-200'
    }
  }

  const segments = createHighlightedSegments()

  return (
    <div className="prose prose-invert max-w-none">
      <div className="text-slate-300 leading-relaxed">
        {segments.map((segment, index) => (
          <span key={index}>
            {segment.isHighlighted && segment.claim ? (
              <span
                className={getHighlightClass(segment.claim.status)}
                onClick={() => onClaimClick?.(segment.claim!)}
                title={`${segment.claim.status} (${Math.round(segment.claim.confidence * 100)}% confidence)`}
              >
                {segment.text}
              </span>
            ) : (
              segment.text
            )}
          </span>
        ))}
      </div>
      
      {/* Legend */}
      <div className="mt-6 p-4 bg-slate-800 rounded-lg">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Color Legend</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500/20 border-l-4 border-green-500 rounded-r"></div>
            <span className="text-slate-400">True</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500/20 border-l-4 border-red-500 rounded-r"></div>
            <span className="text-slate-400">False</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500/20 border-l-4 border-yellow-500 rounded-r"></div>
            <span className="text-slate-400">Partially True</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Click on highlighted text to view detailed verification results
        </p>
      </div>
    </div>
  )
}