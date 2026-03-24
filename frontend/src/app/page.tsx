'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <div className="relative z-10">
      <main className="container mx-auto px-4 lg:px-8 max-w-6xl mt-4">
        <div className="animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Main Article Area */}
            <div className="md:col-span-8">
              <h3 className="text-3xl md:text-5xl font-bold leading-tight mb-4 border-b-2 border-foreground pb-4">
                AI-POWERED FACT CHECKING ENTERS THE MAINSTREAM
              </h3>
              <div className="flex gap-4 mb-6 italic text-foreground/80 font-serif font-medium border-b border-gray-300 pb-4">
                <span>By The Verifier Bureau</span>
                <span>|</span>
                <span>Exclusive Report</span>
              </div>

              <div className="newspaper-columns text-lg leading-relaxed mb-8">
                <p className="drop-cap">
                  In an era overflowing with unverified claims and digital misinformation, the launch of The Daily Verifier marks a significant turning point. This state-of-the-art system leverages advanced artificial intelligence models to systematically analyze text, extract verifiable assertions, and cross-reference them against reputable sources in real-time.
                </p>
                <p className="mt-4">
                  The service promises unprecedented transparency. Users simply provide a body of text, a document, or a URL, and the intelligent engine dissects the content. It breaks down complex narratives into individual claims, assigning each a confidence score and a verdict: <span className="font-bold text-emerald-800">True</span>, <span className="font-bold text-red-800">False</span>, or <span className="font-bold text-amber-800">Unverifiable</span> based on the strength of available evidence.
                </p>
                <p className="mt-4">
                  &quot;We demand the truth,&quot; stated the chief architect. &quot;No longer must the public rely on hearsay or hallucinated facts. We provide the tools for rigorous inquiry.&quot; The interface, inspired by the classic daily newspapers of the 20th century, brings a sense of gravity and authority to the modern chore of digital fact-checking.
                </p>
              </div>

              <div className="panel p-8 text-center bg-gray-100/50 mt-12 mb-8 border-4 border-foreground">
                <h4 className="text-2xl font-black uppercase mb-4 tracking-wider">Begin Your Investigation</h4>
                <p className="italic mb-6 text-foreground/80 text-lg">
                  Submit any claim, article, or statement to our verification engines below.
                </p>
                <button onClick={() => router.push('/fact-check')} className="btn-verify inline-block text-xl py-4 px-8">
                  Start Fact-Checking Now
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="md:col-span-4 border-l-2 border-foreground pl-8">
              <h4 className="text-xl font-black uppercase border-b-2 border-foreground pb-2 mb-4">Latest Briefings</h4>

              <div className="mb-6 pb-6 border-b border-gray-300 group cursor-pointer">
                <span className="badge badge-partial mb-2 inline-block">Analysis</span>
                <div className="w-full h-32 mb-3 overflow-hidden border border-foreground/30 relative">
                  <img
                    src="https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80"
                    alt="Laptop screen with data"
                    className="w-full h-full object-cover grayscale contrast-125 sepia-[0.3] group-hover:grayscale-0 group-hover:sepia group-hover:hue-rotate-[180deg] group-hover:saturate-200 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-foreground opacity-5 group-hover:opacity-0 transition-opacity" style={{ mixBlendMode: 'multiply' }}></div>
                </div>
                <h5 className="font-bold text-lg mb-2 leading-snug group-hover:text-primary transition-colors">The Architecture of Truth</h5>
                <p className="text-foreground/80 text-sm">
                  How Groq and Llama-3 power the reasoning engines behind our verification process.
                </p>
              </div>

              <div className="mb-6 pb-6 border-b border-gray-300 group cursor-pointer">
                <span className="badge badge-true mb-2 inline-block">Verified Highlight</span>
                <div className="w-full h-32 mb-3 overflow-hidden border border-foreground/30 relative">
                  <img
                    src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80"
                    alt="Server architecture"
                    className="w-full h-full object-cover grayscale contrast-125 sepia-[0.3] group-hover:grayscale-0 group-hover:sepia group-hover:hue-rotate-[180deg] group-hover:saturate-200 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-foreground opacity-5 group-hover:opacity-0 transition-opacity" style={{ mixBlendMode: 'multiply' }}></div>
                </div>
                <h5 className="font-bold text-lg mb-2 leading-snug group-hover:text-primary transition-colors">Speed Records Broken</h5>
                <p className="text-foreground/80 text-sm">
                  Our system now processes complex claims across multiple documents in under 12 seconds.
                </p>
              </div>

              <div className="mb-6 pb-6 border-b border-gray-300 group cursor-pointer">
                <span className="badge badge-false mb-2 inline-block">Debunked</span>
                <div className="w-full h-32 mb-3 overflow-hidden border border-foreground/30 relative">
                  <img
                    src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80"
                    alt="Cyber face"
                    className="w-full h-full object-cover grayscale contrast-150 group-hover:grayscale-0 group-hover:sepia group-hover:hue-rotate-[220deg] group-hover:saturate-[3] transition-all duration-700"
                  />
                  <div className="absolute inset-0 opacity-20 pointer-events-none group-hover:opacity-0 transition-opacity" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '4px 4px' }}></div>
                </div>
                <h5 className="font-bold text-lg mb-2 leading-snug group-hover:text-primary transition-colors">The Deepfake Illusion</h5>
                <p className="text-foreground/80 text-sm">
                  Integrated media detection easily identifies synthetic signatures in viral audio.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}