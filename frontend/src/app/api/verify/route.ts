import { NextRequest, NextResponse } from 'next/server'
import { AdvancedFactCheckerAgent } from '@/lib/fact-checker-agent'
import axios from 'axios'
import https from 'https'
import crypto from 'crypto'
import * as cheerio from 'cheerio'

export async function POST(request: NextRequest) {
  try {
    const { text, url, imageUrl } = await request.json()

    if (!text && !url && !imageUrl) {
      return NextResponse.json(
        { error: 'Either text, url, or imageUrl must be provided' },
        { status: 400 }
      )
    }

    // Get text content from URL if provided
    let content = text
    if (url && !text) {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
          httpsAgent: new https.Agent({
            // This is the CRITICAL fix for ERR_SSL_UNSAFE_LEGACY_RENEGOTIATION_DISABLED
            secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
          }),
          timeout: 15000,
        })

        const html = response.data
        const $ = cheerio.load(html)
        //cool shit
        // Remove scripts, styles, and junk
        $('script, style, noscript, iframe, nav, footer, header, aside').remove()

        // Extract meaningful text
        content = $('p, h1, h2, h3, h4, h5, h6, li, article, main')
          .text()
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 5000) // Increased token window now that we have clean text
      } catch (error: any) {
        console.error('URL fetch error:', error)
        const statusCode = error?.response?.status
        let userMessage = 'Failed to fetch URL content'
        if (statusCode === 403) {
          userMessage = 'This website has blocked automated access (403 Forbidden). Please copy-paste the article text directly instead of using the URL.'
        } else if (statusCode === 404) {
          userMessage = 'Page not found (404). Please check the URL and try again.'
        } else if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
          userMessage = 'Could not connect to the website. Please check the URL is correct.'
        } else if (error instanceof Error) {
          userMessage = error.message
        }
        return NextResponse.json(
          { error: userMessage },
          { status: 400 }
        )
      }
    }

    // Handle image-only requests
    if (!content && imageUrl) {
      content = 'Image analysis request'
    }

    if (!content?.trim() && !imageUrl) {
      return NextResponse.json(
        { error: 'No content to process' },
        { status: 400 }
      )
    }

    // Initialize the advanced fact-checker
    const factChecker = new AdvancedFactCheckerAgent()

    // Verify content using multiple sources
    const result = await factChecker.verifyContent(content?.trim() || '', imageUrl)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      {
        error: 'Verification failed',
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}