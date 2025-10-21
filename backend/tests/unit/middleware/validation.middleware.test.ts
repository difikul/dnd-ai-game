/**
 * Unit Tests - Validation Middleware
 * Testuje Zod schema validaci pro API endpointy
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { z, ZodError } from 'zod'
import { validateRequest, validateUUID } from '../../../src/middleware/validation.middleware'

describe('ValidationMiddleware - Request Validation', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction
  let jsonMock: ReturnType<typeof vi.fn>
  let statusMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    jsonMock = vi.fn()
    statusMock = vi.fn().mockReturnValue({ json: jsonMock })

    mockRequest = {
      body: {}
    }

    mockResponse = {
      status: statusMock,
      json: jsonMock
    }

    mockNext = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // validateRequest Tests
  // ============================================================================

  describe('validateRequest', () => {
    it('should call next() when validation passes', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      mockRequest.body = {
        name: 'John',
        age: 30
      }

      const middleware = validateRequest(schema)
      await middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalledOnce()
      expect(statusMock).not.toHaveBeenCalled()
    })

    it('should return 400 with error details when validation fails', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      mockRequest.body = {
        name: 'John',
        age: 'not a number' // Invalid
      }

      const middleware = validateRequest(schema)
      await middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Validační chyba',
        message: 'Neplatná data v požadavku',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'age',
            message: expect.any(String)
          })
        ])
      })
    })

    it('should validate nested object structures', async () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          email: z.string().email()
        })
      })

      mockRequest.body = {
        user: {
          name: 'John',
          email: 'invalid-email'
        }
      }

      const middleware = validateRequest(schema)
      await middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Validační chyba',
        message: 'Neplatná data v požadavku',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'user.email',
            message: expect.any(String)
          })
        ])
      })
    })

    it('should handle multiple validation errors', async () => {
      const schema = z.object({
        name: z.string().min(3),
        age: z.number().positive(),
        email: z.string().email()
      })

      mockRequest.body = {
        name: 'Jo', // Too short
        age: -5, // Negative
        email: 'not-an-email' // Invalid
      }

      const middleware = validateRequest(schema)
      await middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Validační chyba',
        message: 'Neplatná data v požadavku',
        errors: expect.arrayContaining([
          expect.objectContaining({ field: 'name' }),
          expect.objectContaining({ field: 'age' }),
          expect.objectContaining({ field: 'email' })
        ])
      })
    })

    it('should handle missing required fields', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      mockRequest.body = {
        name: 'John'
        // age is missing
      }

      const middleware = validateRequest(schema)
      await middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Validační chyba',
        message: 'Neplatná data v požadavku',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'age',
            message: expect.any(String)
          })
        ])
      })
    })

    it('should handle optional fields correctly', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().optional()
      })

      mockRequest.body = {
        name: 'John'
        // age is optional and missing
      }

      const middleware = validateRequest(schema)
      await middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalledOnce()
      expect(statusMock).not.toHaveBeenCalled()
    })

    it('should handle strict schemas rejecting extra fields', async () => {
      const schema = z.object({
        name: z.string()
      }).strict()

      mockRequest.body = {
        name: 'John',
        extraField: 'should fail'
      }

      const middleware = validateRequest(schema)
      await middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(400)
    })

    it('should handle empty body with required fields', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      mockRequest.body = {}

      const middleware = validateRequest(schema)
      await middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Validační chyba',
        message: 'Neplatná data v požadavku',
        errors: expect.arrayContaining([
          expect.objectContaining({ field: 'name' }),
          expect.objectContaining({ field: 'age' })
        ])
      })
    })

    it('should handle array validation', async () => {
      const schema = z.object({
        items: z.array(z.string()).min(1)
      })

      mockRequest.body = {
        items: []
      }

      const middleware = validateRequest(schema)
      await middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(400)
    })

    it('should handle enum validation', async () => {
      const schema = z.object({
        role: z.enum(['admin', 'user', 'guest'])
      })

      mockRequest.body = {
        role: 'invalid-role'
      }

      const middleware = validateRequest(schema)
      await middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Validační chyba',
        message: 'Neplatná data v požadavku',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'role',
            message: expect.any(String)
          })
        ])
      })
    })

    it('should return 500 on unexpected non-Zod error', async () => {
      const schema = z.object({
        name: z.string()
      })

      mockRequest.body = {
        name: 'John'
      }

      // Mock parseAsync to throw non-Zod error
      const middleware = validateRequest(schema)
      vi.spyOn(schema, 'parseAsync').mockRejectedValueOnce(new Error('Unexpected error'))

      await middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Interní chyba serveru',
        message: 'Nepodařilo se zpracovat požadavek'
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should handle custom error messages from schema', async () => {
      const schema = z.object({
        email: z.string().email('Zadejte platnou emailovou adresu')
      })

      mockRequest.body = {
        email: 'invalid'
      }

      const middleware = validateRequest(schema)
      await middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Validační chyba',
        message: 'Neplatná data v požadavku',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: 'Zadejte platnou emailovou adresu'
          })
        ])
      })
    })

    it('should transform data if schema has transformations', async () => {
      const schema = z.object({
        name: z.string().trim().toLowerCase()
      })

      mockRequest.body = {
        name: '  JOHN DOE  '
      }

      const middleware = validateRequest(schema)
      await middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalledOnce()
      expect(mockRequest.body.name).toBe('john doe')
    })
  })

  // ============================================================================
  // validateUUID Tests
  // ============================================================================

  describe('validateUUID', () => {
    beforeEach(() => {
      mockRequest.params = {}
    })

    it('should call next() for valid UUID', () => {
      mockRequest.params = {
        id: '123e4567-e89b-12d3-a456-426614174000'
      }

      const middleware = validateUUID()
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalledOnce()
      expect(statusMock).not.toHaveBeenCalled()
    })

    it('should return 400 for invalid UUID format', () => {
      mockRequest.params = {
        id: 'not-a-uuid'
      }

      const middleware = validateUUID()
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Neplatné ID',
        message: 'Parametr id musí být platné UUID'
      })
    })

    it('should validate custom parameter name', () => {
      mockRequest.params = {
        sessionId: 'invalid-uuid'
      }

      const middleware = validateUUID('sessionId')
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Neplatné ID',
        message: 'Parametr sessionId musí být platné UUID'
      })
    })

    it('should accept UUID with uppercase letters', () => {
      mockRequest.params = {
        id: '123E4567-E89B-12D3-A456-426614174000'
      }

      const middleware = validateUUID()
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalledOnce()
    })

    it('should reject UUID with wrong length', () => {
      mockRequest.params = {
        id: '123e4567-e89b-12d3-a456'
      }

      const middleware = validateUUID()
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(400)
    })

    it('should reject UUID with invalid characters', () => {
      mockRequest.params = {
        id: '123e4567-e89b-12d3-a456-42661417400g'
      }

      const middleware = validateUUID()
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(400)
    })

    it('should reject empty string', () => {
      mockRequest.params = {
        id: ''
      }

      const middleware = validateUUID()
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(400)
    })

    it('should reject null value', () => {
      mockRequest.params = {
        id: null as any
      }

      const middleware = validateUUID()
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(400)
    })

    it('should reject undefined value', () => {
      mockRequest.params = {
        id: undefined as any
      }

      const middleware = validateUUID()
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(400)
    })

    it('should accept different valid UUID formats', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '00000000-0000-0000-0000-000000000000'
      ]

      validUUIDs.forEach(uuid => {
        vi.clearAllMocks()
        mockRequest.params = { id: uuid }

        const middleware = validateUUID()
        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledOnce()
      })
    })

    it('should reject UUID-like strings with spaces', () => {
      mockRequest.params = {
        id: '123e4567-e89b-12d3-a456-426614174000 '
      }

      const middleware = validateUUID()
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(400)
    })

    it('should reject UUID without hyphens', () => {
      mockRequest.params = {
        id: '123e4567e89b12d3a456426614174000'
      }

      const middleware = validateUUID()
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(400)
    })
  })

  // ============================================================================
  // Edge Cases and Integration Tests
  // ============================================================================

  describe('ValidationMiddleware - Edge Cases', () => {
    it('should handle very large request body', async () => {
      const schema = z.object({
        content: z.string()
      })

      mockRequest.body = {
        content: 'a'.repeat(100000)
      }

      const middleware = validateRequest(schema)
      await middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalledOnce()
    })

    it('should handle deeply nested validation errors', async () => {
      const schema = z.object({
        level1: z.object({
          level2: z.object({
            level3: z.object({
              value: z.number()
            })
          })
        })
      })

      mockRequest.body = {
        level1: {
          level2: {
            level3: {
              value: 'not a number'
            }
          }
        }
      }

      const middleware = validateRequest(schema)
      await middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Validační chyba',
        message: 'Neplatná data v požadavku',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'level1.level2.level3.value',
            message: expect.any(String)
          })
        ])
      })
    })

    it('should handle complex character creation schema', async () => {
      const schema = z.object({
        name: z.string().min(1).max(50),
        race: z.enum(['Human', 'Elf', 'Dwarf']),
        class: z.enum(['Fighter', 'Wizard', 'Rogue']),
        level: z.number().int().min(1).max(20),
        strength: z.number().int().min(3).max(20),
        dexterity: z.number().int().min(3).max(20),
        constitution: z.number().int().min(3).max(20),
        intelligence: z.number().int().min(3).max(20),
        wisdom: z.number().int().min(3).max(20),
        charisma: z.number().int().min(3).max(20)
      })

      mockRequest.body = {
        name: 'Thorin',
        race: 'Dwarf',
        class: 'Fighter',
        level: 5,
        strength: 18,
        dexterity: 14,
        constitution: 16,
        intelligence: 10,
        wisdom: 12,
        charisma: 8
      }

      const middleware = validateRequest(schema)
      await middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalledOnce()
    })

    it('should handle validation with default values', async () => {
      const schema = z.object({
        name: z.string(),
        level: z.number().default(1)
      })

      mockRequest.body = {
        name: 'Test'
        // level is missing but has default
      }

      const middleware = validateRequest(schema)
      await middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalledOnce()
      expect(mockRequest.body.level).toBe(1)
    })
  })
})
