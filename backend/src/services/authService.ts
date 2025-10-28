import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { prisma } from '../config/database'
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  JWTPayload,
  SafeUser,
  toSafeUser,
} from '../types/auth.types'

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!
const ENCRYPTION_ALGORITHM = 'aes-256-cbc'

// Validate required environment variables
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables')
}
if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY is not defined in environment variables')
}

/**
 * Encrypt Gemini API key using AES-256-CBC
 */
export function encryptApiKey(apiKey: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(
    ENCRYPTION_ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  )

  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  // Return IV + encrypted data (IV needed for decryption)
  return iv.toString('hex') + ':' + encrypted
}

/**
 * Decrypt Gemini API key
 */
export function decryptApiKey(encryptedKey: string): string {
  const parts = encryptedKey.split(':')
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted key format')
  }

  const iv = Buffer.from(parts[0], 'hex')
  const encrypted = parts[1]

  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  )

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Hash password using bcrypt (12 salt rounds)
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate JWT token
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

/**
 * Register new user
 */
export async function register(
  data: RegisterRequest
): Promise<AuthResponse> {
  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: data.email }, { username: data.username }],
    },
  })

  if (existingUser) {
    if (existingUser.email === data.email) {
      throw new Error('Email je již registrován')
    }
    if (existingUser.username === data.username) {
      throw new Error('Uživatelské jméno je již použito')
    }
  }

  // Validate Gemini API key if provided (optional test call)
  // Note: We skip validation for now, users can test it when creating characters

  // Hash password
  const passwordHash = await hashPassword(data.password)

  // Encrypt API key if provided
  const geminiApiKey = data.geminiApiKey
    ? encryptApiKey(data.geminiApiKey)
    : null

  // Create user
  const user = await prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      passwordHash,
      geminiApiKey,
      role: 'user',
      isActive: true,
    },
  })

  // Generate JWT token
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  }
  const token = generateToken(payload)

  // Return response
  return {
    token,
    user: toSafeUser(user),
  }
}

/**
 * Login user
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  // Find user by email or username
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: data.emailOrUsername },
        { username: data.emailOrUsername },
      ],
    },
  })

  if (!user) {
    throw new Error('Nesprávné přihlašovací údaje')
  }

  // Check if user is active
  if (!user.isActive) {
    throw new Error('Účet byl deaktivován')
  }

  // Verify password
  const isValid = await verifyPassword(data.password, user.passwordHash)
  if (!isValid) {
    throw new Error('Nesprávné přihlašovací údaje')
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  // Generate JWT token
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  }
  const token = generateToken(payload)

  // Return response
  return {
    token,
    user: toSafeUser(user),
  }
}

/**
 * Get user's decrypted Gemini API key
 */
export async function getUserGeminiKey(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { geminiApiKey: true },
  })

  if (!user || !user.geminiApiKey) {
    return null
  }

  return decryptApiKey(user.geminiApiKey)
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<SafeUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    return null
  }

  return toSafeUser(user)
}

/**
 * Update user's Gemini API key
 */
export async function updateGeminiKey(
  userId: string,
  geminiApiKey: string
): Promise<SafeUser> {
  const encryptedKey = encryptApiKey(geminiApiKey)

  const user = await prisma.user.update({
    where: { id: userId },
    data: { geminiApiKey: encryptedKey },
  })

  return toSafeUser(user)
}
