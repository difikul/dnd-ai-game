import { User } from '@prisma/client'

/**
 * Registration request payload
 */
export interface RegisterRequest {
  email: string
  username: string
  password: string
  geminiApiKey?: string // Optional - users can add it later
}

/**
 * Login request payload
 */
export interface LoginRequest {
  emailOrUsername: string // Can be email or username
  password: string
}

/**
 * Authentication response
 */
export interface AuthResponse {
  token: string
  user: SafeUser
}

/**
 * JWT token payload
 */
export interface JWTPayload {
  userId: string
  email: string
  role: string
  iat?: number // Issued at
  exp?: number // Expiration
}

/**
 * Safe user data (no sensitive fields)
 */
export interface SafeUser {
  id: string
  email: string
  username: string
  role: string
  hasGeminiKey: boolean // Indicates if user has API key configured
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Convert Prisma User to SafeUser (remove sensitive data)
 */
export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    hasGeminiKey: !!user.geminiApiKey,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

/**
 * Express Request extension with authenticated user
 */
export interface AuthenticatedRequest extends Express.Request {
  user?: JWTPayload
}
