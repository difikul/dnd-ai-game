import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../services/authService'
import { JWTPayload } from '../types/auth.types'

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}

/**
 * Middleware to authenticate JWT token
 * Requires Authorization: Bearer <token> header
 */
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Chybí autentizační token',
      })
      return
    }

    // Verify token
    const payload = verifyToken(token)

    // Attach user to request
    req.user = payload

    next()
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Neplatný nebo expirovaný token',
    })
  }
}

/**
 * Middleware to require admin role
 * Must be used AFTER authenticateToken
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Vyžadována autentizace',
    })
    return
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Přístup pouze pro administrátory',
    })
    return
  }

  next()
}

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't fail if missing
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null

    if (token) {
      const payload = verifyToken(token)
      req.user = payload
    }
  } catch (error) {
    // Token invalid, but that's ok for optional auth
    // Just continue without user
  }

  next()
}
