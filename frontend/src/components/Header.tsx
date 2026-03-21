import { Shield } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/10">
            <Shield className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">
              FactCheck AI
            </h1>
            <p className="text-slate-500 text-xs tracking-wide">
              AI-Powered Claim Verification
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}