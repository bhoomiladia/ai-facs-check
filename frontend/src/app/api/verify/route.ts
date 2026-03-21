import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

interface Claim {
  id: string
  text: string
  category?: string
  start_pos?: number
  end_pos?: number
}

interface Evidence {
  title: string
  content: string
  url: string
  query: string
}

interface VerifiedClaim {
  claim: Claim
  status: 'True' | 'False' | 'Partially True'
  confidence: number
  reasoning: string
  evidence: Evidence[]
  search_queries: string[]
}

async function searchTavily(query: string): Promise<Evidence[]> {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: query,
        search_depth: 'advanced',
        max_results: 3,
        include_answer: true,
        include_raw_content: false,
      }),
    })

    if (!response.ok) {
      console.error('Tavily search failed:', response.status)
      return []
    }

    const data = await response.json()
    return data.results?.map((result: any) => ({
      title: result.title || '',
      content: result.content || '',
      url: result.url || '',
      query: query,
    })) || []
  } catch (error) {
    console.error('Error in Tavily search:', error)
    return []
  }
}

async function extractClaims(text: string): Promise<Claim[]> {
  try {
    const systemPrompt = `You are an expert fact-checker. Extract all verifiable, atomic claims from the given text.

Rules:
1. Each claim should be a single, testable statement
2. Ignore opinions, subjective statements, or personal experiences
3. Focus on factual assertions that can be verified with evidence
4. Break down complex statements into atomic claims
5. Include approximate position in text

Return ONLY a valid JSON array with this structure:
[
  {
    "id": "claim_1",
    "text": "The exact claim text",
    "category": "category_name",
    "start_pos": 0,
    "end_pos": 20
  }
]`

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Extract claims from: ${text}` }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
      max_tokens: 4000,
    })

    let claimsJson = completion.choices[0]?.message?.content?.trim() || '[]'
    
    // Clean JSON response
    if (claimsJson.startsWith('```json')) {
      claimsJson = claimsJson.split('```json')[1].split('```')[0].trim()
    } else if (claimsJson.startsWith('```')) {
      claimsJson = claimsJson.split('```')[1].trim()
    }

    const claims = JSON.parse(claimsJson)
    return Array.isArray(claims) ? claims : []
  } catch (error) {
    console.error('Error extracting claims:', error)
    return []
  }
}

async function generateSearchQueries(claim: string): Promise<string[]> {
  try {
    const searchPrompt = `Generate 2-3 optimized search queries to verify this claim: "${claim}"

Return ONLY a JSON array of strings:
["query1", "query2", "query3"]`

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'Generate search queries for fact-checking.' },
        { role: 'user', content: searchPrompt }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
      max_tokens: 1000,
    })

    let queriesJson = completion.choices[0]?.message?.content?.trim() || '[]'
    
    if (queriesJson.startsWith('```json')) {
      queriesJson = queriesJson.split('```json')[1].split('```')[0].trim()
    } else if (queriesJson.startsWith('```')) {
      queriesJson = queriesJson.split('```')[1].trim()
    }

    const queries = JSON.parse(queriesJson)
    return Array.isArray(queries) ? queries.slice(0, 3) : [claim]
  } catch (error) {
    console.error('Error generating search queries:', error)
    return [claim]
  }
}

