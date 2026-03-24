'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Link, Image, Search, Cpu, ShieldCheck, ArrowRight } from 'lucide-react'

interface VerificationInputProps {
  onStartVerification: (text: string, url?: string, imageUrl?: string) => void
}

const examples = [
  "The Great Wall of China is visible from space with the naked eye.",
  "Humans only use 10% of their brains.",
  "Lightning never strikes the same place twice.",
  "Goldfish have a 3-second memory.",
]

export function VerificationInput({ onStartVerification }: VerificationInputProps) {
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [activeTab, setActiveTab] = useState('text')
  const [exIdx, setExIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setExIdx(i => (i + 1) % examples.length), 4000)
    return () => clearInterval(t)
  }, [])

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
                <Textarea
                  id="text-input"
                  placeholder={`e.g. "${examples[exIdx]}"`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[120px] bg-background border-foreground text-foreground text-sm placeholder:text-foreground/40 resize-none rounded-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-foreground/50 font-bold">{text.length} chars</span>
                  <button
                    onClick={() => { setText(examples[exIdx]); setActiveTab('text') }}
                    className="text-[11px] text-primary hover:underline font-bold"
                  >
                    Use this example
                  </button>
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
        <div className="space-y-3 stagger">
          <FeatureCard
            icon={<Search className="h-4 w-4 text-foreground" />}
            title="Multi-Source Search"
            desc="Queries 4+ search engines, news APIs, and fact-check databases simultaneously"
            stat="4+ sources"
          />
          <FeatureCard
            icon={<Cpu className="h-4 w-4 text-foreground" />}
            title="AI Claim Analysis"
            desc="Hardened verification with anti-hallucination, semantic disambiguation, and adversarial defense"
            stat="7 checks"
          />
          <FeatureCard
            icon={<ShieldCheck className="h-4 w-4 text-foreground" />}
            title="Confidence Scoring"
            desc="Calibrated confidence with source hierarchy, cross-contamination prevention"
            stat="0-100%"
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