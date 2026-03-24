import type { Metadata } from 'next'
import { Playfair_Display } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'The Daily Verifier | Fact & Claim Check',
  description: 'AI-powered truth analysis and fact-checking from reputable sources',
}

import { Masthead } from '@/components/Masthead'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={playfair.className}>
        <div className="min-h-screen bg-background pt-4 pb-12">
          <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
            <Masthead />
          </div>
          {children}
        </div>
      </body>
    </html>
  )
}