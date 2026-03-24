import axios from 'axios'
import { GoogleGenerativeAI } from "@google/generative-ai"

export interface SearchResult {
  title: string
  content: string
  url: string
  source: string
  publishedDate?: string
  relevanceScore?: number
}

export interface ImageAnalysisResult {
  description: string
  extractedText?: string
  objects?: string[]
  context?: string
}

// 1. News API Toolkit
export class NewsAPIToolkit {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async searchNews(query: string, maxResults: number = 5, sortByDate: boolean = false): Promise<SearchResult[]> {
    try {
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: query,
          apiKey: this.apiKey,
          pageSize: maxResults,
          sortBy: sortByDate ? 'publishedAt' : 'relevancy',
          language: 'en'
        }
      })

      return response.data.articles?.map((article: any) => ({
        title: article.title || '',
        content: article.description || article.content || '',
        url: article.url || '',
        source: 'NewsAPI',
        publishedDate: article.publishedAt,
        relevanceScore: 0.8
      })) || []
    } catch (error) {
      console.error('NewsAPI search error:', error)
      return []
    }
  }
}

// 2. Composio Web Search
export class ComposioWebSearch {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async search(query: string, maxResults: number = 5): Promise<SearchResult[]> {
    try {
      // Note: This is a placeholder for Composio web search
      // You'll need to implement the actual Composio API calls
      const response = await axios.post('https://api.composio.dev/v1/search/web', {
        query,
        max_results: maxResults
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      return response.data.results?.map((result: any) => ({
        title: result.title || '',
        content: result.snippet || result.content || '',
        url: result.url || '',
        source: 'Composio',
        relevanceScore: result.score || 0.7
      })) || []
    } catch (error) {
      console.error('Composio search error:', error)
      return []
    }
  }
}

// 3. Exa Search for Citation Verification
export class ExaSearchToolkit {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async searchWithCitations(query: string, maxResults: number = 5): Promise<SearchResult[]> {
    try {
      const response = await axios.post('https://api.exa.ai/search', {
        query,
        num_results: maxResults,
        use_autoprompt: true
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      return response.data.results?.map((result: any) => ({
        title: result.title || '',
        content: result.text || result.snippet || '',
        url: result.url || '',
        source: 'Exa',
        publishedDate: result.published_date,
        relevanceScore: result.score || 0.9
      })) || []
    } catch (error) {
      console.error('Exa search error:', error)
      return []
    }
  }
}

// Image Analysis using Gemini Vision API
export class ImageAnalysisToolkit {
  private genAI: GoogleGenerativeAI

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey)
  }

  async analyzeImage(imageUrl: string): Promise<ImageAnalysisResult> {
    try {
      // Fetch image and convert to base64
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' })
      const base64Image = Buffer.from(imageResponse.data).toString('base64')

      const model = this.genAI.getGenerativeModel({ model: "gemini-3-flash-preview" })

      const prompt = "Analyze this image and provide a factual description. Follow these rules exactly: 1. Provide a single concise paragraph describing what you see. 2. Provide a second paragraph listing any factual claims, text, or information that can be fact-checked. 3. DO NOT use markdown formatting, bullet points, asterisks, or headings. Write in plain text only."

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: "image/jpeg" // Defaulting to jpeg, but ideally we'd detect from response
          }
        }
      ])

      const analysis = result.response.text()

      return {
        description: analysis,
        extractedText: this.extractTextFromAnalysis(analysis),
        objects: this.extractObjectsFromAnalysis(analysis),
        context: analysis
      }
    } catch (error) {
      console.error('Image analysis error:', error)
      return {
        description: 'Unable to analyze image',
        extractedText: '',
        objects: [],
        context: ''
      }
    }
  }

  private extractTextFromAnalysis(analysis: string): string {
    // Simple regex to extract quoted text or text mentions
    const textMatches = analysis.match(/"([^"]+)"/g)
    return textMatches?.join(' ') || ''
  }

  private extractObjectsFromAnalysis(analysis: string): string[] {
    // Simple extraction of mentioned objects/entities
    const words = analysis.toLowerCase().split(/\s+/)
    const commonObjects = ['person', 'people', 'building', 'car', 'text', 'sign', 'document', 'chart', 'graph']
    return commonObjects.filter(obj => words.includes(obj))
  }
}

// Composio Image Search
export class ComposioImageSearch {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async searchSimilarImages(imageUrl: string): Promise<SearchResult[]> {
    try {
      // Note: This is a placeholder for Composio image search
      const response = await axios.post('https://api.composio.dev/v1/search/image', {
        image_url: imageUrl,
        max_results: 5
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      return response.data.results?.map((result: any) => ({
        title: result.title || 'Similar Image',
        content: result.description || '',
        url: result.source_url || '',
        source: 'Composio Image Search',
        relevanceScore: result.similarity_score || 0.7
      })) || []
    } catch (error) {
      console.error('Composio image search error:', error)
      return []
    }
  }
}