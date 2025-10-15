/**
 * Validation Middleware - Zod schema validation pro API endpointy
 */

import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

/**
 * Generic validation middleware pro Zod schemas
 * Validuje request body proti danému schema
 */
export function validateRequest(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validuj request body
      req.body = await schema.parseAsync(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        // Formátuj Zod error do user-friendly zprávy
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))

        res.status(400).json({
          success: false,
          error: 'Validační chyba',
          message: 'Neplatná data v požadavku',
          errors
        })
        return
      }

      // Neočekávaná chyba
      console.error('Validační chyba:', error)
      res.status(500).json({
        success: false,
        error: 'Interní chyba serveru',
        message: 'Nepodařilo se zpracovat požadavek'
      })
    }
  }
}

/**
 * Middleware pro validaci UUID parametrů
 */
export function validateUUID(paramName: string = 'id') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName]

    // UUID regex pattern
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    if (!uuidPattern.test(id)) {
      res.status(400).json({
        success: false,
        error: 'Neplatné ID',
        message: `Parametr ${paramName} musí být platné UUID`
      })
      return
    }

    next()
  }
}
