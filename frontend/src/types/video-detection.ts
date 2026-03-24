export interface VideoFile {
  name: string
  url: string
  size?: number
  mimeType?: string
  duration?: number
}

export interface VideoAnalysisStage {
  id: string
  label: string
  description: string
  status: 'pending' | 'running' | 'completed'
  progress: number
}

export interface VideoDetectionScore {
  id: string
  label: string
  score: number          // 0-100
  confidence: number     // 0-100
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface VideoFinding {
  id: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  category: string
}

export type VideoVerdict =
  | 'ai_generated'
  | 'likely_ai'
  | 'inconclusive'
  | 'likely_authentic'
  | 'authentic'

export interface VideoAnalysisResult {
  verdict: VideoVerdict
  overallScore: number    // 0-100 (probability of being AI-generated)
  detectionScores: VideoDetectionScore[]
  findings: VideoFinding[]
  videoDescription?: string
  analysisSummary?: string
  analyzedAt: string
  modelAttribution: string | null
  frameCount: number
}
