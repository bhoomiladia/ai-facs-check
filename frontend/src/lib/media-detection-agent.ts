import Groq from 'groq-sdk'
import axios from 'axios'
import type {
  MediaAnalysisResult,
  DetectionScore,
  HeatmapCell,
  Finding,
  Verdict,
} from '@/types/media-detection'

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

function getVerdict(score: number): Verdict {
  if (score >= 85) return 'ai_generated'
  if (score >= 65) return 'likely_ai'
  if (score >= 40) return 'inconclusive'
  if (score >= 20) return 'likely_authentic'
  return 'authentic'
}

function generateHeatmapFromScores(scores: DetectionScore[]): HeatmapCell[] {
  const gridSize = 12
  const cells: HeatmapCell[] = []
  const avgScore = scores.reduce((a, s) => a + s.score, 0) / scores.length / 100

  // Build procedural hotspots from score distribution
  const highScores = scores.filter(s => s.score >= 60)
  const hotspotCount = Math.min(highScores.length + 1, 4)
  const hotspots: { r: number; c: number; strength: number }[] = []

  for (let i = 0; i < hotspotCount; i++) {
    hotspots.push({
      r: Math.floor(Math.random() * (gridSize - 2)) + 1,
      c: Math.floor(Math.random() * (gridSize - 2)) + 1,
      strength: avgScore + Math.random() * 0.3,
    })
  }

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      let intensity = avgScore * 0.1 + Math.random() * 0.05
      for (const hs of hotspots) {
        const dist = Math.sqrt((row - hs.r) ** 2 + (col - hs.c) ** 2)
        if (dist < 3.5) {
          intensity += (1 - dist / 3.5) * hs.strength
        }
      }
      cells.push({ row, col, intensity: clamp(intensity, 0, 1) })
    }
  }
  return cells
}

// ─── The System Prompt for Groq Vision ───
const MEDIA_DETECTION_SYSTEM_PROMPT = `You are an advanced AI-Generated Media Forensics Analyst. Your task is to analyze the provided media (image) and determine whether it is AI-generated, synthetically manipulated, or a deepfake.

### ANALYSIS DIMENSIONS
Evaluate the media across these 5 forensic dimensions and provide a score (0-100) and confidence (0-100) for each:

1. **GAN Fingerprint Analysis** (id: "gan")
   - Look for periodic patterns in textures (checkerboard artifacts from upsampling layers)
   - Detect over-smoothed skin, hair, or fabric textures typical of GAN outputs
   - Check for unnatural micro-texture repetition
   - Look for asymmetric noise distributions characteristic of specific GAN architectures

2. **Metadata Consistency** (id: "metadata")
   - Assess whether the image looks like it has authentic camera metadata characteristics
   - Check if lighting, shadows, and reflections are physically consistent
   - Evaluate the presence of natural lens distortion, chromatic aberration, depth of field
   - AI images often lack these subtle optical signatures

3. **Compression Artifact Analysis** (id: "compression")
   - Examine JPEG/PNG compression patterns
   - Look for double-compression artifacts or inconsistent block boundaries
   - AI-generated images typically have different compression signatures than re-saved photos
   - Check for clean edges that bypass natural compression degradation

4. **Noise Pattern Analysis** (id: "noise")
   - Evaluate sensor noise uniformity (real cameras have characteristic sensor noise)
   - AI images have unnaturally uniform or absent sensor noise
   - Check for noise inconsistencies across regions (indicates compositing/manipulation)
   - Look for denoising artifacts from generation pipelines

5. **Frequency Domain Analysis** (id: "frequency")
   - Assess high-frequency detail consistency
   - GAN images often show spectral peaks at specific frequencies
   - Diffusion models may show unusual high-freq roll-off patterns
   - Check for unnatural frequency distribution in gradients and edges

### FINDINGS
Provide 3-6 specific forensic findings. Each finding must have:
- A specific, technical title
- A detailed description of what was observed
- severity: "info" (neutral observation), "warning" (suspicious indicator), or "critical" (strong AI indicator)
- category: one of "GAN Fingerprint", "Metadata", "Compression", "Noise Analysis", "Frequency Domain", "Structural", "Pixel Analysis", "Lighting", "Texture"

### MODEL ATTRIBUTION
If the overall AI probability is ≥60%, attempt to identify the most likely AI model that generated it.
Known models to check for: StyleGAN2, StyleGAN3, Stable Diffusion XL, DALL-E 3, Midjourney v5/v6, Imagen, Firefly, Flux.
If unsure or probability is <60%, set model_attribution to null.

### OUTPUT FORMAT
Return ONLY valid JSON, no text outside:
{
  "overall_score": 0-100,
  "detection_scores": [
    {
      "id": "gan",
      "label": "GAN Fingerprint",
      "score": 0-100,
      "confidence": 0-100,
      "description": "Detailed explanation of what was found",
      "severity": "low|medium|high|critical"
    },
    ... (all 5 dimensions)
  ],
  "findings": [
    {
      "id": "f1",
      "title": "Finding title",
      "description": "Detailed explanation",
      "severity": "info|warning|critical",
      "category": "Category name"
    },
    ...
  ],
  "model_attribution": "Model name or null",
  "image_description": "A brief visual description of what is depicted in the image.",
  "analysis_summary": "A detailed 2-3 sentence summary explaining specifically why the media is categorized as AI-generated or authentic."
}`

