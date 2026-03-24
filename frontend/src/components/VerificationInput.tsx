'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Link, Image, Search, Cpu, ShieldCheck, ArrowRight, Mic, MicOff } from 'lucide-react'

interface VerificationInputProps {
  onStartVerification: (text: string, url?: string, imageUrl?: string) => void
}

const textExamples = [
  "The Great Wall of China is visible from space with the naked eye.",
  "Humans only use 10% of their brains.",
  "Lightning never strikes the same place twice.",
  "Goldfish have a 3-second memory.",
  "The Eiffel Tower can be 15 cm taller during the summer due to thermal expansion.",
]

const urlExamples = [
  { label: "Link 1", url: "https://www.aljazeera.com/news/liveblog/2026/3/24/iran-war-live-tehran-says-trumps-claims-of-peace-talks-fake" },
  { label: "Link 2", url: "https://www.thehindu.com/news/international/iran-israel-us-war-west-asia-conflict-hezbollah-oil-supply-march-22-2026/article70771375.ece" },
  { label: "Link 3", url: "https://indianexpress.com/article/cities/delhi/delhi-budget-2026-27-live-updates-assembly-bomb-threat-10597884/" },
  { label: "Link 4", url: "https://www.bbc.com/news/world-middle-east-68630569" },
  { label: "Link 5", url: "https://www.snopes.com/fact-check/man-sues-wife-ugly-children/" },
  { label: "Link 6", url: "https://timesofindia.indiatimes.com/business/international-business/pakistan-china-sri-lanka-see-fuel-prices-rise-as-hormuz-choke-fuels-oil-crisis-how-countries-are-feeling-the-impact/articleshow/129767474.cms" },
]

const imageExamples = [
  { label: "AI Landscape", url: "https://cdn.pixabay.com/photo/2024/07/27/10/55/ai-generated-8925260_1280.jpg" },
]

