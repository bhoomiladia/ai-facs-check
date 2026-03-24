export interface VerificationRequest {
  text?: string
  url?: string
  imageUrl?: string
}

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

export type VerificationStatus = 'True' | 'False' | 'Partially True' | 'Outdated' | 'Disputed' | 'Insufficient Context'

export interface VerifiedClaim {
  claim: Claim
  status: VerificationStatus
  confidence: number
  reasoning: string
  correct_answer?: string
  temporal_note?: string
  conflicting_sources?: string[]
  evidence: Evidence[]
  search_queries: string[]
  sources_used: string[]
}

export type ProcessingStage = 'Extracting' | 'Searching' | 'Verifying' | 'Completed'

export interface ProcessingUpdate {
  stage: ProcessingStage
  message: string
  progress: number
  claims_processed?: number
  total_claims?: number
}

export interface ImageAnalysisResult {
  description: string
  extractedText?: string
  objects?: string[]
  context?: string
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

export interface AITextSignal {
  name: string
  description: string
  strength: number
  direction: 'ai' | 'human'
}

export interface SentenceAnalysis {
  text: string
  score: number
  flags: string[]
}

export interface AITextDetectionResult {
  overallScore: number
  verdict: 'Human Written' | 'Likely Human' | 'Mixed/Uncertain' | 'Likely AI' | 'AI Generated'
  confidence: number
  signals: AITextSignal[]
  analysis: string
  sentenceAnalysis: SentenceAnalysis[]
  processingTime: number
}

export interface ErrorResponse {
  error: string
  detail?: string
  request_id?: string
}