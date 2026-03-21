import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { llmProvider } from './llm-provider'
import {
  NewsAPIToolkit,
  ComposioWebSearch,
  ExaSearchToolkit,
  ImageAnalysisToolkit,
  ComposioImageSearch,
  SearchResult,
  ImageAnalysisResult
} from './search-toolkits'

export interface Claim {
  id: string
  text: string
  category?: string
  start_pos?: number
  end_pos?: number
}

export interface Evidence {
  title: string
  content: string
  url: string
  source: string
  publishedDate?: string
  relevanceScore?: number
}

export interface VerifiedClaim {
  claim: Claim
  status: 'True' | 'False' | 'Partially True'
  confidence: number
  reasoning: string
  evidence: Evidence[]
  search_queries: string[]
  sources_used: string[]
}

export interface VerificationResult {
  request_id: string
  original_text: string
  extracted_claims: Claim[]
  verified_claims: VerifiedClaim[]
  overall_accuracy: number
  processing_time: number
  metadata: {
    total_claims: number
    true_claims: number
    false_claims: number
    partially_true_claims: number
    sources_consulted: string[]
    image_analysis?: ImageAnalysisResult
  }
}

export class AdvancedFactCheckerAgent {
  private llmProvider = llmProvider
  private searchToolkits: {
    news: NewsAPIToolkit | null
    composioWeb: ComposioWebSearch | null
    exaSearch: ExaSearchToolkit | null
    imageAnalysis: ImageAnalysisToolkit | null
    composioImage: ComposioImageSearch | null
  }

  constructor() {
    // Initialize search toolkits
    this.searchToolkits = {
      news: process.env.NEWS_API_KEY ? new NewsAPIToolkit(process.env.NEWS_API_KEY) : null,
      composioWeb: process.env.COMPOSIO_API_KEY ? new ComposioWebSearch(process.env.COMPOSIO_API_KEY) : null,
      exaSearch: process.env.EXA_API_KEY ? new ExaSearchToolkit(process.env.EXA_API_KEY) : null,
      imageAnalysis: process.env.GEMINI_API_KEY ? new ImageAnalysisToolkit(process.env.GEMINI_API_KEY) : null,
      composioImage: process.env.COMPOSIO_API_KEY ? new ComposioImageSearch(process.env.COMPOSIO_API_KEY) : null,
    }
  }

