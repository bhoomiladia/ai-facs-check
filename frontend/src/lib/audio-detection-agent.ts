import Groq from 'groq-sdk'
import type {
  AudioAnalysisResult,
  AudioDetectionScore,
  AudioFinding,
  AudioVerdict,
} from '@/types/audio-detection'

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

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function getVerdict(score: number): AudioVerdict {
  if (score >= 85) return 'ai_generated'
  if (score >= 65) return 'likely_ai'
  if (score >= 40) return 'inconclusive'
  if (score >= 20) return 'likely_authentic'
  return 'authentic'
}

// ─── System Prompt ───
const AUDIO_DETECTION_SYSTEM_PROMPT = `You are an advanced AI-Generated Audio Forensics Analyst. Your task is to analyze audio transcription and metadata to accurately determine whether audio is AI-generated/synthetic OR genuine human speech.

### SCORING PHILOSOPHY
- Score 0-100 where 0 = definitely human, 100 = definitely AI-generated.
- You MUST weigh evidence from BOTH directions. Count human indicators AND AI indicators, then decide.
- Do NOT blindly default to low OR high scores. Analyze the actual evidence.

### STEP-BY-STEP DECISION PROCESS
Follow these steps in order:

**Step 1: Check Linguistic Content**
Read the transcription carefully. Does it sound like someone TALKING or someone READING written text aloud?
- SPOKEN language: incomplete sentences, filler words ("um", "uh", "like", "you know"), self-corrections, topic jumps, informal grammar → HUMAN indicator
- WRITTEN language read aloud: perfectly structured sentences, no fillers, formal grammar, reads like an essay or article, no hesitations whatsoever → AI indicator  
- If the text is perfectly polished with zero spoken-language artifacts in a passage longer than 3 sentences, this is a STRONG AI indicator (score 60+)

**Step 2: Check Voice Quality**
- Natural voice: pitch varies within words, slight breathiness, micro-tremors, vocal fry, natural resonance → HUMAN
- Synthetic voice: unnaturally smooth pitch, metallic/plastic quality, every syllable equally clear, no breathiness, robotic cadence → AI indicator
- Celebrity/famous person voice saying things they wouldn't normally say, or in contexts they wouldn't be in → likely VOICE CLONE (score 80+)

**Step 3: Check Audio Environment**
- Background noise present (any kind: hum, traffic, wind, room reverb, keyboard, other people) → HUMAN indicator
- Completely sterile silence with zero room tone → AI indicator
- Note: Professional studio recordings CAN be clean, so silence alone is not conclusive. Weigh with other factors.

**Step 4: Count Evidence and Score**
- If HUMAN indicators clearly outnumber AI indicators → score 0-30
- If mixed signals → score 30-60
- If AI indicators clearly outnumber human indicators → score 60-85
- If overwhelmingly AI (no human indicators at all) → score 85-100

### ANALYSIS DIMENSIONS
Evaluate across these 6 forensic dimensions (score 0-100 each, where 0=human, 100=AI):

1. **Neural TTS Fingerprint** (id: "tts")
   - AI: uniform prosody, robotic cadence, unnatural pitch transitions, all syllables equally stressed, metallic/plastic voice quality
   - Human: natural pitch wobble, inconsistent emphasis, breathy sounds, organic vowel formants, micro-pitch variation
   - Modern TTS (ElevenLabs, OpenAI) can sound very natural — look for SUBTLE cues like too-perfect pronunciation of every single word

2. **Prosody & Rhythm Analysis** (id: "prosody")
   - AI: metronomic pacing, identical pause lengths between sentences, zero filler words in long passages, no audible breathing
   - Human: filler words ("um", "uh", "like", "so"), variable pauses, audible inhales, self-corrections, false starts, pace changes
   - KEY TEST: Count filler words in the transcription. If passage is >50 words with ZERO fillers/hesitations → suspicious. If fillers present → strong human signal.

3. **Spectral Consistency** (id: "spectral")
   - AI: unnaturally clean harmonics, spectral gaps from vocoder processing, missing room reverb, synthesized formants
   - Human: natural room acoustics, ambient frequency content, natural formant transitions, background spectral content

4. **Voice Cloning & Celebrity Detection** (id: "cloning")
   - Check if the voice resembles a known celebrity, public figure, or well-known personality
   - If it sounds like a celebrity but the content seems out-of-character, scripted, promotional, or says things they wouldn't normally say → HIGH probability of voice clone (score 75-95)
   - Known cloned voices often have: slightly flatter emotional range than the real person, consistent timbre without fatigue, subtle uncanny-valley quality
   - Celebrity voices used in unexpected contexts (selling products, making statements they never made) → score 80+
   - If voice does NOT resemble anyone famous and shows natural variation → score LOW

5. **Background & Environment** (id: "environment")
   - AI: completely sterile silence, no room tone, no ambient sound whatsoever
   - Human: background noise (even quiet hum), room reverb, environmental sounds, mic handling noise, breathing between words
   - Clean studio audio CAN be human (podcast, professional recording) — weigh this dimension with others, don't use it as sole decider
   - If Whisper detected high no_speech_prob → background sound present → human indicator

6. **Linguistic Content Analysis** (id: "linguistic")
   - AI: text reads like polished written prose, perfect grammar throughout, every sentence well-structured, no contractions in casual speech, reads like a blog post or article being narrated
   - Human: incomplete thoughts, informal grammar, contractions ("don't", "gonna", "wanna"), topic diversions, anecdotes, conversational asides
   - If the entire transcription could be copied as-is into a formal article with no editing needed → strong AI indicator (score 65+)
   - If it's messy, informal, or conversational → strong human indicator (score 5-20)

### FINDINGS
Provide 3-8 forensic findings. Include both human AND AI indicators found:
- title: specific technical observation
- description: detailed explanation
- severity: "info" (human indicator found), "warning" (mildly suspicious), "critical" (strong AI indicator)
- category: "TTS Fingerprint", "Prosody", "Spectral", "Voice Cloning", "Environment", "Compression", "Linguistic", "Celebrity Detection"

### MODEL ATTRIBUTION
If overall_score ≥ 60, identify the most likely AI model:
Known models: ElevenLabs, OpenAI TTS, Google WaveNet, Amazon Polly, Microsoft Azure TTS, Bark, XTTS, Tortoise TTS, Coqui, PlayHT, Murf.ai, Resemble.ai, HeyGen, Synthesia.
If unsure or score < 60, set to null.

### OUTPUT FORMAT
Return ONLY valid JSON:
{
  "overall_score": 0-100,
  "detection_scores": [
    { "id": "tts", "label": "Neural TTS Fingerprint", "score": 0-100, "confidence": 0-100, "description": "...", "severity": "low|medium|high|critical" },
    { "id": "prosody", "label": "Prosody & Rhythm", "score": 0-100, "confidence": 0-100, "description": "...", "severity": "..." },
    { "id": "spectral", "label": "Spectral Consistency", "score": 0-100, "confidence": 0-100, "description": "...", "severity": "..." },
    { "id": "cloning", "label": "Voice Cloning & Celebrity", "score": 0-100, "confidence": 0-100, "description": "...", "severity": "..." },
    { "id": "environment", "label": "Background & Environment", "score": 0-100, "confidence": 0-100, "description": "...", "severity": "..." },
    { "id": "linguistic", "label": "Linguistic Content", "score": 0-100, "confidence": 0-100, "description": "...", "severity": "..." }
  ],
  "findings": [ { "id": "f1", "title": "...", "description": "...", "severity": "info|warning|critical", "category": "..." } ],
  "model_attribution": "Model name or null",
  "audio_description": "Brief description of the audio content, speaker characteristics, and any celebrity resemblance detected.",
  "analysis_summary": "2-3 sentence summary explaining the verdict with specific evidence cited from the transcription."
}`