export function VerificationInput({ onStartVerification }: VerificationInputProps) {
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [activeTab, setActiveTab] = useState('text')
  const [exIdx, setExIdx] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const committedTextRef = useRef('')

  useEffect(() => {
    const t = setInterval(() => setExIdx(i => (i + 1) % textExamples.length), 4000)
    return () => clearInterval(t)
  }, [])

  // Cleanup speech recognition + silence timer on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
        recognitionRef.current = null
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
    }
  }, [])

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    silenceTimerRef.current = setTimeout(() => {
      // 5 seconds of silence → auto-stop
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }, 5000)
  }, [])

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please try Chrome or Edge.')
      return
    }

    // Save current text as the committed baseline
    committedTextRef.current = text

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      let interim = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interim += transcript
        }
      }

      // Commit final results to the text
      if (finalTranscript) {
        const trimmed = finalTranscript.trim()
        committedTextRef.current = committedTextRef.current
          ? committedTextRef.current + ' ' + trimmed
          : trimmed
        setText(committedTextRef.current)
        setInterimTranscript('')
      }

      // Show interim (in-progress) words
      if (interim) {
        setInterimTranscript(interim)
      }

      // Reset the 5s silence timer on any speech activity
      resetSilenceTimer()
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      setInterimTranscript('')
      recognitionRef.current = null
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    }

    recognition.onend = () => {
      // Commit any remaining interim text
      setInterimTranscript('')
      setIsListening(false)
      recognitionRef.current = null
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
    setActiveTab('text')
    resetSilenceTimer()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, resetSilenceTimer])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    setInterimTranscript('')
    setIsListening(false)
  }, [])

  const toggleVoiceInput = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  const handleSubmit = () => {
    if (activeTab === 'text' && text.trim()) onStartVerification(text.trim())
    else if (activeTab === 'url' && url.trim()) onStartVerification('', url.trim())
    else if (activeTab === 'image' && imageUrl.trim()) onStartVerification('', undefined, imageUrl.trim())
  }

  const isValid = (activeTab === 'text' && text.trim()) ||
    (activeTab === 'url' && url.trim()) ||
    (activeTab === 'image' && imageUrl.trim())

  return (
    <div className="max-w-4xl mx-auto animate-slide-up">
      {/* Compact two-column top */}
      <div className="grid md:grid-cols-[1fr_340px] gap-6 mb-4">
        {/* Left: Title + Input */}
        <div className="space-y-3">
          <div>
            <h2 className="text-3xl font-black text-foreground tracking-tight uppercase border-b-2 border-foreground pb-2">Verify Any Claim</h2>
            <p className="text-sm text-foreground/60 mt-2 italic">Paste text, a URL, or an image link to start analysis</p>
          </div>

          <div className="panel p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted border border-foreground mb-3 h-9 rounded-none">
                <TabsTrigger value="text" className="flex items-center gap-1.5 text-xs h-7 rounded-none font-bold uppercase data-[state=active]:bg-foreground data-[state=active]:text-background">
                  <FileText className="h-3 w-3" /> Text
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-1.5 text-xs h-7 rounded-none font-bold uppercase data-[state=active]:bg-foreground data-[state=active]:text-background">
                  <Link className="h-3 w-3" /> URL
                </TabsTrigger>
                <TabsTrigger value="image" className="flex items-center gap-1.5 text-xs h-7 rounded-none font-bold uppercase data-[state=active]:bg-foreground data-[state=active]:text-background">
                  <Image className="h-3 w-3" /> Image
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="mt-0">
                <div className="relative">
                  <Textarea
                    id="text-input"
                    placeholder={isListening ? 'Listening... speak now' : `e.g. "${textExamples[exIdx]}"`}
                    value={isListening && interimTranscript
                      ? (text ? text + ' ' + interimTranscript : interimTranscript)
                      : text}
                    onChange={(e) => {
                      if (!isListening) setText(e.target.value)
                    }}
                    readOnly={isListening}
                    className={`min-h-[120px] bg-background border-foreground text-foreground text-sm placeholder:text-foreground/40 resize-none rounded-none pr-12 ${
                      isListening ? 'border-red-500 border-2' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                    className={`absolute top-2 right-2 p-2 rounded-none border transition-all duration-200 ${
                      isListening
                        ? 'bg-red-500 border-red-500 text-white animate-pulse hover:bg-red-600'
                        : 'bg-muted border-foreground/30 text-foreground/60 hover:bg-foreground hover:text-background'
                    }`}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                </div>
                {isListening && (
                  <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-1.5 animate-pulse">
                    ● Recording — stops after 5s silence · click mic to stop
                  </p>
                )}
                <div className="mt-3">
                  <span className="text-[10px] text-foreground/50 font-bold uppercase tracking-widest block mb-2">Try an example:</span>
                  <div className="flex flex-wrap gap-2">
                    {textExamples.slice(0, 3).map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => { setText(ex); setActiveTab('text') }}
                        className="text-[10px] bg-muted hover:bg-foreground hover:text-background border border-foreground/20 px-2 py-1 transition-colors font-medium"
                      >
                        {ex.slice(0, 30)}...
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="url" className="mt-0 space-y-2">
                <div className="min-h-[148px] flex flex-col pt-1 space-y-3">
                  <Label htmlFor="url-input" className="text-foreground/60 text-xs font-bold uppercase">Article or webpage URL</Label>
                  <Input
                    id="url-input"
                    type="url"
                    placeholder="https://example.com/article"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && isValid) handleSubmit() }}
                    className="bg-background border-foreground text-foreground text-sm placeholder:text-foreground/40 rounded-none"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {urlExamples.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => { setUrl(ex.url); setActiveTab('url') }}
                        className="text-[10px] text-primary hover:underline font-bold"
                      >
                        ⚡ {ex.label}
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="image" className="mt-0 space-y-2">
                <div className="min-h-[148px] flex flex-col pt-1 space-y-3">
                  <Label htmlFor="image-input" className="text-foreground/60 text-xs font-bold uppercase">Image URL to analyze</Label>
                  <Input
                    id="image-input"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && isValid) handleSubmit() }}
                    className="bg-background border-foreground text-foreground text-sm placeholder:text-foreground/40 rounded-none"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {imageExamples.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => { setImageUrl(ex.url); setActiveTab('image') }}
                        className="text-[10px] text-primary hover:underline font-bold"
                      >
                        ⚡ {ex.label}
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Button
              onClick={handleSubmit}
              disabled={!isValid}
              className="w-full mt-3 btn-verify h-10 text-sm"
            >
              Verify Now
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>

        {/* Right: Feature cards */}
        <div className="space-y-3 stagger max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <FeatureCard
            icon={<Search className="h-4 w-4 text-foreground" />}
            title="Multi-Source Search"
            desc="Queries 4+ search engines, news APIs, and fact-check databases simultaneously"
            stat="4+ sources"
          />
          <FeatureCard
            icon={<Search className="h-4 w-4 text-foreground" />}
            title="Neural Deep Research"
            desc="Cross-references scientific journals, historical archives, and academic papers via Exa"
            stat="Deep Scan"
          />
          <FeatureCard
            icon={<Cpu className="h-4 w-4 text-foreground" />}
            title="AI Claim Analysis"
            desc="Hardened verification with anti-hallucination, semantics, and adversarial defense"
            stat="7 checks"
          />
          <FeatureCard
            icon={<ShieldCheck className="h-4 w-4 text-foreground" />}
            title="Confidence Scoring"
            desc="Calibrated confidence with source hierarchy, cross-contamination prevention"
            stat="0-100%"
          />
          <FeatureCard
            icon={<FileText className="h-4 w-4 text-foreground" />}
            title="Forensic Linguistic Scan"
            desc="Analyzes perplexity and burstiness to detect LLM-generated text"
            stat="AI Model"
          />
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, desc, stat }: {
  icon: React.ReactNode
  title: string
  desc: string
  stat: string
}) {
  return (
    <div className="panel-accent p-3.5 hover-lift cursor-default">
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-bold text-foreground uppercase">{title}</span>
        </div>
        <span className="text-[10px] text-foreground font-mono bg-muted border border-foreground px-2 py-0.5 font-bold">{stat}</span>
      </div>
      <p className="text-xs text-foreground/70 leading-relaxed">{desc}</p>
    </div>
  )
}