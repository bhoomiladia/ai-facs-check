import { Shield } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b border-indigo-500/10 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-white tracking-tight">FactCheck AI</span>
        </div>
        <span className="text-[11px] text-slate-600 tracking-wider uppercase hidden sm:block">
          Claim Verification Engine
        </span>
      </div>
    </header>
  )
}