  async extractClaims(text: string): Promise<Claim[]> {
    try {
      const systemPrompt = `### SYSTEM ROLE
You are a Senior Fact-Checking Analyst specializing in linguistic deconstruction and logical verification. Your sole objective is to extract atomic, verifiable assertions from a provided text with 100% accuracy.
If a claim appears in many tabloid or social media sources but lacks a primary court record or mainstream journalistic confirmation, check for 'hoax' or 'debunk' keywords specifically.

### OPERATIONAL RULES
1. **Atomic Decomposition:** Break complex sentences into individual, independent claims. If a sentence contains two facts (e.g., "The Earth is round and rotates"), you must create two separate entries.
2. **Image Context:** If the text contains [IMAGE DESCRIPTION] or [TEXT EXTRACTED FROM IMAGE], treat those as primary factual assertions to be verified. 
3. **Verifiability Filter:** Only extract claims that can be proven True or False using empirical evidence, data, or primary records. 
   - **EXCLUDE:** Subjective adjectives (e.g., "beautiful," "dangerous"), opinions, future predictions, and personal anecdotes.
4. **EXCLUDE METADATA:** Do NOT extract claims about the webpage, article, or source itself. Specifically IGNORE:
   - Who authored, published, or founded the website/article
   - When the article was published, modified, or last updated
   - The URL or availability of the article
   - Website names, domains, or platform information
   - Any JSON-LD schema, HTML metadata, or structured data attributes
   Focus ONLY on the substantive factual claims WITHIN the content body.
5. **Zero-Hallucination Policy:** Do not paraphrase the claim in a way that changes its technical meaning. Do not add outside information.
6. **Category Mapping:** Assign each claim to one of these types: [scientific, historical, statistical, current_events, geopolitical, technical].
7. **Positional Accuracy:** For original text, "start_pos" and "end_pos" must accurately reflect the character index. For image descriptions/extracted text, set these to -1 or a virtual index.

### EXTRACTION CRITERIA
- **Quantities:** Numbers, percentages, dates, or specific amounts mentioned in the actual story/content.
- **Entities:** Specific names of people, organizations, or places linked to an action or state in the story.
- **Events:** Specific occurrences with a defined timeframe described in the story.
- **Physical Laws:** Scientific or technical constants/relationships.

### OUTPUT FORMAT
Return ONLY a valid JSON array. No preamble. No conversational filler.

[
  {
    "id": "claim_1",
    "text": "The exact atomic claim from the text",
    "category": "category_name",
    "start_pos": 0,
    "end_pos": 0
  }
]`

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(`Extract claims from: ${text}`)
      ]

      const response = await this.llmProvider.invoke(messages)
      let claimsJson = response.content.toString().trim()

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

  async generateSearchQueries(claim: string, category?: string): Promise<string[]> {
    try {
      const systemPrompt = `Generate 3-4 optimized search queries to verify this claim across different sources.

Consider the claim category: ${category || 'general'}

Generate queries for:
1. Direct verification
2. Counter-evidence and debunking (e.g., add "hoax", "fake", "fact check", "debunked" keywords)
3. Expert/authoritative sources
4. Primary records (court filings, scientific papers, official statements)

If the claim looks sensational or sounds like a "viral story", you MUST generate at least one query specifically looking for debunks.

Return ONLY a JSON array of strings:
["query1", "query2", "query3", "query4"]`

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(`Generate search queries for: "${claim}"`)
      ]

      const response = await this.llmProvider.invoke(messages)
      let queriesJson = response.content.toString().trim()

      if (queriesJson.startsWith('```json')) {
        queriesJson = queriesJson.split('```json')[1].split('```')[0].trim()
      } else if (queriesJson.startsWith('```')) {
        queriesJson = queriesJson.split('```')[1].trim()
      }

      const queries = JSON.parse(queriesJson)
      return Array.isArray(queries) ? queries.slice(0, 4) : [claim]
    } catch (error) {
      console.error('Error generating search queries:', error)
      return [claim]
    }
  }

  async searchMultipleSources(queries: string[], claimCategory?: string): Promise<{
    results: Evidence[]
    sourcesUsed: string[]
  }> {
    const allResults: Evidence[] = []
    const sourcesUsed: string[] = []

    // Determine which sources to use based on claim category
    const sourceStrategy = this.getSourceStrategy(claimCategory)

    for (const query of queries) {
      // News API - for current events
      if (sourceStrategy.useNews && this.searchToolkits.news) {
        try {
          const newsResults = await this.searchToolkits.news.searchNews(query, 3)
          allResults.push(...newsResults.map(r => ({ ...r, source: 'NewsAPI' })))
          if (newsResults.length > 0) sourcesUsed.push('NewsAPI')
        } catch (error) {
          console.error('News search error:', error)
        }
      }

      // Exa search - for high-quality citations
      if (sourceStrategy.useExa && this.searchToolkits.exaSearch) {
        try {
          const exaResults = await this.searchToolkits.exaSearch.searchWithCitations(query, 2)
          allResults.push(...exaResults.map(r => ({ ...r, source: 'Exa' })))
          if (exaResults.length > 0) sourcesUsed.push('Exa')
        } catch (error) {
          console.error('Exa search error:', error)
        }
      }
    }

    const uniqueResults = this.deduplicateResults(allResults)
    const sortedResults = uniqueResults
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, 8) // Limit to top 8 results

