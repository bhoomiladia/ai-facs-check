import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { llmProvider } from './llm-provider'

// ─── Types ───
export interface AITextSignal {
  name: string
  description: string
  strength: number       // 0–1
  direction: 'ai' | 'human'
}

export interface SentenceAnalysis {
  text: string
  score: number          // 0–1 (1 = likely AI)
  flags: string[]
}

export interface AITextDetectionResult {
  overallScore: number   // 0–1 (1 = definitely AI)
  verdict: 'Human Written' | 'Likely Human' | 'Mixed/Uncertain' | 'Likely AI' | 'AI Generated'
  confidence: number     // 0–1
  signals: AITextSignal[]
  analysis: string
  sentenceAnalysis: SentenceAnalysis[]
  processingTime: number
}

// ─── Utility ───
function sanitizeJsonString(raw: string): string {
  let json = raw.trim()

  if (json.includes('```json')) {
    json = json.split('```json')[1].split('```')[0].trim()
  } else if (json.startsWith('```')) {
    json = json.split('```')[1].split('```')[0].trim()
  }

  const firstBrace = json.indexOf('{')
  const lastBrace = json.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    json = json.substring(firstBrace, lastBrace + 1)
  }

  json = json
    .replace(/\r?\n|\r/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')

  return json
}

function getVerdict(score: number): AITextDetectionResult['verdict'] {
  if (score <= 0.2) return 'Human Written'
  if (score <= 0.4) return 'Likely Human'
  if (score <= 0.6) return 'Mixed/Uncertain'
  if (score <= 0.8) return 'Likely AI'
  return 'AI Generated'
}

// ─── Detector ───
export class AITextDetector {
  private llm = llmProvider

  async analyze(text: string): Promise<AITextDetectionResult> {
    const startTime = Date.now()

    // Step 1: Get the main analysis
    const analysisResult = await this.runAnalysis(text)

    // Step 2: Get per-sentence breakdown
    const sentenceAnalysis = await this.runSentenceAnalysis(text)

    const processingTime = (Date.now() - startTime) / 1000

    return {
      ...analysisResult,
      sentenceAnalysis,
      processingTime,
    }
  }

