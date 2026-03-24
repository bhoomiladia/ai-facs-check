export interface AudioFile {
  name: string
  url: string
  size?: number
  mimeType?: string
  duration?: number
}

export interface AudioAnalysisStage {
  id: string
  label: string
  description: string
  status: 'pending' | 'running' | 'completed'
  progress: number
}

export interface AudioDetectionScore {
  id: string
  label: string
  score: number          // 0-100
  confidence: number     // 0-100
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface AudioFinding {
  id: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  category: string
}

export type AudioVerdict =
  | 'ai_generated'
  | 'likely_ai'
  | 'inconclusive'
  | 'likely_authentic'
  | 'authentic'

export interface AudioAnalysisResult {
  verdict: AudioVerdict
  overallScore: number    // 0-100 (probability of being AI-generated)
  detectionScores: AudioDetectionScore[]
  findings: AudioFinding[]
  transcription?: string
  audioDescription?: string
  analysisSummary?: string
  analyzedAt: string
  modelAttribution: string | null
}
