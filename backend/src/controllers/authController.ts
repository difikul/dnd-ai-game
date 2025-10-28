import { Request, Response } from 'express'
import * as authService from '../services/authService'
import { RegisterRequest, LoginRequest } from '../types/auth.types'

/**
 * POST /api/auth/register
 * Register new user
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const data: RegisterRequest = req.body

    // Validate required fields
    if (!data.email || !data.username || !data.password) {
      res.status(400).json({
        success: false,
        message: 'Email, uživatelské jméno a heslo jsou povinné',
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      res.status(400).json({
        success: false,
        message: 'Neplatný formát emailu',
      })
      return
    }

    // Validate password strength
    if (data.password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Heslo musí mít alespoň 6 znaků',
      })
      return
    }

    // Register user
    const result = await authService.register(data)

    res.status(201).json({
      success: true,
      message: 'Registrace úspěšná',
      data: result,
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Chyba při registraci',
    })
  }
}

/**
 * POST /api/auth/login
 * Login user
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const data: LoginRequest = req.body

    // Validate required fields
    if (!data.emailOrUsername || !data.password) {
      res.status(400).json({
        success: false,
        message: 'Email/uživatelské jméno a heslo jsou povinné',
      })
      return
    }

    // Login user
    const result = await authService.login(data)

    res.json({
      success: true,
      message: 'Přihlášení úspěšné',
      data: result,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : 'Chyba při přihlášení',
    })
  }
}

/**
 * GET /api/auth/me
 * Get current user info (requires authentication)
 */
export async function getCurrentUser(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Vyžadována autentizace',
      })
      return
    }

    const user = await authService.getUserById(req.user.userId)

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Uživatel nenalezen',
      })
      return
    }

    res.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error('Get current user error:', error)
    res.status(500).json({
      success: false,
      message: 'Chyba při načítání uživatelských dat',
    })
  }
}

/**
 * PUT /api/auth/gemini-key
 * Update user's Gemini API key (requires authentication)
 */
export async function updateGeminiKey(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Vyžadována autentizace',
      })
      return
    }

    const { geminiApiKey } = req.body

    if (!geminiApiKey) {
      res.status(400).json({
        success: false,
        message: 'Gemini API klíč je povinný',
      })
      return
    }

    // Validate API key format (basic check)
    if (!geminiApiKey.startsWith('AIzaSy')) {
      res.status(400).json({
        success: false,
        message: 'Neplatný formát Gemini API klíče',
      })
      return
    }

    const user = await authService.updateGeminiKey(
      req.user.userId,
      geminiApiKey
    )

    res.json({
      success: true,
      message: 'Gemini API klíč byl úspěšně aktualizován',
      data: user,
    })
  } catch (error) {
    console.error('Update Gemini key error:', error)
    res.status(500).json({
      success: false,
      message: 'Chyba při aktualizaci API klíče',
    })
  }
}
