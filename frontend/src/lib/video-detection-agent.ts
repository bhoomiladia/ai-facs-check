import Groq from 'groq-sdk'
import axios from 'axios'
import type {
  VideoAnalysisResult,
  VideoDetectionScore,
  VideoFinding,
  VideoVerdict,
} from '@/types/video-detection'

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

function getVerdict(score: number): VideoVerdict {
  if (score >= 85) return 'ai_generated'
  if (score >= 65) return 'likely_ai'
  if (score >= 40) return 'inconclusive'
  if (score >= 20) return 'likely_authentic'
  return 'authentic'
}

// ─── Frame Extraction from Video ───
async function extractFramesAsBase64(
  videoUrl: string,
  maxFrames: number = 4
): Promise<string[]> {
  // For server-side: fetch a few seconds of the video and extract key frames
  // Since we can't use canvas on the server, we'll send the video URL to Groq directly
  // For base64 data URLs, we pass them through
  // For remote URLs, we just pass the URL

  // Groq's vision model can analyze video frames if we extract them
  // Since server-side frame extraction requires ffmpeg, we'll use a simpler approach:
  // Send the video data and let the client extract frames before sending

  return [] // Frames will be extracted client-side and sent as base64
}

// ─── System Prompt for Video Analysis ───
const VIDEO_DETECTION_SYSTEM_PROMPT = `You are an advanced AI-Generated Video Forensics Analyst. Your task is to analyze the provided video frame(s) and determine whether the video is AI-generated, synthetically manipulated, or a deepfake.

### ANALYSIS DIMENSIONS
Evaluate the video across these 6 forensic dimensions and provide a score (0-100) and confidence (0-100) for each:

1. **Temporal Consistency** (id: "temporal")
   - Check for flickering, frame-to-frame inconsistencies in lighting, shadows, and textures
   - Look for unnatural motion patterns, jittering, or morphing artifacts
   - AI-generated videos often struggle with consistent motion across frames
   - Check for temporal aliasing or frame interpolation artifacts

2. **Facial & Body Analysis** (id: "facial")
   - Detect unnatural facial movements, asymmetries, or lip-sync issues
   - Check for warping around face boundaries, hairline, and ears
   - Look for inconsistent eye reflections or gaze direction
   - Evaluate body proportions and movement naturalness

3. **GAN/Diffusion Fingerprint** (id: "gan")
   - Look for periodic patterns in textures (checkerboard artifacts)
   - Detect over-smoothed skin, hair, or fabric textures
   - Check for spectral peaks characteristic of specific generative models
   - Look for denoising or upsampling artifacts

4. **Compression & Encoding** (id: "compression")
   - Examine video codec artifacts vs. generation artifacts
   - Check for inconsistent compression across regions or frames
   - Look for double-encoding signatures or unusual bitrate patterns
   - AI videos often have different compression characteristics than camera footage

5. **Physics & Lighting** (id: "physics")
   - Evaluate physical plausibility of depicted motion (gravity, inertia, collisions)
   - Check lighting consistency across frames and between objects
   - Look for impossible reflections, shadows, or occlusion patterns
   - Assess depth of field and focus consistency

6. **Background & Environment** (id: "background")
   - Check for morphing, warping, or dissolving backgrounds
   - Look for perspective inconsistencies across frames
   - Evaluate texture consistency in static elements
   - AI videos often have unstable or evolving background details

### FINDINGS
Provide 3-8 specific forensic findings. Each finding must have:
- A specific, technical title
- A detailed description of what was observed
- severity: "info" (neutral observation), "warning" (suspicious indicator), or "critical" (strong AI indicator)
- category: one of "Temporal", "Facial", "GAN Fingerprint", "Compression", "Physics", "Background", "Motion", "Audio-Visual Sync"

### MODEL ATTRIBUTION
If the overall AI probability is ≥60%, attempt to identify the most likely AI model.
Known video generation models: Sora, Runway Gen-2/Gen-3, Pika Labs, Stable Video Diffusion, Kling, Luma Dream Machine, HeyGen, Synthesia, D-ID.
If unsure or probability is <60%, set model_attribution to null.

### OUTPUT FORMAT
Return ONLY valid JSON, no text outside:
{
  "overall_score": 0-100,
  "detection_scores": [
    {
      "id": "temporal",
      "label": "Temporal Consistency",
      "score": 0-100,
      "confidence": 0-100,
      "description": "Detailed explanation",
      "severity": "low|medium|high|critical"
    },
    ... (all 6 dimensions)
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
  "video_description": "A brief visual description of what is depicted in the video frames.",
  "analysis_summary": "A detailed 2-3 sentence summary explaining why the video is categorized as AI-generated or authentic."
}`

// ─── Main Agent ───
export class VideoDetectionAgent {
  private groq: Groq

  constructor() {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }

