'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Link, Zap, Shield } from 'lucide-react'

interface VerificationInputProps {
  onStartVerification: (text: string, url?: string) => void
}

export function VerificationInput({ onStartVerification }: VerificationInputProps) {
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [activeTab, setActiveTab] = useState('text')

  const handleSubmit = () => {
    if (activeTab === 'text' && text.trim()) {
      onStartVerification(text.trim())
    } else if (activeTab === 'url' && url.trim()) {
      onStartVerification('', url.trim())
    }
  }

  const isValid = (activeTab === 'text' && text.trim()) || (activeTab === 'url' && url.trim())

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-white">
          Verify Claims with AI
        </h2>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Extract verifiable claims from any text or URL and get real-time fact-checking 
          powered by advanced AI and web search.
        </p>
      </div>

      {/* Input Card */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Zap className="h-5 w-5 text-yellow-400" />
            Input Source
          </CardTitle>
          <CardDescription>
            Choose your input method and provide the content to verify
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Text Input
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                URL Input
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="text" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text-input" className="text-slate-300">
                  Enter text to verify
                </Label>
                <Textarea
                  id="text-input"
                  placeholder="Paste any text containing claims you want to verify. For example: 'The Earth is flat and vaccines cause autism. Climate change is a hoax created by scientists.'"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[200px] bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 resize-none"
                />
                <p className="text-sm text-slate-500">
                  {text.length} characters • AI will extract verifiable claims automatically
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url-input" className="text-slate-300">
                  Enter URL to analyze
                </Label>
                <Input
                  id="url-input"
                  type="url"
                  placeholder="https://example.com/article-to-verify"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                />
                <p className="text-sm text-slate-500">
                  Content will be extracted from the URL and analyzed for claims
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-center">
            <Button
              onClick={handleSubmit}
              disabled={!isValid}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold"
            >
              <Zap className="h-5 w-5 mr-2" />
              Start Verification
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <FileText className="h-5 w-5 text-green-400" />
              </div>
              <h3 className="font-semibold text-white">Smart Extraction</h3>
            </div>
            <p className="text-slate-400 text-sm">
              AI automatically identifies and extracts verifiable claims from any text
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Zap className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white">Real-time Search</h3>
            </div>
            <p className="text-slate-400 text-sm">
              Lightning-fast web search to gather evidence from authoritative sources
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Shield className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white">Confidence Scoring</h3>
            </div>
            <p className="text-slate-400 text-sm">
              Each claim gets a confidence score and detailed reasoning for transparency
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}