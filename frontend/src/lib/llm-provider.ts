import { ChatGroq } from '@langchain/groq'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { HumanMessage, SystemMessage, BaseMessage } from '@langchain/core/messages'

export class LLMProvider {
  private primaryLLM: ChatGroq
  private fallbackLLM: ChatGoogleGenerativeAI

  constructor() {
    this.primaryLLM = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      maxTokens: 4000,
    })

    this.fallbackLLM = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      modelName: 'gemini-3-flash-preview',
      temperature: 0.1,
      maxOutputTokens: 4000,
    })
  }

  async invoke(messages: BaseMessage[]): Promise<BaseMessage> {
    try {
      console.log('Attempting to invoke Groq (Primary)...')
      const response = await this.primaryLLM.invoke(messages)
      return response
    } catch (error) {
      console.warn('Groq failed, falling back to Gemini:', error)
      try {
        const response = await this.fallbackLLM.invoke(messages)
        return response
      } catch (fallbackError) {
        console.error('All LLM providers failed:', fallbackError)
        throw fallbackError
      }
    }
  }

  getPrimary(): BaseChatModel {
    return this.primaryLLM
  }

  getFallback(): BaseChatModel {
    return this.fallbackLLM
  }
}

export const llmProvider = new LLMProvider()