// ─── Main Agent ───
export class AudioDetectionAgent {
  private groq: Groq

  constructor() {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }

  async analyzeAudio(
    audioBase64: string,
    mimeType: string
  ): Promise<AudioAnalysisResult> {
    try {
      // Step 1: Transcribe using Whisper via Groq (verbose_json gives us segment-level data)
      const audioBuffer = Buffer.from(audioBase64, 'base64')
      const file = new File([audioBuffer], 'audio.mp3', { type: mimeType || 'audio/mpeg' })

      let transcription = ''
      let whisperMeta = ''
      try {
        const whisperResult = await this.groq.audio.transcriptions.create({
          file,
          model: 'whisper-large-v3',
          response_format: 'verbose_json',
        })

        if (typeof whisperResult === 'object' && 'text' in whisperResult) {
          transcription = (whisperResult as any).text
          // Extract segment-level metadata for forensic analysis
          const segments = (whisperResult as any).segments
          if (Array.isArray(segments) && segments.length > 0) {
            const avgConfidence = segments.reduce((sum: number, s: any) => sum + (s.avg_logprob || 0), 0) / segments.length
            const noSpeechProbs = segments.map((s: any) => s.no_speech_prob || 0)
            const avgNoSpeech = noSpeechProbs.reduce((a: number, b: number) => a + b, 0) / noSpeechProbs.length
            const maxNoSpeech = Math.max(...noSpeechProbs)
            whisperMeta = `
Whisper Segment Metadata:
- Total segments: ${segments.length}
- Average log probability: ${avgConfidence.toFixed(3)} (lower values indicate less certain transcription, often caused by background noise or natural speech variation)
- Average no_speech_probability: ${avgNoSpeech.toFixed(3)} (higher values indicate background noise or silence detected — a STRONG human indicator)
- Max no_speech_probability: ${maxNoSpeech.toFixed(3)}
- Note: If no_speech_prob > 0.1, background noise or ambient sound was detected. This is a STRONG indicator of REAL HUMAN recording.`
          }
        } else {
          transcription = String(whisperResult)
        }
      } catch {
        transcription = '[Audio transcription failed — analyzing based on available metadata]'
      }

      // Step 2: Analyze with balanced forensic prompt
      const analysisPrompt = `${AUDIO_DETECTION_SYSTEM_PROMPT}

Audio Transcription:
"${transcription}"
${whisperMeta}

Audio Format: ${mimeType || 'unknown'}
Audio Size: ${audioBuffer.length} bytes

Follow the STEP-BY-STEP DECISION PROCESS above. First analyze the LINGUISTIC CONTENT of the transcription (does it read like spoken or written language?). Then check voice quality cues. Then check environment. Then count all evidence before scoring. Check if the voice resembles any celebrity or public figure. Return JSON only.`

      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: analysisPrompt },
          { role: 'user', content: 'Perform forensic analysis on this audio. Follow the 4-step decision process. Check linguistic patterns for written-vs-spoken language. Check for celebrity voice cloning. Weigh evidence from both human and AI directions fairly. Return JSON only.' },
        ],
        temperature: 0.15,
        max_tokens: 4000,
      })

      const rawContent = completion.choices[0]?.message?.content || ''
      const jsonStr = sanitizeJsonString(rawContent)
      const parsed = JSON.parse(jsonStr)

      return this.buildResult(parsed, transcription)
    } catch (error) {
      console.error('Audio detection error:', error)
      return this.fallbackResult(String(error))
    }
  }

  private fallbackResult(errorMsg: string): AudioAnalysisResult {
    return {
      verdict: 'inconclusive',
      overallScore: 50,
      detectionScores: [
        { id: 'tts', label: 'Neural TTS Fingerprint', score: 50, confidence: 20, description: 'Analysis could not be completed.', severity: 'medium' },
        { id: 'prosody', label: 'Prosody & Rhythm', score: 50, confidence: 20, description: 'Unable to assess.', severity: 'medium' },
        { id: 'spectral', label: 'Spectral Consistency', score: 50, confidence: 20, description: 'Unable to assess.', severity: 'medium' },
        { id: 'cloning', label: 'Voice Cloning & Celebrity', score: 50, confidence: 20, description: 'Unable to assess.', severity: 'medium' },
        { id: 'environment', label: 'Background & Environment', score: 50, confidence: 20, description: 'Unable to assess.', severity: 'medium' },
        { id: 'linguistic', label: 'Linguistic Content', score: 50, confidence: 20, description: 'Unable to assess.', severity: 'medium' },
      ],
      findings: [{ id: 'f1', title: 'Analysis Error', description: `Could not complete analysis: ${errorMsg}`, severity: 'warning', category: 'System' }],
      analyzedAt: new Date().toISOString(),
      modelAttribution: null,
    }
  }

  private buildResult(
    parsed: any,
    transcription: string
  ): AudioAnalysisResult {
    const overallScore = clamp(parsed.overall_score ?? 50, 0, 100)

    const detectionScores: AudioDetectionScore[] = (parsed.detection_scores || []).map((ds: any) => ({
      id: ds.id || 'unknown',
      label: ds.label || ds.id || 'Unknown',
      score: clamp(ds.score ?? 50, 0, 100),
      confidence: clamp(ds.confidence ?? 50, 0, 100),
      description: ds.description || 'No details available.',
      severity: (['low', 'medium', 'high', 'critical'].includes(ds.severity) ? ds.severity : 'medium') as AudioDetectionScore['severity'],
    }))

    // Ensure all 6 dimensions exist
    const expectedIds = ['tts', 'prosody', 'spectral', 'cloning', 'environment', 'linguistic']
    const expectedLabels: Record<string, string> = {
      tts: 'Neural TTS Fingerprint',
      prosody: 'Prosody & Rhythm',
      spectral: 'Spectral Consistency',
      cloning: 'Voice Cloning & Celebrity',
      environment: 'Background & Environment',
      linguistic: 'Linguistic Content',
    }
    for (const eid of expectedIds) {
      if (!detectionScores.find((ds: AudioDetectionScore) => ds.id === eid)) {
        detectionScores.push({
          id: eid,
          label: expectedLabels[eid],
          score: overallScore,
          confidence: 30,
          description: 'This dimension could not be fully assessed.',
          severity: 'medium',
        })
      }
    }

    const findings: AudioFinding[] = (parsed.findings || []).map((f: any, i: number) => ({
      id: f.id || `f${i + 1}`,
      title: f.title || 'Finding',
      description: f.description || '',
      severity: (['info', 'warning', 'critical'].includes(f.severity) ? f.severity : 'info') as AudioFinding['severity'],
      category: f.category || 'General',
    }))

    return {
      verdict: getVerdict(overallScore),
      overallScore,
      detectionScores,
      findings,
      transcription: transcription || undefined,
      audioDescription: parsed.audio_description || 'No description provided.',
      analysisSummary: parsed.analysis_summary || 'No summary provided.',
      analyzedAt: new Date().toISOString(),
      modelAttribution: parsed.model_attribution || null,
    }
  }
}
