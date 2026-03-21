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
  TrendingUp,
  FileText,
  Search
} from 'lucide-react'
import { HighlightedText } from '@/components/HighlightedText'

interface ResultsDashboardProps {
  result: VerificationResult
  onStartNew: () => void
}

export function ResultsDashboard({ result, onStartNew }: ResultsDashboardProps) {
  const [selectedClaim, setSelectedClaim] = useState<VerifiedClaim | null>(null)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'True':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'False':
        return <XCircle className="h-4 w-4 text-red-400" />
      case 'Partially True':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'True':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'False':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'Partially True':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400'
    if (confidence >= 0.6) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Verification Results</h2>
          <p className="text-slate-400 mt-1">
            Analysis completed in {result.processing_time.toFixed(1)}s
          </p>
        </div>
        <Button onClick={onStartNew} className="bg-blue-600 hover:bg-blue-700">
          <RotateCcw className="h-4 w-4 mr-2" />
          New Verification
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {Math.round(result.overall_accuracy * 100)}%
                </div>
                <div className="text-sm text-slate-400">Overall Accuracy</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {result.metadata.true_claims}
                </div>
                <div className="text-sm text-slate-400">True Claims</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-400" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {result.metadata.false_claims}
                </div>
                <div className="text-sm text-slate-400">False Claims</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {result.metadata.partially_true_claims}
                </div>
                <div className="text-sm text-slate-400">Partial Claims</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Original Text with Highlights */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="h-5 w-5" />
                Original Text with Verification Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HighlightedText
                text={result.original_text}
                verifiedClaims={result.verified_claims}
                onClaimClick={setSelectedClaim}
              />
            </CardContent>
          </Card>

          {/* Claims List */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="h-5 w-5" />
                All Verified Claims ({result.verified_claims.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.verified_claims.map((verifiedClaim, index) => (
                <div
                  key={verifiedClaim.claim.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:bg-slate-800/50 ${
                    selectedClaim?.claim.id === verifiedClaim.claim.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 bg-slate-800/30'
                  }`}
                  onClick={() => setSelectedClaim(verifiedClaim)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(verifiedClaim.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStatusColor(verifiedClaim.status)}>
                          {verifiedClaim.status}
                        </Badge>
                        <span className={`text-sm font-medium ${getConfidenceColor(verifiedClaim.confidence)}`}>
                          {Math.round(verifiedClaim.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-white text-sm leading-relaxed mb-2">
                        {verifiedClaim.claim.text}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {verifiedClaim.reasoning}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Claim Details Sidebar */}
        <div className="space-y-4">
          {selectedClaim ? (
            <>
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Claim Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Status</h4>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedClaim.status)}
                      <Badge className={getStatusColor(selectedClaim.status)}>
                        {selectedClaim.status}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Confidence</h4>
                    <div className={`text-lg font-semibold ${getConfidenceColor(selectedClaim.confidence)}`}>
                      {Math.round(selectedClaim.confidence * 100)}%
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Reasoning</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {selectedClaim.reasoning}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Search Queries Used</h4>
                    <div className="space-y-1">
                      {selectedClaim.search_queries.map((query, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <Search className="h-3 w-3 text-slate-500" />
                          <span className="text-slate-400">{query}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Evidence Sources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedClaim.evidence.length > 0 ? (
                    selectedClaim.evidence.map((evidence, index) => (
                      <div key={index} className="p-3 bg-slate-800 rounded-lg">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h5 className="text-sm font-medium text-white line-clamp-2">
                            {evidence.title}
                          </h5>
                          <a
                            href={evidence.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 text-blue-400 hover:text-blue-300"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                        <p className="text-xs text-slate-400 mb-2 line-clamp-3">
                          {evidence.content}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            Query: {evidence.query}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">No evidence sources found</p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-slate-900 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center text-slate-400">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Select a claim to view detailed analysis and evidence sources</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}