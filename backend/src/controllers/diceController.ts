/**
 * Dice Controller
 * HTTP handlers pro dice rolling endpoints
 */

import { Request, Response } from 'express'
import { rollDice, rollWithAdvantage, rollWithDisadvantage, DiceRoll } from '../utils/dice'

/**
 * POST /api/dice/roll
 * Roll dice with optional advantage/disadvantage
 *
 * Request body:
 * {
 *   notation: string        // "1d20+5"
 *   advantage?: boolean     // Roll with advantage
 *   disadvantage?: boolean  // Roll with disadvantage
 *   type?: string           // "attack", "saving_throw", etc.
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     notation: "1d20+5",
 *     count: 1,
 *     sides: 20,
 *     modifier: 5,
 *     rolls: [13],
 *     total: 18,
 *     type?: "attack",
 *     advantage?: true,
 *     disadvantage?: false
 *   }
 * }
 */
export async function roll(req: Request, res: Response) {
  try {
    const { notation, advantage, disadvantage, type } = req.body

    // Validation
    if (!notation || typeof notation !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'notation is required and must be a string'
      })
    }

    // Cannot have both advantage AND disadvantage
    if (advantage && disadvantage) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Cannot roll with both advantage and disadvantage'
      })
    }

    let result: DiceRoll

    // Roll based on parameters
    if (advantage) {
      result = rollWithAdvantage(notation, type)
    } else if (disadvantage) {
      result = rollWithDisadvantage(notation, type)
    } else {
      result = rollDice(notation, type)
    }

    return res.status(200).json({
      success: true,
      data: result
    })

  } catch (error: any) {
    console.error('Dice roll error:', error)

    return res.status(400).json({
      success: false,
      error: 'Dice roll failed',
      message: error.message || 'Invalid dice notation'
    })
  }
}

/**
 * GET /api/dice/types
 * Get list of supported dice types
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     diceTypes: [4, 6, 8, 10, 12, 20, 100],
 *     examples: [
 *       {notation: "1d20+5", description: "Attack roll with +5 bonus"},
 *       {notation: "2d6", description: "Sword damage"},
 *       ...
 *     ]
 *   }
 * }
 */
export async function getDiceTypes(req: Request, res: Response) {
  return res.status(200).json({
    success: true,
    data: {
      diceTypes: [4, 6, 8, 10, 12, 20, 100],
      examples: [
        { notation: '1d20', description: 'Basic d20 roll (no modifier)' },
        { notation: '1d20+5', description: 'Attack roll with +5 bonus' },
        { notation: '2d6', description: 'Sword damage (2d6)' },
        { notation: '1d8+3', description: 'Longsword damage with STR modifier' },
        { notation: '4d6', description: 'Fireball damage' },
        { notation: '1d4+2', description: 'Dagger damage with DEX modifier' },
        { notation: '1d100', description: 'Percentile dice roll' },
      ],
      rollTypes: [
        'attack',
        'damage',
        'saving_throw',
        'skill_check',
        'initiative',
        'ability_check',
      ]
    }
  })
}

export const diceController = {
  roll,
  getDiceTypes
}