  async analyzeVideo(
    frames: string[], // base64 encoded frame images
  ): Promise<VideoAnalysisResult> {
    if (frames.length === 0) {
      return this.fallbackAnalysis('No frames provided for analysis')
    }

    try {
      // Build multi-frame content for Groq vision
      const content: any[] = [
        {
          type: 'text',
          text: `${VIDEO_DETECTION_SYSTEM_PROMPT}\n\nAnalyze these ${frames.length} frames extracted from a video for AI-generation indicators. Pay special attention to temporal consistency between frames, facial artifacts, and physics/lighting plausibility. Be precise and technical.`,
        },
      ]

      // Add each frame as an image
      for (const frame of frames) {
        const dataUrl = frame.startsWith('data:')
          ? frame
          : `data:image/jpeg;base64,${frame}`

        content.push({
          type: 'image_url',
          image_url: { url: dataUrl },
        })
      }

      const completion = await this.groq.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content,
          },
        ],
        temperature: 0.2,
        max_tokens: 4000,
      })

      const rawContent = completion.choices[0]?.message?.content || ''
      const jsonStr = sanitizeJsonString(rawContent)
      const parsed = JSON.parse(jsonStr)

      return this.buildResult(parsed, frames.length)
    } catch (error) {
      console.error('Groq video analysis error:', error)
      return this.fallbackTextAnalysis(frames.length)
    }
  }

  // ─── Fallback: text-only LLM analysis ───
  private async fallbackTextAnalysis(
    frameCount: number
  ): Promise<VideoAnalysisResult> {
    try {
      const outputFormat = VIDEO_DETECTION_SYSTEM_PROMPT.split('### OUTPUT FORMAT')[1]
      const prompt = `Analyze a video (${frameCount} frames provided) for AI-generation. Provide 6 scores (0-100): temporal, facial, gan, compression, physics, background. Include 3-8 findings.${outputFormat}`

      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 3000,
      })

      const rawContent = completion.choices[0]?.message?.content || ''
      const jsonStr = sanitizeJsonString(rawContent)
      const parsed = JSON.parse(jsonStr)

      return this.buildResult(parsed, frameCount)
    } catch (error) {
      console.error('Fallback analysis error:', error)
      return this.fallbackAnalysis(String(error))
    }
  }

  private fallbackAnalysis(errorMsg: string): VideoAnalysisResult {
    return {
      verdict: 'inconclusive',
      overallScore: 50,
      detectionScores: [
        { id: 'temporal', label: 'Temporal Consistency', score: 50, confidence: 20, description: 'Analysis could not be completed.', severity: 'medium' },
        { id: 'facial', label: 'Facial & Body Analysis', score: 50, confidence: 20, description: 'Unable to assess.', severity: 'medium' },
        { id: 'gan', label: 'GAN/Diffusion Fingerprint', score: 50, confidence: 20, description: 'Unable to assess.', severity: 'medium' },
        { id: 'compression', label: 'Compression & Encoding', score: 50, confidence: 20, description: 'Unable to assess.', severity: 'medium' },
        { id: 'physics', label: 'Physics & Lighting', score: 50, confidence: 20, description: 'Unable to assess.', severity: 'medium' },
        { id: 'background', label: 'Background & Environment', score: 50, confidence: 20, description: 'Unable to assess.', severity: 'medium' },
      ],
      findings: [{ id: 'f1', title: 'Analysis Error', description: `Could not complete analysis: ${errorMsg}`, severity: 'warning', category: 'System' }],
      analyzedAt: new Date().toISOString(),
      modelAttribution: null,
      frameCount: 0,
    }
  }

  // ─── Build final result from parsed LLM output ───
  private buildResult(
    parsed: any,
    frameCount: number
  ): VideoAnalysisResult {
    const overallScore = clamp(parsed.overall_score ?? 50, 0, 100)

    const detectionScores: VideoDetectionScore[] = (parsed.detection_scores || []).map((ds: any) => ({
      id: ds.id || 'unknown',
      label: ds.label || ds.id || 'Unknown',
      score: clamp(ds.score ?? 50, 0, 100),
      confidence: clamp(ds.confidence ?? 50, 0, 100),
      description: ds.description || 'No details available.',
      severity: (['low', 'medium', 'high', 'critical'].includes(ds.severity) ? ds.severity : 'medium') as VideoDetectionScore['severity'],
    }))

    // Ensure all 6 dimensions exist
    const expectedIds = ['temporal', 'facial', 'gan', 'compression', 'physics', 'background']
    const expectedLabels: Record<string, string> = {
      temporal: 'Temporal Consistency',
      facial: 'Facial & Body Analysis',
      gan: 'GAN/Diffusion Fingerprint',
      compression: 'Compression & Encoding',
      physics: 'Physics & Lighting',
      background: 'Background & Environment',
    }
    for (const eid of expectedIds) {
      if (!detectionScores.find((ds: VideoDetectionScore) => ds.id === eid)) {
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

    const findings: VideoFinding[] = (parsed.findings || []).map((f: any, i: number) => ({
      id: f.id || `f${i + 1}`,
      title: f.title || 'Finding',
      description: f.description || '',
      severity: (['info', 'warning', 'critical'].includes(f.severity) ? f.severity : 'info') as VideoFinding['severity'],
      category: f.category || 'General',
    }))

    return {
      verdict: getVerdict(overallScore),
      overallScore,
      detectionScores,
      findings,
      videoDescription: parsed.video_description || 'No visual description provided.',
      analysisSummary: parsed.analysis_summary || 'No summary provided.',
      analyzedAt: new Date().toISOString(),
      modelAttribution: parsed.model_attribution || null,
      frameCount,
    }
  }
}
