'use client'

import { useState } from 'react'
import { VerificationInput } from '@/components/VerificationInput'
import { ProcessingView } from '@/components/ProcessingView'
import { ResultsDashboard } from '@/components/ResultsDashboard'
import { VerificationResult, ProcessingUpdate } from '@/types'

export default function FactCheckPage() {
  const [currentView, setCurrentView] = useState<'input' | 'processing' | 'results'>('input')
  const [processingUpdates, setProcessingUpdates] = useState<ProcessingUpdate[]>([])
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)

  const handleStartVerification = async (text: string, url?: string, imageUrl?: string) => {
    setCurrentView('processing')
    setProcessingUpdates([])

    try {
      setProcessingUpdates([{
        stage: 'Extracting',
        message: 'Starting verification process...',
        progress: 0.1
      }])

      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, url, imageUrl }),
      })

      if (!response.ok) {
        let errorData: any
        try {
          errorData = await response.json()
        } catch {
          throw new Error('Server returned an error. Please try again.')
        }
        throw new Error(errorData.error || 'Failed to verify claims')
      }

      setProcessingUpdates(prev => [...prev, {
        stage: 'Extracting', message: 'Extracting verifiable claims...', progress: 0.3
      }])
      await new Promise(resolve => setTimeout(resolve, 1000))

      setProcessingUpdates(prev => [...prev, {
        stage: 'Searching', message: 'Gathering evidence from primary sources...', progress: 0.6
      }])
      await new Promise(resolve => setTimeout(resolve, 1000))

      setProcessingUpdates(prev => [...prev, {
        stage: 'Verifying', message: 'Analyzing correspondence between claims and evidence...', progress: 0.8
      }])

      const result = await response.json()

      setProcessingUpdates(prev => [...prev, {
        stage: 'Completed',
        message: `Verification complete. Processed ${result.verified_claims.length} claims.`,
        progress: 1.0,
        total_claims: result.verified_claims.length
      }])

      setVerificationResult(result)
      setTimeout(() => setCurrentView('results'), 1000)

    } catch (error) {
      console.error('Verification error:', error)
      setProcessingUpdates(prev => [...prev, {
        stage: 'Completed',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        progress: 1.0
      }])
    }
  }

  const handleBackToInput = () => {
    setCurrentView('input')
    setProcessingUpdates([])
    setVerificationResult(null)
  }

  return (
    <div className="relative z-10">
      <main className="container mx-auto px-4 lg:px-8 max-w-6xl mt-6">
        {currentView === 'input' && (
          <div className="animate-slide-up">
            <VerificationInput onStartVerification={handleStartVerification} />
          </div>
        )}
        {currentView === 'processing' && (
          <div className="animate-pop-in">
            <ProcessingView updates={processingUpdates} onCancel={handleBackToInput} />
          </div>
        )}
        {currentView === 'results' && verificationResult && (
          <div className="animate-slide-up">
            <ResultsDashboard result={verificationResult} onStartNew={() => setCurrentView('input')} />
          </div>
        )}
      </main>
    </div>
  )
}
