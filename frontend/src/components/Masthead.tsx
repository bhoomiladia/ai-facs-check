'use client'

import React from 'react'

export function Masthead() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="text-center mb-8">
      <div className="double-border-y py-2 mb-4 flex justify-between items-center text-sm font-bold uppercase tracking-widest text-foreground/80">
        <span>Vol. I — No. 1</span>
        <span>{today}</span>
        <span>Price: Free Truth</span>
      </div>
      <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-foreground mb-2" style={{ fontFamily: 'var(--font-playfair-display), serif' }}>
        The Daily Verifier
      </h1>
      <h2 className="text-xl md:text-2xl font-serif italic text-foreground/70 mb-6">
        "Bringing absolute clarity to a world of noise."
      </h2>
      <div className="w-full h-1 bg-foreground mb-1"></div>
      <div className="w-full h-0.5 bg-foreground mb-2"></div>
      
      {/* Masthead Ticker */}
      <div className="w-full border-y border-foreground py-1 mb-8 overflow-hidden bg-foreground/5 flex items-center">
        <span className="text-xs font-bold uppercase tracking-widest shrink-0 pr-4 border-r border-foreground mr-4">Live Fact-Checks</span>
        <div className="flex-1 overflow-hidden relative" style={{ display: 'flex' }}>
          <div className="animate-ticker-scroll inline-flex items-center gap-8 whitespace-nowrap text-xs font-medium font-serif">
            <span><strong className="text-emerald-800">[TRUE]</strong> Senate Passes Infrastructure Bill Unanimously...</span>
            <span><strong className="text-red-800">[DEBUNKED]</strong> AI-Generated Audio of CEO Claiming Bankruptcy Matches Known Synthetic Patterns...</span>
            <span><strong className="text-amber-800">[PARTIAL]</strong> New Electric Vehicle Breaks Nürburgring Record (Time Confirmed, Class Disputed)...</span>
            <span><strong className="text-emerald-800">[TRUE]</strong> Global Temperatures Reach 10-Year High According to WMO Data...</span>
            <span><strong className="text-red-800">[FALSE]</strong> Viral Video Shows Shark Subways in Coastal Flooding (CGI Detection: 99%)...</span>
          </div>
        </div>
      </div>
    </div>
  )
}
