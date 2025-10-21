import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set')
}

// Initialize Gemini AI client
export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Model configuration
// Using Gemini 2.0 Flash Experimental - Available in January 2025
// Fallback if not working: 'gemini-1.5-flash-latest'
export const MODEL_NAME = 'gemini-2.0-flash-exp'

// Generation config
export const generationConfig = {
  temperature: 0.9, // Higher temperature for creative storytelling
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 1024, // Reasonable length for narrator responses
}

// Safety settings - allow creative content for D&D storytelling
export const safetySettings = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_ONLY_HIGH',
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_ONLY_HIGH',
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_ONLY_HIGH',
  },
]

// Get model instance
export function getModel() {
  return genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig,
    safetySettings: safetySettings as any,
  })
}

// Test Gemini connection
export async function testGeminiConnection(): Promise<boolean> {
  try {
    const model = getModel()
    const result = await model.generateContent('Hello! Respond with just "OK" if you can hear me.')
    const response = await result.response
    const text = response.text()

    console.log('✅ Gemini API connected successfully')
    console.log(`   Response: ${text.substring(0, 50)}...`)
    return true
  } catch (error) {
    console.error('❌ Gemini API connection failed:', error)
    return false
  }
}

// Retry logic for API calls
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      console.warn(`Retry ${i + 1}/${maxRetries} failed:`, error)

      if (i < maxRetries - 1) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
      }
    }
  }

  throw lastError
}
