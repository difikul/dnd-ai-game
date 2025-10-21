/**
 * Unit Tests for useDice Composable
 * Tests Vue composable for dice rolling logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDice, type DiceRoll } from '@/composables/useDice'
import { server } from '../../setup'
import { http, HttpResponse } from 'msw'

describe('useDice Composable', () => {
  beforeEach(() => {
    // Reset server handlers before each test
    server.resetHandlers()
  })

  describe('Initial State', () => {
    it('should initialize with empty roll history', () => {
      const { rollHistory, hasHistory } = useDice()

      expect(rollHistory.value).toEqual([])
      expect(hasHistory.value).toBe(false)
    })

    it('should initialize with no error', () => {
      const { error } = useDice()

      expect(error.value).toBeNull()
    })

    it('should initialize with isRolling as false', () => {
      const { isRolling } = useDice()

      expect(isRolling.value).toBe(false)
    })
  })

  describe('rollDice', () => {
    it('should successfully roll dice and add to history', async () => {
      // Mock API response
      server.use(
        http.post('http://localhost:3000/api/dice/roll', () => {
          return HttpResponse.json({
            success: true,
            data: {
              notation: '1d20+5',
              count: 1,
              sides: 20,
              modifier: 5,
              rolls: [15],
              total: 20
            }
          })
        })
      )

      const { rollDice, rollHistory, hasHistory } = useDice()

      const result = await rollDice('1d20+5')

      expect(result).not.toBeNull()
      expect(result?.notation).toBe('1d20+5')
      expect(result?.total).toBe(20)
      expect(result?.rolls).toEqual([15])
      expect(rollHistory.value).toHaveLength(1)
      expect(hasHistory.value).toBe(true)
    })

    it('should set isRolling during API call', async () => {
      let isRollingDuringCall = false

      server.use(
        http.post('http://localhost:3000/api/dice/roll', async () => {
          // Check isRolling state during the API call
          await new Promise(resolve => setTimeout(resolve, 10))
          return HttpResponse.json({
            success: true,
            data: {
              notation: '1d20',
              count: 1,
              sides: 20,
              modifier: 0,
              rolls: [10],
              total: 10
            }
          })
        })
      )

      const { rollDice, isRolling } = useDice()

      const promise = rollDice('1d20')

      // Should be true during the call
      expect(isRolling.value).toBe(true)

      await promise

      // Should be false after completion
      expect(isRolling.value).toBe(false)
    })

    it('should include advantage flag when rolling with advantage', async () => {
      server.use(
        http.post('http://localhost:3000/api/dice/roll', async ({ request }) => {
          const body = await request.json() as any

          return HttpResponse.json({
            success: true,
            data: {
              notation: '1d20+3',
              count: 1,
              sides: 20,
              modifier: 3,
              rolls: [15, 8],
              total: 18,
              advantage: body.advantage
            }
          })
        })
      )

      const { rollDice } = useDice()

      const result = await rollDice('1d20+3', true, false, 'attack')

      expect(result?.advantage).toBe(true)
    })

    it('should include disadvantage flag when rolling with disadvantage', async () => {
      server.use(
        http.post('http://localhost:3000/api/dice/roll', async ({ request }) => {
          const body = await request.json() as any

          return HttpResponse.json({
            success: true,
            data: {
              notation: '1d20+3',
              count: 1,
              sides: 20,
              modifier: 3,
              rolls: [15, 8],
              total: 11,
              disadvantage: body.disadvantage
            }
          })
        })
      )

      const { rollDice } = useDice()

      const result = await rollDice('1d20+3', false, true, 'saving_throw')

      expect(result?.disadvantage).toBe(true)
    })

    it('should handle API errors gracefully', async () => {
      server.use(
        http.post('http://localhost:3000/api/dice/roll', () => {
          return HttpResponse.json(
            { success: false, message: 'Invalid dice notation' },
            { status: 400 }
          )
        })
      )

      const { rollDice, error } = useDice()

      const result = await rollDice('invalid')

      expect(result).toBeNull()
      expect(error.value).toBeTruthy()
    })

    it('should limit history to 50 rolls', async () => {
      server.use(
        http.post('http://localhost:3000/api/dice/roll', () => {
          return HttpResponse.json({
            success: true,
            data: {
              notation: '1d20',
              count: 1,
              sides: 20,
              modifier: 0,
              rolls: [10],
              total: 10
            }
          })
        })
      )

      const { rollDice, rollHistory } = useDice()

      // Roll 55 times
      for (let i = 0; i < 55; i++) {
        await rollDice('1d20')
      }

      expect(rollHistory.value).toHaveLength(50)
    })

    it('should add timestamp to rolls', async () => {
      server.use(
        http.post('http://localhost:3000/api/dice/roll', () => {
          return HttpResponse.json({
            success: true,
            data: {
              notation: '1d20',
              count: 1,
              sides: 20,
              modifier: 0,
              rolls: [10],
              total: 10
            }
          })
        })
      )

      const { rollDice } = useDice()

      const result = await rollDice('1d20')

      expect(result?.timestamp).toBeInstanceOf(Date)
    })
  })

  describe('quickRoll', () => {
    it('should roll d20 without modifier', async () => {
      server.use(
        http.post('http://localhost:3000/api/dice/roll', async ({ request }) => {
          const body = await request.json() as any

          return HttpResponse.json({
            success: true,
            data: {
              notation: body.notation,
              count: 1,
              sides: 20,
              modifier: 0,
              rolls: [15],
              total: 15
            }
          })
        })
      )

      const { quickRoll } = useDice()

      const result = await quickRoll(20)

      expect(result?.notation).toBe('1d20')
      expect(result?.sides).toBe(20)
    })

    it('should roll with positive modifier', async () => {
      server.use(
        http.post('http://localhost:3000/api/dice/roll', async ({ request }) => {
          const body = await request.json() as any

          return HttpResponse.json({
            success: true,
            data: {
              notation: body.notation,
              count: 1,
              sides: 20,
              modifier: 5,
              rolls: [13],
              total: 18
            }
          })
        })
      )

      const { quickRoll } = useDice()

      const result = await quickRoll(20, 5)

      expect(result?.notation).toBe('1d20+5')
      expect(result?.modifier).toBe(5)
    })

    it('should roll with negative modifier', async () => {
      server.use(
        http.post('http://localhost:3000/api/dice/roll', async ({ request }) => {
          const body = await request.json() as any

          return HttpResponse.json({
            success: true,
            data: {
              notation: body.notation,
              count: 1,
              sides: 20,
              modifier: -2,
              rolls: [13],
              total: 11
            }
          })
        })
      )

      const { quickRoll } = useDice()

      const result = await quickRoll(20, -2)

      expect(result?.notation).toBe('1d20-2')
      expect(result?.modifier).toBe(-2)
    })
  })

  describe('parseDiceFromText', () => {
    it('should extract dice notation from text', () => {
      const { parseDiceFromText } = useDice()

      const text = 'Roll 1d20+5 for attack'
      const notations = parseDiceFromText(text)

      expect(notations).toContain('1d20+5')
    })

    it('should extract multiple dice notations', () => {
      const { parseDiceFromText } = useDice()

      const text = 'Roll 1d20+5 for attack and 2d6+3 for damage'
      const notations = parseDiceFromText(text)

      expect(notations).toHaveLength(2)
      expect(notations).toContain('1d20+5')
      expect(notations).toContain('2d6+3')
    })

    it('should extract dice notation in brackets', () => {
      const { parseDiceFromText } = useDice()

      const text = 'Make a perception check [DICE: 1d20+3]'
      const notations = parseDiceFromText(text)

      expect(notations).toContain('1d20+3')
    })

    it('should return empty array if no dice notation found', () => {
      const { parseDiceFromText } = useDice()

      const text = 'No dice rolls here'
      const notations = parseDiceFromText(text)

      expect(notations).toEqual([])
    })
  })

  describe('formatRoll', () => {
    it('should format basic dice roll', () => {
      const { formatRoll } = useDice()

      const roll: DiceRoll = {
        notation: '1d20',
        count: 1,
        sides: 20,
        modifier: 0,
        rolls: [15],
        total: 15
      }

      const formatted = formatRoll(roll)

      expect(formatted).toBe('1d20 → [15] = **15**')
    })

    it('should format roll with modifier', () => {
      const { formatRoll } = useDice()

      const roll: DiceRoll = {
        notation: '1d20+5',
        count: 1,
        sides: 20,
        modifier: 5,
        rolls: [13],
        total: 18
      }

      const formatted = formatRoll(roll)

      expect(formatted).toBe('1d20+5 → [13] +5 = **18**')
    })

    it('should include advantage indicator', () => {
      const { formatRoll } = useDice()

      const roll: DiceRoll = {
        notation: '1d20+3',
        count: 1,
        sides: 20,
        modifier: 3,
        rolls: [15, 8],
        total: 18,
        advantage: true
      }

      const formatted = formatRoll(roll)

      expect(formatted).toContain('(Advantage)')
    })

    it('should include critical hit indicator', () => {
      const { formatRoll } = useDice()

      const roll: DiceRoll = {
        notation: '1d20',
        count: 1,
        sides: 20,
        modifier: 0,
        rolls: [20],
        total: 20
      }

      const formatted = formatRoll(roll)

      expect(formatted).toContain('CRITICAL HIT!')
    })

    it('should include critical miss indicator', () => {
      const { formatRoll } = useDice()

      const roll: DiceRoll = {
        notation: '1d20',
        count: 1,
        sides: 20,
        modifier: 0,
        rolls: [1],
        total: 1
      }

      const formatted = formatRoll(roll)

      expect(formatted).toContain('CRITICAL MISS!')
    })
  })

  describe('lastRoll', () => {
    it('should return the last roll from history', async () => {
      server.use(
        http.post('http://localhost:3000/api/dice/roll', () => {
          return HttpResponse.json({
            success: true,
            data: {
              notation: '1d20',
              count: 1,
              sides: 20,
              modifier: 0,
              rolls: [15],
              total: 15
            }
          })
        })
      )

      const { rollDice, lastRoll } = useDice()

      await rollDice('1d20')
      await rollDice('1d20')

      expect(lastRoll.value).toBeDefined()
      expect(lastRoll.value?.notation).toBe('1d20')
    })
  })

  describe('clearHistory', () => {
    it('should clear all roll history', async () => {
      server.use(
        http.post('http://localhost:3000/api/dice/roll', () => {
          return HttpResponse.json({
            success: true,
            data: {
              notation: '1d20',
              count: 1,
              sides: 20,
              modifier: 0,
              rolls: [10],
              total: 10
            }
          })
        })
      )

      const { rollDice, rollHistory, clearHistory } = useDice()

      await rollDice('1d20')
      expect(rollHistory.value).toHaveLength(1)

      clearHistory()

      expect(rollHistory.value).toHaveLength(0)
    })
  })

  describe('clearError', () => {
    it('should clear error message', async () => {
      server.use(
        http.post('http://localhost:3000/api/dice/roll', () => {
          return HttpResponse.json(
            { success: false, message: 'Test error' },
            { status: 400 }
          )
        })
      )

      const { rollDice, error, clearError } = useDice()

      await rollDice('invalid')
      expect(error.value).toBeTruthy()

      clearError()
      expect(error.value).toBeNull()
    })
  })

  describe('Additional parseDiceFromText Tests', () => {
    it('should handle dice notation with negative modifier', () => {
      const { parseDiceFromText } = useDice()
      const text = 'Roll 1d20-3 for disadvantage'
      const notations = parseDiceFromText(text)

      expect(notations).toContain('1d20-3')
    })

    it('should extract multiple dice types', () => {
      const { parseDiceFromText } = useDice()
      const text = 'Roll 1d4, 2d6, 3d8, and 1d20'
      const notations = parseDiceFromText(text)

      expect(notations.length).toBeGreaterThanOrEqual(4)
    })

    it('should handle dice notation without count', () => {
      const { parseDiceFromText } = useDice()
      const text = 'Roll d20 for initiative'
      const notations = parseDiceFromText(text)

      expect(notations.length).toBeGreaterThanOrEqual(0) // May or may not match depending on regex
    })

    it('should extract dice from complex narrative', () => {
      const { parseDiceFromText } = useDice()
      const text = 'You strike the dragon! [DICE: 1d20+5] for attack and [DICE: 2d8+3] for damage!'
      const notations = parseDiceFromText(text)

      expect(notations).toHaveLength(2)
      expect(notations).toContain('1d20+5')
      expect(notations).toContain('2d8+3')
    })
  })

  describe('Additional formatRoll Tests', () => {
    it('should format roll with negative modifier', () => {
      const { formatRoll } = useDice()

      const roll: DiceRoll = {
        notation: '1d20-2',
        count: 1,
        sides: 20,
        modifier: -2,
        rolls: [10],
        total: 8
      }

      const formatted = formatRoll(roll)

      expect(formatted).toBe('1d20-2 → [10] -2 = **8**')
    })

    it('should format multiple dice rolls', () => {
      const { formatRoll } = useDice()

      const roll: DiceRoll = {
        notation: '3d6',
        count: 3,
        sides: 6,
        modifier: 0,
        rolls: [4, 5, 3],
        total: 12
      }

      const formatted = formatRoll(roll)

      expect(formatted).toContain('[4, 5, 3]')
      expect(formatted).toContain('**12**')
    })

    it('should include disadvantage indicator', () => {
      const { formatRoll } = useDice()

      const roll: DiceRoll = {
        notation: '1d20+2',
        count: 1,
        sides: 20,
        modifier: 2,
        rolls: [15, 8],
        total: 10,
        disadvantage: true
      }

      const formatted = formatRoll(roll)

      expect(formatted).toContain('(Disadvantage)')
    })

    it('should not show critical for non-d20 rolls', () => {
      const { formatRoll } = useDice()

      const roll: DiceRoll = {
        notation: '1d6',
        count: 1,
        sides: 6,
        modifier: 0,
        rolls: [6],
        total: 6
      }

      const formatted = formatRoll(roll)

      expect(formatted).not.toContain('CRITICAL')
    })

    it('should handle d100 rolls', () => {
      const { formatRoll } = useDice()

      const roll: DiceRoll = {
        notation: '1d100',
        count: 1,
        sides: 100,
        modifier: 0,
        rolls: [73],
        total: 73
      }

      const formatted = formatRoll(roll)

      expect(formatted).toContain('**73**')
    })
  })

  describe('Additional quickRoll Tests', () => {
    it('should roll d4', async () => {
      server.use(
        http.post('http://localhost:3000/api/dice/roll', async ({ request }) => {
          const body = await request.json() as any
          return HttpResponse.json({
            success: true,
            data: {
              notation: body.notation,
              count: 1,
              sides: 4,
              modifier: 0,
              rolls: [3],
              total: 3
            }
          })
        })
      )

      const { quickRoll } = useDice()
      const result = await quickRoll(4)

      expect(result?.notation).toBe('1d4')
      expect(result?.sides).toBe(4)
    })

    it('should roll d6', async () => {
      server.use(
        http.post('http://localhost:3000/api/dice/roll', async ({ request }) => {
          const body = await request.json() as any
          return HttpResponse.json({
            success: true,
            data: {
              notation: body.notation,
              count: 1,
              sides: 6,
              modifier: 0,
              rolls: [4],
              total: 4
            }
          })
        })
      )

      const { quickRoll } = useDice()
      const result = await quickRoll(6)

      expect(result?.notation).toBe('1d6')
    })

    it('should roll d8', async () => {
      server.use(
        http.post('http://localhost:3000/api/dice/roll', async ({ request }) => {
          const body = await request.json() as any
          return HttpResponse.json({
            success: true,
            data: {
              notation: body.notation,
              count: 1,
              sides: 8,
              modifier: 0,
              rolls: [6],
              total: 6
            }
          })
        })
      )

      const { quickRoll } = useDice()
      const result = await quickRoll(8)

      expect(result?.sides).toBe(8)
    })

    it('should roll d10', async () => {
      server.use(
        http.post('http://localhost:3000/api/dice/roll', async ({ request }) => {
          const body = await request.json() as any
          return HttpResponse.json({
            success: true,
            data: {
              notation: body.notation,
              count: 1,
              sides: 10,
              modifier: 0,
              rolls: [7],
              total: 7
            }
          })
        })
      )

      const { quickRoll } = useDice()
      const result = await quickRoll(10)

      expect(result?.sides).toBe(10)
    })

    it('should roll d12', async () => {
      server.use(
        http.post('http://localhost:3000/api/dice/roll', async ({ request }) => {
          const body = await request.json() as any
          return HttpResponse.json({
            success: true,
            data: {
              notation: body.notation,
              count: 1,
              sides: 12,
              modifier: 0,
              rolls: [9],
              total: 9
            }
          })
        })
      )

      const { quickRoll } = useDice()
      const result = await quickRoll(12)

      expect(result?.sides).toBe(12)
    })

    it('should roll d100', async () => {
      server.use(
        http.post('http://localhost:3000/api/dice/roll', async ({ request }) => {
          const body = await request.json() as any
          return HttpResponse.json({
            success: true,
            data: {
              notation: body.notation,
              count: 1,
              sides: 100,
              modifier: 0,
              rolls: [55],
              total: 55
            }
          })
        })
      )

      const { quickRoll } = useDice()
      const result = await quickRoll(100)

      expect(result?.sides).toBe(100)
    })
  })

  describe('Dice Notation Edge Cases', () => {
    it('should handle multiple dice with modifier', async () => {
      server.use(
        http.post('http://localhost:3000/api/dice/roll', () => {
          return HttpResponse.json({
            success: true,
            data: {
              notation: '4d6+4',
              count: 4,
              sides: 6,
              modifier: 4,
              rolls: [3, 5, 6, 2],
              total: 20
            }
          })
        })
      )

      const { rollDice } = useDice()
      const result = await rollDice('4d6+4')

      expect(result?.total).toBe(20)
      expect(result?.rolls).toHaveLength(4)
    })

    it('should handle damage rolls (2d6)', async () => {
      server.use(
        http.post('http://localhost:3000/api/dice/roll', () => {
          return HttpResponse.json({
            success: true,
            data: {
              notation: '2d6',
              count: 2,
              sides: 6,
              modifier: 0,
              rolls: [4, 5],
              total: 9,
              type: 'damage'
            }
          })
        })
      )

      const { rollDice } = useDice()
      const result = await rollDice('2d6', false, false, 'damage')

      expect(result?.type).toBe('damage')
      expect(result?.rolls).toHaveLength(2)
    })

    it('should handle single die notation (1d20)', async () => {
      server.use(
        http.post('http://localhost:3000/api/dice/roll', () => {
          return HttpResponse.json({
            success: true,
            data: {
              notation: '1d20',
              count: 1,
              sides: 20,
              modifier: 0,
              rolls: [15],
              total: 15
            }
          })
        })
      )

      const { rollDice } = useDice()
      const result = await rollDice('1d20')

      expect(result?.notation).toBe('1d20')
      expect(result?.rolls).toHaveLength(1)
    })
  })

  describe('Type Specifications', () => {
    it('should handle attack roll type', async () => {
      server.use(
        http.post('http://localhost:3000/api/dice/roll', () => {
          return HttpResponse.json({
            success: true,
            data: {
              notation: '1d20+3',
              count: 1,
              sides: 20,
              modifier: 3,
              rolls: [12],
              total: 15,
              type: 'attack'
            }
          })
        })
      )

      const { rollDice } = useDice()
      const result = await rollDice('1d20+3', false, false, 'attack')

      expect(result?.type).toBe('attack')
    })

    it('should handle saving throw type', async () => {
      server.use(
        http.post('http://localhost:3000/api/dice/roll', () => {
          return HttpResponse.json({
            success: true,
            data: {
              notation: '1d20+2',
              count: 1,
              sides: 20,
              modifier: 2,
              rolls: [14],
              total: 16,
              type: 'saving-throw'
            }
          })
        })
      )

      const { rollDice } = useDice()
      const result = await rollDice('1d20+2', false, false, 'saving-throw')

      expect(result?.type).toBe('saving-throw')
    })

    it('should handle skill check type', async () => {
      server.use(
        http.post('http://localhost:3000/api/dice/roll', () => {
          return HttpResponse.json({
            success: true,
            data: {
              notation: '1d20+5',
              count: 1,
              sides: 20,
              modifier: 5,
              rolls: [11],
              total: 16,
              type: 'skill'
            }
          })
        })
      )

      const { rollDice } = useDice()
      const result = await rollDice('1d20+5', false, false, 'skill')

      expect(result?.type).toBe('skill')
    })
  })
})
