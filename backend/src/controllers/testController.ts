import { Request, Response } from 'express'
import { geminiService } from '../services/geminiService'
import { testGeminiConnection, MODEL_NAME } from '../config/gemini'
import { testDatabaseConnection } from '../config/database'
import { TestNarratorRequest, TestNarratorResponse } from '../types/api.types'

/**
 * Test Gemini narrator endpoint
 */
export async function testNarrator(req: Request, res: Response) {
  try {
    const { prompt, characterName }: TestNarratorRequest = req.body

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing prompt in request body',
      })
    }

    console.log('📝 Testing narrator with prompt:', prompt.substring(0, 50) + '...')

    const response = await geminiService.testConnection(prompt)

    const result: TestNarratorResponse = {
      response,
      model: MODEL_NAME,
      timestamp: new Date().toISOString(),
    }

    res.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('❌ Test narrator error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate narrator response',
    })
  }
}

/**
 * Test all connections (DB + Gemini)
 */
export async function testConnections(req: Request, res: Response) {
  try {
    console.log('🧪 Testing all connections...')

    const [dbConnected, geminiConnected] = await Promise.all([
      testDatabaseConnection(),
      testGeminiConnection(),
    ])

    const results = {
      database: {
        connected: dbConnected,
        url: process.env.DATABASE_URL?.split('@')[1] || 'hidden',
      },
      gemini: {
        connected: geminiConnected,
        model: MODEL_NAME,
      },
      timestamp: new Date().toISOString(),
    }

    const allConnected = dbConnected && geminiConnected

    res.status(allConnected ? 200 : 503).json({
      success: allConnected,
      data: results,
      message: allConnected
        ? 'All services connected successfully'
        : 'Some services failed to connect',
    })
  } catch (error: any) {
    console.error('❌ Connection test error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Connection test failed',
    })
  }
}
