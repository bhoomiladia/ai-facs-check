'use client'

import { useState } from 'react'
import { ProcessingView } from '@/components/ProcessingView'
import { ResultsDashboard } from '@/components/ResultsDashboard'
import { Header } from '@/components/Header'
import { VerificationResult, ProcessingUpdate } from '@/types'

export default function FactCheckPage() {
  const [currentView, setCurrentView] = useState<'input' | 'processing' | 'results'>('input')
  const [processingUpdates, setProcessingUpdates] = useState<ProcessingUpdate[]>([])
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [heroInput, setHeroInput] = useState('')

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
        const errorData = await response.json()
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
      <Header />
      <main className="container mx-auto px-4 lg:px-8 max-w-6xl mt-6">
        {currentView === 'input' && (
          <div className="animate-slide-up max-w-5xl mx-auto">
            <h3 className="text-3xl md:text-5xl font-bold leading-tight mb-4 border-b-2 border-foreground pb-4">
              AI FACT-CHECKING ENGINE
            </h3>
            
            {/* Interactive Editorial Hero */}
            <div className="text-lg leading-relaxed mb-8 mt-8">
              <div className="flex items-start gap-1 p-6 border border-transparent hover:border-foreground/10 transition-colors group relative bg-foreground/[0.02]">
                <button
                  onClick={() => {
                    if (heroInput.trim()) handleStartVerification(heroInput);
                  }}
                  className="text-6xl md:text-8xl font-black leading-none pt-2 pr-3 text-foreground hover:text-primary transition-all cursor-pointer shrink-0"
                  style={{ fontFamily: 'var(--font-playfair-display), serif' }}
                  title="Analyze this text"
                >
                  I
                </button>
                <textarea
                  value={heroInput}
                  onChange={(e) => setHeroInput(e.target.value)}
                  placeholder="nstitute an investigation... Paste a URL, news excerpt, or any claim here to uncover the truth."
                  className="w-full bg-transparent border-0 focus:ring-0 resize-none text-2xl leading-relaxed placeholder:text-foreground/40 typewriter-cursor outline-none -ml-1 mt-4"
                  rows={4}
                />
                <div className="absolute bottom-4 right-6 text-sm font-bold uppercase text-foreground/40 group-hover:text-primary/70 pointer-events-none transition-colors">
                  Click 'I' to Scan
                </div>
              </div>
            </div>
            
            <div className="newspaper-columns mt-6">
              <p>
                The service promises unprecedented transparency. Users simply provide a body of text, a document, or a URL, and the intelligent engine dissects the content. It breaks down complex narratives into individual claims, assigning each a confidence score and a verdict: <span className="font-bold text-emerald-800">True</span>, <span className="font-bold text-red-800">False</span>, or <span className="font-bold text-amber-800">Unverifiable</span> based on the strength of available evidence.
              </p>
              <p className="mt-4 sm:mt-0">
                "We demand the truth," stated the chief architect. "No longer must the public rely on hearsay or hallucinated facts. We provide the tools for rigorous inquiry." The interface, inspired by the classic daily newspapers of the 20th century, brings a sense of gravity and authority to the modern chore of digital fact-checking.
              </p>
            </div>
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