    return {
      results: sortedResults,
      sourcesUsed: [...new Set(sourcesUsed)]
    }
  }

  private getSourceStrategy(category?: string) {
    const defaultStrategy = {
      useNews: true,
      useExa: true,
    }

    switch (category?.toLowerCase()) {
      case 'scientific':
        return { ...defaultStrategy, useExa: true }
      case 'current_events':
        return { ...defaultStrategy, useNews: true }
      case 'historical':
        return { ...defaultStrategy, useExa: true, useNews: false }
      case 'statistical':
        return { ...defaultStrategy, useExa: true }
      default:
        return defaultStrategy
    }
  }

  private deduplicateResults(results: Evidence[]): Evidence[] {
    const seen = new Set<string>()
    return results.filter(result => {
      const key = result.url || result.title
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  async verifyClaim(claim: string, evidence: Evidence[]): Promise<{
    status: 'True' | 'False' | 'Partially True'
    confidence: number
    reasoning: string
  }> {
    try {
      const evidenceText = evidence
        .slice(0, 6)
        .map((ev, i) => `Source ${i + 1} (${ev.source}): ${ev.title}\nContent: ${ev.content.slice(0, 400)}...\nURL: ${ev.url}`)
        .join('\n\n')

      const systemPrompt = `You are an expert fact-checker. Analyze the claim against the provided evidence.

### ANTI-CROSS-CONTAMINATION RULES (CRITICAL)
Before using ANY source as evidence, you MUST verify:
1. **Entity Match:** Does the source discuss the EXACT same people, organizations, and places as the claim? A debunking of "Man X sues wife" does NOT apply to "Man Y sues wife."
2. **Date Match:** Does the source discuss events from the SAME time period? A 2024 article debunking a 2012 rumor is NOT evidence about a 2023 event unless it explicitly references it.
3. **Event Match:** Is the source discussing the EXACT same incident, or a SIMILAR but DIFFERENT one? Similar ≠ Same.
4. **Satirical Sources:** If a source is from a known satire outlet (The Onion, Babylon Bee, etc.), note it but do NOT treat it as factual evidence.

If a source does not pass ALL three checks (entity + date + event), DISCARD it and do not cite it in your reasoning.

### YOUR ANALYSIS PROCESS
Step 1: For each source, write one line: "Source N: [RELEVANT/IRRELEVANT] — [why]"
Step 2: Using ONLY relevant sources, determine the verdict.
Step 3: If no sources are directly relevant, set confidence to 0.3 and status to "Partially True" with reasoning explaining the evidence gap.

### CLASSIFICATION
- "True": Multiple relevant, authoritative sources directly confirm the exact claim
- "False": Relevant sources directly contradict or debunk the exact claim
- "Partially True": Some relevant evidence supports it, but with caveats or missing context

### CONFIDENCE (0.0–1.0)
- 0.9–1.0: Multiple relevant authoritative sources agree on the exact claim
- 0.7–0.8: Good relevant evidence from reliable sources
- 0.5–0.6: Limited relevant evidence or some conflicting information
- 0.3–0.4: Mostly irrelevant evidence or weak matches
- 0.0–0.2: No relevant evidence found

### SOURCE HIERARCHY
Snopes, FactCheck.org, PolitiFact, AP, Reuters > Mainstream news > Tabloid/viral > Social media

If a fact-checking site (Snopes, etc.) specifically debunks THIS EXACT claim, mark it "False."

Return ONLY valid JSON:
{
  "status": "True|False|Partially True",
  "confidence": 0.85,
  "reasoning": "Detailed explanation. For each source used, state WHY it is relevant to this specific claim."
}`

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(`Claim: "${claim}"\n\nEvidence:\n${evidenceText}`)
      ]

      const response = await this.llmProvider.invoke(messages)
      let resultJson = response.content.toString().trim()

      if (resultJson.startsWith('```json')) {
        resultJson = resultJson.split('```json')[1].split('```')[0].trim()
      } else if (resultJson.startsWith('```')) {
        resultJson = resultJson.split('```')[1].trim()
      }

      const result = JSON.parse(resultJson)

      return {
        status: result.status || 'Partially True',
        confidence: Math.max(0, Math.min(1, parseFloat(result.confidence) || 0.3)),
        reasoning: result.reasoning || 'Unable to verify claim with available evidence'
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

  async analyzeImage(imageUrl: string): Promise<ImageAnalysisResult | null> {
    if (!this.searchToolkits.imageAnalysis) {
      return null
    }

    try {
      return await this.searchToolkits.imageAnalysis.analyzeImage(imageUrl)
    } catch (error) {
      console.error('Error analyzing image:', error)
      return null
    }
  }

  async verifyContent(text: string, imageUrl?: string): Promise<VerificationResult> {
    const startTime = Date.now()
    let processedText = text
    let imageAnalysis: ImageAnalysisResult | null = null

    // Analyze image if provided
    if (imageUrl && this.searchToolkits.imageAnalysis) {
      imageAnalysis = await this.analyzeImage(imageUrl)
      if (imageAnalysis) {
        if (imageAnalysis.description) {
          processedText += '\n\n[IMAGE DESCRIPTION]: ' + imageAnalysis.description
        }
        if (imageAnalysis.extractedText) {
          processedText += '\n\n[TEXT EXTRACTED FROM IMAGE]: ' + imageAnalysis.extractedText
        }
      }
    }

    // Extract claims
    const claims = await this.extractClaims(processedText)

    if (claims.length === 0) {
      return {
        request_id: `req_${Date.now()}`,
        original_text: text,
        extracted_claims: [],
        verified_claims: [],
        overall_accuracy: 0,
        processing_time: (Date.now() - startTime) / 1000,
        metadata: {
          total_claims: 0,
          true_claims: 0,
          false_claims: 0,
          partially_true_claims: 0,
          sources_consulted: [],
          image_analysis: imageAnalysis || undefined
        }
      }
    }

    // Verify each claim
    const verifiedClaims: VerifiedClaim[] = []
    const allSourcesUsed = new Set<string>()

    for (const claim of claims) {
      // Generate search queries
      const searchQueries = await this.generateSearchQueries(claim.text, claim.category)

      // Search multiple sources
      const { results: evidence, sourcesUsed } = await this.searchMultipleSources(searchQueries, claim.category)
      sourcesUsed.forEach(source => allSourcesUsed.add(source))

      // Verify claim
      const verification = await this.verifyClaim(claim.text, evidence)

      verifiedClaims.push({
        claim,
        status: verification.status,
        confidence: verification.confidence,
        reasoning: verification.reasoning,
        evidence: evidence.slice(0, 5), // Keep top 5 evidence pieces
        search_queries: searchQueries,
        sources_used: sourcesUsed
      })
    }

    // Calculate overall accuracy
    const trueClaimsCount = verifiedClaims.filter(vc => vc.status === 'True').length
    const partiallyTrueCount = verifiedClaims.filter(vc => vc.status === 'Partially True').length
    const overallAccuracy = verifiedClaims.length > 0
      ? (trueClaimsCount + (partiallyTrueCount * 0.5)) / verifiedClaims.length
      : 0

    const processingTime = (Date.now() - startTime) / 1000

    return {
      request_id: `req_${Date.now()}`,
      original_text: text,
      extracted_claims: claims,
      verified_claims: verifiedClaims,
      overall_accuracy: overallAccuracy,
      processing_time: processingTime,
      metadata: {
        total_claims: verifiedClaims.length,
        true_claims: verifiedClaims.filter(vc => vc.status === 'True').length,
        false_claims: verifiedClaims.filter(vc => vc.status === 'False').length,
        partially_true_claims: verifiedClaims.filter(vc => vc.status === 'Partially True').length,
        sources_consulted: Array.from(allSourcesUsed),
        image_analysis: imageAnalysis || undefined
      }
    }
  }
}