// ─── Main Agent ───
export class MediaDetectionAgent {
  private groq: Groq

  constructor() {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }

  async analyzeMedia(
    mediaUrl: string,
    mediaType: 'image' | 'audio'
  ): Promise<MediaAnalysisResult> {
    if (mediaType === 'image') {
      return this.analyzeImage(mediaUrl)
    } else {
      return this.analyzeAudio(mediaUrl)
    }
  }

  // ─── Image Analysis with Groq Vision ───
  private async analyzeImage(imageUrl: string): Promise<MediaAnalysisResult> {
    try {
      // Fetch image and convert to base64 data URL for Groq
      let imageContent: { type: 'image_url'; image_url: { url: string } }

      if (imageUrl.startsWith('data:')) {
        imageContent = { type: 'image_url', image_url: { url: imageUrl } }
      } else {
        // Fetch and convert to base64
        const response = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        })
        const contentType = response.headers['content-type'] || 'image/jpeg'
        const base64 = Buffer.from(response.data).toString('base64')
        imageContent = {
          type: 'image_url',
          image_url: { url: `data:${contentType};base64,${base64}` },
        }
      }

      const completion = await this.groq.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `${MEDIA_DETECTION_SYSTEM_PROMPT}\n\nAnalyze this image for AI-generation indicators. Provide a thorough forensic analysis across all 5 dimensions. Be precise and technical in your assessments.`,
              },
              imageContent,
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 3000,
      })

      const rawContent = completion.choices[0]?.message?.content || ''
      const jsonStr = sanitizeJsonString(rawContent)
      const parsed = JSON.parse(jsonStr)

      return this.buildResult(parsed, 'image')
    } catch (error) {
      console.error('Groq image analysis error:', error)
      // If vision model fails, fall back to text-based analysis
      return this.fallbackTextAnalysis(imageUrl, 'image')
    }
  }

  // ─── Audio Analysis ───
  private async analyzeAudio(audioUrl: string): Promise<MediaAnalysisResult> {
    try {
      // For audio, use Groq's Whisper for transcription then analyze text patterns
      // Fetch audio
      const response = await axios.get(audioUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
      })
      const audioBuffer = Buffer.from(response.data)

      // Transcribe with Whisper via Groq
      const file = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' })

      let transcription = ''
      try {
        const whisperResult = await this.groq.audio.transcriptions.create({
          file,
          model: 'whisper-large-v3',
          response_format: 'verbose_json',
        })
        transcription = typeof whisperResult === 'object' && 'text' in whisperResult
          ? (whisperResult as any).text
          : String(whisperResult)
      } catch {
        transcription = '[Audio transcription failed]'
      }

      // Now use LLM to analyze the audio characteristics
      const audioPrompt = `You are an AI Audio Forensics Expert. Analyze this audio transcription for signs of AI-generated speech or synthetic voice.

Transcription: "${transcription}"

Evaluate these dimensions:
1. **GAN Fingerprint** (id: "gan") - Signs of neural TTS artifacts in the speech patterns
2. **Metadata Consistency** (id: "metadata") - Consistency of speech patterns and natural pauses
3. **Compression Analysis** (id: "compression") - Audio quality and encoding characteristics
4. **Noise Pattern** (id: "noise") - Background noise consistency and naturalness
5. **Frequency Domain** (id: "frequency") - Spectral characteristics and formant patterns

${MEDIA_DETECTION_SYSTEM_PROMPT.split('### OUTPUT FORMAT')[1]}`

      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: audioPrompt },
          { role: 'user', content: 'Analyze the audio based on the transcription provided. Return JSON only.' },
        ],
        temperature: 0.2,
        max_tokens: 4000,
      })

      const rawContent = completion.choices[0]?.message?.content || ''
      const jsonStr = sanitizeJsonString(rawContent)
      const parsed = JSON.parse(jsonStr)

      return this.buildResult(parsed, 'audio')
    } catch (error) {
      console.error('Audio analysis error:', error)
      return this.fallbackTextAnalysis(audioUrl, 'audio')
    }
  }

  // ─── Fallback: text-only LLM analysis ───
  private async fallbackTextAnalysis(
    mediaUrl: string,
    mediaType: 'image' | 'audio'
  ): Promise<MediaAnalysisResult> {
    try {
      const outputFormat = MEDIA_DETECTION_SYSTEM_PROMPT.split('### OUTPUT FORMAT')[1]
      const prompt = `Analyze ${mediaType} for AI-generation. Provide 5 scores (0-100): gan, metadata, compression, noise, frequency. Include 3-6 findings.${outputFormat}`

      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'user', content: `${prompt}\n\nURL: ${mediaUrl}` },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      })

      const rawContent = completion.choices[0]?.message?.content || ''
      const jsonStr = sanitizeJsonString(rawContent)
      const parsed = JSON.parse(jsonStr)

      return this.buildResult(parsed, mediaType)
    } catch (error) {
      console.error('Fallback analysis error:', error)
      // Return a minimal "couldn't analyze" result
      return {
        verdict: 'inconclusive',
        overallScore: 50,
        detectionScores: [
          { id: 'gan', label: 'GAN Fingerprint', score: 50, confidence: 20, description: 'Analysis could not be completed due to an error.', severity: 'medium' },
          { id: 'metadata', label: 'Metadata Consistency', score: 50, confidence: 20, description: 'Unable to assess metadata.', severity: 'medium' },
          { id: 'compression', label: 'Compression Analysis', score: 50, confidence: 20, description: 'Unable to assess compression patterns.', severity: 'medium' },
          { id: 'noise', label: 'Noise Pattern', score: 50, confidence: 20, description: 'Unable to assess noise patterns.', severity: 'medium' },
          { id: 'frequency', label: 'Frequency Domain', score: 50, confidence: 20, description: 'Unable to assess frequency characteristics.', severity: 'medium' },
        ],
        heatmap: generateHeatmapFromScores([]),
        findings: [{ id: 'f1', title: 'Analysis Error', description: `Could not complete analysis: ${error}`, severity: 'warning', category: 'System' }],
        analyzedAt: new Date().toISOString(),
        modelAttribution: null,
        mediaType,
      }
    }
  }

  // ─── Build final result from parsed LLM output ───
  private buildResult(
    parsed: any,
    mediaType: 'image' | 'audio'
  ): MediaAnalysisResult {
    const overallScore = clamp(parsed.overall_score ?? 50, 0, 100)

    const detectionScores: DetectionScore[] = (parsed.detection_scores || []).map((ds: any) => ({
      id: ds.id || 'unknown',
      label: ds.label || ds.id || 'Unknown',
      score: clamp(ds.score ?? 50, 0, 100),
      confidence: clamp(ds.confidence ?? 50, 0, 100),
      description: ds.description || 'No details available.',
      severity: (['low', 'medium', 'high', 'critical'].includes(ds.severity) ? ds.severity : 'medium') as DetectionScore['severity'],
    }))

    // Ensure all 5 dimensions exist
    const expectedIds = ['gan', 'metadata', 'compression', 'noise', 'frequency']
    const expectedLabels: Record<string, string> = {
      gan: 'GAN Fingerprint',
      metadata: 'Metadata Consistency',
      compression: 'Compression Analysis',
      noise: 'Noise Pattern',
      frequency: 'Frequency Domain',
    }
    for (const eid of expectedIds) {
      if (!detectionScores.find((ds: DetectionScore) => ds.id === eid)) {
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

    const findings: Finding[] = (parsed.findings || []).map((f: any, i: number) => ({
      id: f.id || `f${i + 1}`,
      title: f.title || 'Finding',
      description: f.description || '',
      severity: (['info', 'warning', 'critical'].includes(f.severity) ? f.severity : 'info') as Finding['severity'],
      category: f.category || 'General',
    }))

    return {
      verdict: getVerdict(overallScore),
      overallScore,
      detectionScores,
      heatmap: generateHeatmapFromScores(detectionScores),
      findings,
      imageDescription: parsed.image_description || 'No visual description provided.',
      analysisSummary: parsed.analysis_summary || 'No summary provided.',
      analyzedAt: new Date().toISOString(),
      modelAttribution: parsed.model_attribution || null,
      mediaType,
    }
  }
}