  private async runAnalysis(text: string): Promise<Omit<AITextDetectionResult, 'sentenceAnalysis' | 'processingTime'>> {
    const systemPrompt = `You are a forensic computational linguist specializing in distinguishing AI-generated text from human-written text. Analyze the provided text for the following signals:

### SIGNAL CATEGORIES TO EVALUATE
1. **Perplexity & Burstiness**: Human text has variable sentence length, rhythm changes, and asymmetric complexity. AI text tends toward uniform sentence structure and predictable patterns.
2. **Vocabulary Distribution**: AI text overuses hedge words ("however", "furthermore", "it's important to note", "in conclusion"), filler transitions, and formal register. Human text has more colloquialisms, contractions, and irregular vocabulary.
3. **Structural Patterns**: AI text tends toward formulaic structure — intro/body/conclusion, list-heavy. Human text is more organically structured.
4. **Stylistic Fingerprints**: AI text exhibits perfect grammar, overuse of passive voice, and lacks strong personal voice. Human text has voice, personality, occasional errors, and idiosyncratic phrasing.
5. **Content/Repetition**: AI text often uses circular logic, generic examples, and restates points.

### CRITICAL RULES ALGORITHM (MANDATORY)
1. **THE SIMPLICITY RULE**: If a text is very short (under 5 sentences) or extremely simple (e.g., "Hi, my name is John and I like playing tennis"), the default assumption is ALWAYS HUMAN (score < 0.3). AI detection on short, simple text is highly prone to false positives. Simple statements of fact are HUMAN.
2. **THE BURDEN OF PROOF**: Perfect grammar and lack of colloquialisms DO NOT automatically mean a text is AI. Formal, professional human writing also has perfect grammar. You MUST find explicit AI fingerprints (distinctive hedge words, extreme robotic formulaic structure, verbose filler) to score above 0.5.
3. **THE GENERIC RULE**: Calling something "generic" is not enough to label it AI. Many humans write generic bios or emails. Only score high if the text uses complex, verbose corporate-speak to say something very simple.

### SCORING
- 0.0 - 0.2 = Definitively human (strong voice, OR very short/simple factual text)
- 0.3 - 0.4 = Likely human (formal human writing, or too short to confidently say AI)
- 0.5 = Uncertain / mixed signals
- 0.6 - 0.7 = Likely AI (clear formulaic patterns + hedge words)
- 0.8 - 1.0 = Definitively AI (unmistakable AI structure, extreme uniformity, classic LLM phrasing)

### OUTPUT FORMAT
Return ONLY valid JSON, nothing else:
{
  "overallScore": 0.0-1.0,
  "confidence": 0.0-1.0,
  "signals": [
    {
      "name": "Signal Name",
      "description": "Brief explanation of what was detected",
      "strength": 0.0-1.0,
      "direction": "ai" or "human"
    }
  ],
  "analysis": "A 2-3 sentence summary explaining your conclusion. Must align with the updated scoring rules."
}`

    try {
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(`Analyze this text for AI authorship:\n\n"""${text}"""`)
      ]

      const response = await this.llm.invoke(messages)
      const resultJson = sanitizeJsonString(response.content.toString())
      const result = JSON.parse(resultJson)

      const overallScore = Math.max(0, Math.min(1, parseFloat(result.overallScore) || 0.5))
      const confidence = Math.max(0, Math.min(1, parseFloat(result.confidence) || 0.5))

      const signals: AITextSignal[] = Array.isArray(result.signals) 
        ? result.signals.map((s: any) => ({
            name: s.name || 'Unknown Signal',
            description: s.description || '',
            strength: Math.max(0, Math.min(1, parseFloat(s.strength) || 0.5)),
            direction: s.direction === 'human' ? 'human' : 'ai',
          }))
        : []

      return {
        overallScore,
        verdict: getVerdict(overallScore),
        confidence,
        signals,
        analysis: result.analysis || 'Analysis could not be completed.',
      }
    } catch (error) {
      console.error('AI text detection analysis error:', error)
      return {
        overallScore: 0.5,
        verdict: 'Mixed/Uncertain',
        confidence: 0.2,
        signals: [],
        analysis: `Analysis could not be completed due to a processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  private async runSentenceAnalysis(text: string): Promise<SentenceAnalysis[]> {
    // Split into sentences (basic), limit to first 15
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 10)
      .slice(0, 15)

    if (sentences.length === 0) return []

    const systemPrompt = `You are a forensic linguist. For each sentence provided, rate how likely it is to be AI-generated (0.0 = definitely human, 1.0 = definitely AI). 

CRITICAL RULES:
1. **The Simplicity Rule**: Simple, generic factual statements (e.g., "He likes to play tennis", "The meeting is at 5PM") are HUMAN by default (score 0.1 - 0.3). Do NOT flag them as AI just because they are generic or lack emotion.
2. AI text is typically verbose, overly formal, and uses distinctive hedge words ("however", "it's important to note").
3. Perfect grammar does NOT mean AI.

List any flags detected (e.g., "hedge word", "formulaic opener", "colloquialism", "simple fact").

Return ONLY valid JSON:
[
  {
    "index": 0,
    "score": 0.0-1.0,
    "flags": ["flag1", "flag2"]
  }
]`

    try {
      const numberedSentences = sentences.map((s, i) => `[${i}] ${s}`).join('\n')
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(`Analyze each sentence:\n\n${numberedSentences}`)
      ]

      const response = await this.llm.invoke(messages)
      const resultJson = sanitizeJsonString(response.content.toString())
      
      let jsonStr = resultJson
      const firstBracket = jsonStr.indexOf('[')
      const lastBracket = jsonStr.lastIndexOf(']')
      if (firstBracket !== -1 && lastBracket > firstBracket) {
        jsonStr = jsonStr.substring(firstBracket, lastBracket + 1)
      } else {
        // Fallback: try to find an array inside an object
        const firstBrace = jsonStr.indexOf('{')
        const lastBrace = jsonStr.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace > firstBrace) {
           jsonStr = jsonStr.substring(firstBrace, lastBrace + 1)
        }
      }

      // Handle both array-wrapped and object-wrapped responses
      let parsed = JSON.parse(jsonStr)
      if (!Array.isArray(parsed)) {
        // Try to find the array inside the object
        const arrayKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]))
        parsed = arrayKey ? parsed[arrayKey] : []
      }

      return sentences.map((sentence, i) => {
        const match = parsed.find((r: any) => r.index === i) || parsed[i]
        return {
          text: sentence.trim(),
          score: match ? Math.max(0, Math.min(1, parseFloat(match.score) || 0.5)) : 0.5,
          flags: match?.flags && Array.isArray(match.flags) ? match.flags : [],
        }
      })
    } catch (error) {
      console.error('Sentence analysis error:', error)
      return sentences.map(s => ({
        text: s.trim(),
        score: 0.5,
        flags: [],
      }))
    }
  }
}

export const aiTextDetector = new AITextDetector()
