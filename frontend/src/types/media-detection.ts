export interface MediaFile {
  name: string
  type: 'image' | 'audio'
  url: string
  size?: number
  mimeType?: string
}

export interface AnalysisStage {
  id: string
  label: string
  description: string
  status: 'pending' | 'running' | 'completed'
  progress: number
}

export interface DetectionScore {
  id: string
  label: string
  score: number          // 0-100
  confidence: number     // 0-100
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface HeatmapCell {
  row: number
  col: number
  intensity: number      // 0-1
}

export interface Finding {
  id: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  category: string
}

export type Verdict =
  | 'ai_generated'
  | 'likely_ai'
  | 'inconclusive'
  | 'likely_authentic'
  | 'authentic'

export interface MediaAnalysisResult {
  verdict: Verdict
  overallScore: number    // 0-100 (probability of being AI-generated)
  detectionScores: DetectionScore[]
  heatmap: HeatmapCell[]
  findings: Finding[]
  imageDescription?: string
  analysisSummary?: string
  analyzedAt: string
  modelAttribution: string | null
  mediaType: 'image' | 'audio'
}
