'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Scan, Fingerprint, Film } from 'lucide-react'

export function Header() {
  const pathname = usePathname()

  return (
    <header className="border-b-2 border-foreground bg-background sticky top-0 z-50 mb-6">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1">
            <Link
              href="/fact-check"
              className={`nav-link ${pathname === '/fact-check' ? 'active' : ''}`}
            >
              Fact Check
            </Link>
            <Link
              href="/media-detection"
              className={`nav-link flex items-center gap-1.5 ${pathname === '/media-detection' ? 'active' : ''}`}
            >
              <Scan className="h-3 w-3" />
              Media Detection
            </Link>
            <Link
              href="/video-detection"
              className={`nav-link flex items-center gap-1.5 ${pathname === '/video-detection' ? 'active' : ''}`}
            >
              <Film className="h-3 w-3" />
              Video Detection
            </Link>
            <Link
              href="/detect-ai"
              className={`nav-link flex items-center gap-1.5 ${pathname === '/detect-ai' ? 'active' : ''}`}
            >
              <Fingerprint className="h-3 w-3" />
              AI Text Detection
            </Link>
          </div>
        </div>
        <span className="text-[11px] text-foreground/60 tracking-widest uppercase hidden md:block font-bold">
          AI Verification Engine
        </span>
      </div>
    </header>
  )
}