async function verifyClaim(claim: string, evidence: Evidence[]): Promise<{
  status: 'True' | 'False' | 'Partially True'
  confidence: number
  reasoning: string
}> {
  try {
    const evidenceText = evidence
      .slice(0, 3)
      .map((ev, i) => `Source ${i + 1}: ${ev.title}\nContent: ${ev.content.slice(0, 500)}...`)
      .join('\n\n')

    const verificationPrompt = `Analyze this claim against the provided evidence:

Claim: "${claim}"

Evidence:
${evidenceText}

Classification Rules:
- "True": Evidence strongly supports the claim
- "False": Evidence contradicts the claim  
- "Partially True": Evidence supports some aspects but not others

Return ONLY valid JSON:
{
  "status": "True|False|Partially True",
  "confidence": 0.85,
  "reasoning": "Concise explanation of the verification decision"
}`

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are an expert fact-checker. Analyze claims objectively.' },
        { role: 'user', content: verificationPrompt }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
      max_tokens: 1000,
    })

    let resultJson = completion.choices[0]?.message?.content?.trim() || '{}'
    
    if (resultJson.startsWith('```json')) {
      resultJson = resultJson.split('```json')[1].split('```')[0].trim()
    } else if (resultJson.startsWith('```')) {
      resultJson = resultJson.split('```')[1].trim()
    }

    const result = JSON.parse(resultJson)
    
    return {
      status: result.status || 'Partially True',
      confidence: Math.max(0, Math.min(1, parseFloat(result.confidence) || 0.3)),
      reasoning: result.reasoning || 'Unable to verify claim'
    }
  } catch (error) {
    console.error('Error verifying claim:', error)
    return {
      status: 'Partially True',
      confidence: 0.3,
      reasoning: `Unable to verify due to processing error: ${error}`
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text, url } = await request.json()

    if (!text && !url) {
      return NextResponse.json(
        { error: 'Either text or url must be provided' },
        { status: 400 }
      )
    }

    // Get text content
    let content = text
    if (url && !text) {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to fetch URL content')
        }
        const html = await response.text()
        // Basic text extraction
        content = html
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 2000)
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to fetch URL content' },
          { status: 400 }
        )
      }
    }

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'No text content to process' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    // Extract claims
    const claims = await extractClaims(content.trim())

    if (claims.length === 0) {
      return NextResponse.json({
        request_id: `req_${Date.now()}`,
        original_text: content,
        extracted_claims: [],
        verified_claims: [],
        overall_accuracy: 0,
        processing_time: (Date.now() - startTime) / 1000,
        metadata: {
          total_claims: 0,
          true_claims: 0,
          false_claims: 0,
          partially_true_claims: 0
        }
      })
    }

    // Process each claim
    const verifiedClaims: VerifiedClaim[] = []

    for (const claim of claims) {
      // Generate search queries
      const searchQueries = await generateSearchQueries(claim.text)

      // Search for evidence
      const allEvidence: Evidence[] = []
      for (const query of searchQueries.slice(0, 2)) {
        const results = await searchTavily(query)
        allEvidence.push(...results)
      }

      // Verify claim
      const verification = await verifyClaim(claim.text, allEvidence)

      verifiedClaims.push({
        claim,
        status: verification.status,
        confidence: verification.confidence,
        reasoning: verification.reasoning,
        evidence: allEvidence.slice(0, 3),
        search_queries: searchQueries
      })
    }

    // Calculate overall accuracy
    const trueClaimsCount = verifiedClaims.filter(vc => vc.status === 'True').length
    const partiallyTrueCount = verifiedClaims.filter(vc => vc.status === 'Partially True').length
    const overallAccuracy = verifiedClaims.length > 0 
      ? (trueClaimsCount + (partiallyTrueCount * 0.5)) / verifiedClaims.length 
      : 0

    const processingTime = (Date.now() - startTime) / 1000

    return NextResponse.json({
      request_id: `req_${Date.now()}`,
      original_text: content,
      extracted_claims: claims,
      verified_claims: verifiedClaims,
      overall_accuracy: overallAccuracy,
      processing_time: processingTime,
      metadata: {
        total_claims: verifiedClaims.length,
        true_claims: verifiedClaims.filter(vc => vc.status === 'True').length,
        false_claims: verifiedClaims.filter(vc => vc.status === 'False').length,
        partially_true_claims: verifiedClaims.filter(vc => vc.status === 'Partially True').length
      }
    })

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed', detail: String(error) },
      { status: 500 }
    )
  }
}