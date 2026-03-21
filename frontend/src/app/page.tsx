'use client'

import { useState } from 'react'
import { VerificationInput } from '@/components/VerificationInput'
import { ProcessingView } from '@/components/ProcessingView'
import { ResultsDashboard } from '@/components/ResultsDashboard'
import { Header } from '@/components/Header'
import { VerificationResult, ProcessingUpdate } from '@/types'

export default function Home() {
  const [currentView, setCurrentView] = useState<'input' | 'processing' | 'results'>('input')
  const [processingUpdates, setProcessingUpdates] = useState<ProcessingUpdate[]>([])
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)

  const handleStartVerification = async (text: string, url?: string) => {
    setCurrentView('processing')
    setProcessingUpdates([])
    
    try {
      // Add initial processing update
      setProcessingUpdates([{
        stage: 'Extracting',
        message: 'Starting verification process...',
        progress: 0.1
      }])

      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, url }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to verify claims')
      }

      // Simulate progress updates
      setProcessingUpdates(prev => [...prev, {
        stage: 'Extracting',
        message: 'Extracting verifiable claims...',
        progress: 0.3
      }])

      await new Promise(resolve => setTimeout(resolve, 1000))

      setProcessingUpdates(prev => [...prev, {
        stage: 'Searching',
        message: 'Gathering evidence from web sources...',
        progress: 0.6
      }])

      await new Promise(resolve => setTimeout(resolve, 1000))

      setProcessingUpdates(prev => [...prev, {
        stage: 'Verifying',
        message: 'Analyzing claims against evidence...',
        progress: 0.8
      }])

      const result = await response.json()

      setProcessingUpdates(prev => [...prev, {
        stage: 'Completed',
        message: `Verification complete! Processed ${result.verified_claims.length} claims`,
        progress: 1.0,
        total_claims: result.verified_claims.length
      }])

      setVerificationResult(result)
      
      setTimeout(() => {
        setCurrentView('results')
      }, 1000)

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
    <div className="min-h-screen bg-slate-950">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {currentView === 'input' && (
          <VerificationInput onStartVerification={handleStartVerification} />
        )}
        
        {currentView === 'processing' && (
          <ProcessingView 
            updates={processingUpdates}
            onCancel={handleBackToInput}
          />
        )}
        
        {currentView === 'results' && verificationResult && (
          <ResultsDashboard 
            result={verificationResult}
            onStartNew={handleBackToInput}
          />
        )}
      </main>
    </div>
  )
}