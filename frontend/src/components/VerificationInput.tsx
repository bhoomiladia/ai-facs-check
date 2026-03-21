'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Link, Zap, Shield, Image, Sparkles } from 'lucide-react'

interface VerificationInputProps {
  onStartVerification: (text: string, url?: string, imageUrl?: string) => void
}

const exampleClaims = [
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
  const [placeholderIdx, setPlaceholderIdx] = useState(0)

  // Cycle placeholder examples
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % exampleClaims.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = () => {
    if (activeTab === 'text' && text.trim()) {
      onStartVerification(text.trim())
    } else if (activeTab === 'url' && url.trim()) {
      onStartVerification('', url.trim())
    } else if (activeTab === 'image' && imageUrl.trim()) {
      onStartVerification('', undefined, imageUrl.trim())
    }
  }

  const fillExample = () => {
    setText(exampleClaims[placeholderIdx])
    setActiveTab('text')
  }

  const isValid = (activeTab === 'text' && text.trim()) ||
                  (activeTab === 'url' && url.trim()) ||
                  (activeTab === 'image' && imageUrl.trim())

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4 pt-4">
        <h2 className="text-4xl font-bold gradient-text">
          Verify Any Claim
        </h2>
        <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
          Paste text, a URL, or an image — our AI extracts claims and cross-references them against trusted sources in seconds.
        </p>
      </div>

      {/* Input Card */}
      <Card className="bg-slate-900/60 border-slate-700/50 glow-blue">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-base">
            <Zap className="h-4 w-4 text-yellow-400" />
            Input Source
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800/80 mb-4">
              <TabsTrigger value="text" className="flex items-center gap-2 text-xs">
                <FileText className="h-3.5 w-3.5" />
                Text
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2 text-xs">
                <Link className="h-3.5 w-3.5" />
                URL
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-2 text-xs">
                <Image className="h-3.5 w-3.5" />
                Image
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-3">
              <div className="space-y-2">
                <Textarea
                  id="text-input"
                  placeholder={`Try: "${exampleClaims[placeholderIdx]}"`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[160px] bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-600 resize-none focus:border-blue-500/50 focus:ring-blue-500/20"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-600">
                    {text.length} characters
                  </p>
                  <button onClick={fillExample} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    <Sparkles className="h-3 w-3" />
                    Try an example
                  </button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="url-input" className="text-slate-400 text-sm">
                  Article or webpage URL
                </Label>
                <Input
                  id="url-input"
                  type="url"
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500/50"
                />
              </div>
            </TabsContent>

            <TabsContent value="image" className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="image-input" className="text-slate-400 text-sm">
                  Image URL to analyze
                </Label>
                <Input
                  id="image-input"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500/50"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-5 flex justify-center">
            <Button
              onClick={handleSubmit}
              disabled={!isValid}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-10 py-3 text-base font-semibold rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-40 disabled:shadow-none transition-all"
            >
              <Shield className="h-5 w-5 mr-2" />
              Verify Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { icon: FileText, color: 'text-green-400', bg: 'bg-green-500/10', title: 'Smart Extraction', desc: 'AI identifies atomic, verifiable claims from any content' },
          { icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10', title: 'Multi-Source Search', desc: 'Cross-references claims against news, academic, and web sources' },
          { icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', title: 'Confidence Scoring', desc: 'Each claim gets a score with transparent reasoning' },
        ].map((f) => (
          <Card key={f.title} className="bg-slate-900/40 border-slate-800/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`p-1.5 rounded-lg ${f.bg}`}>
                  <f.icon className={`h-4 w-4 ${f.color}`} />
                </div>
                <h3 className="font-medium text-white text-sm">{f.title}</h3>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}