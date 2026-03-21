import { Shield, Zap } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-400" />
            <Zap className="h-6 w-6 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Fact Verification System
            </h1>
            <p className="text-slate-400 text-sm">
              AI-powered claim extraction and real-time verification
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}