export interface VerificationRequest {
  text?: string
  url?: string
}

export interface Claim {
  id: string
  text: string
  category?: string
}

export interface Evidence {
  title: string
  content: string
  url: string
  query: string
}

export type VerificationStatus = 'True' | 'False' | 'Partially True'

export interface VerifiedClaim {
  claim: Claim
  status: VerificationStatus
  confidence: number
  reasoning: string
  evidence: Evidence[]
  search_queries: string[]
}

export type ProcessingStage = 'Extracting' | 'Searching' | 'Verifying' | 'Completed'

export interface ProcessingUpdate {
  stage: ProcessingStage
  message: string
  progress: number
  claims_processed?: number
  total_claims?: number
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
  }
}

export interface ErrorResponse {
  error: string
  detail?: string
  request_id?: string
}