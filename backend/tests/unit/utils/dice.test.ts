/**
 * Unit Tests for Dice Utilities
 * Tests D&D dice rolling mechanics, notation parsing, and special rolls
 */

import { describe, it, expect, vi } from 'vitest'
import {
  parseDiceNotation,
  rollDice,
  rollWithAdvantage,
  rollWithDisadvantage,
  isCriticalHit,
  isCriticalMiss,
  formatDiceRoll,
  type DiceRoll
} from '@/utils/dice'

describe('Dice Utilities', () => {
  describe('parseDiceNotation', () => {
    it('should parse basic dice notation (1d20)', () => {
      const result = parseDiceNotation('1d20')

      expect(result.count).toBe(1)
      expect(result.sides).toBe(20)
      expect(result.modifier).toBe(0)
      expect(result.notation).toBe('1d20')
    })

    it('should parse dice notation with positive modifier (1d20+5)', () => {
      const result = parseDiceNotation('1d20+5')

      expect(result.count).toBe(1)
      expect(result.sides).toBe(20)
      expect(result.modifier).toBe(5)
      expect(result.notation).toBe('1d20+5')
    })

    it('should parse dice notation with negative modifier (2d6-1)', () => {
      const result = parseDiceNotation('2d6-1')

      expect(result.count).toBe(2)
      expect(result.sides).toBe(6)
      expect(result.modifier).toBe(-1)
      expect(result.notation).toBe('2d6-1')
    })

    it('should parse notation without count prefix (d20)', () => {
      const result = parseDiceNotation('d20')

      expect(result.count).toBe(1)
      expect(result.sides).toBe(20)
      expect(result.modifier).toBe(0)
    })

    it('should parse all valid dice types', () => {
      const validDice = [4, 6, 8, 10, 12, 20, 100]

      validDice.forEach(sides => {
        const result = parseDiceNotation(`1d${sides}`)
        expect(result.sides).toBe(sides)
      })
    })

    it('should throw error for invalid dice notation', () => {
      expect(() => parseDiceNotation('invalid')).toThrow('Invalid dice notation')
      expect(() => parseDiceNotation('2x6')).toThrow('Invalid dice notation')
      expect(() => parseDiceNotation('d')).toThrow('Invalid dice notation')
    })

    it('should throw error for invalid dice count', () => {
      expect(() => parseDiceNotation('0d20')).toThrow('Dice count must be between 1 and 100')
      expect(() => parseDiceNotation('101d20')).toThrow('Dice count must be between 1 and 100')
    })

    it('should throw error for unsupported dice type', () => {
      expect(() => parseDiceNotation('1d7')).toThrow('Invalid dice type')
      expect(() => parseDiceNotation('1d13')).toThrow('Invalid dice type')
    })

    it('should handle whitespace in notation', () => {
      const result = parseDiceNotation(' 1d20 + 5 ')

      expect(result.count).toBe(1)
      expect(result.sides).toBe(20)
      expect(result.modifier).toBe(5)
    })
  })

  describe('rollDice', () => {
    it('should return a complete dice roll result', () => {
      const result = rollDice('1d20+5')

      expect(result.notation).toBe('1d20+5')
      expect(result.count).toBe(1)
      expect(result.sides).toBe(20)
      expect(result.modifier).toBe(5)
      expect(result.rolls).toHaveLength(1)
      expect(result.rolls[0]).toBeGreaterThanOrEqual(1)
      expect(result.rolls[0]).toBeLessThanOrEqual(20)
      expect(result.total).toBe(result.rolls[0] + 5)
    })

    it('should roll multiple dice correctly (2d6)', () => {
      const result = rollDice('2d6')

      expect(result.count).toBe(2)
      expect(result.rolls).toHaveLength(2)

      result.rolls.forEach(roll => {
        expect(roll).toBeGreaterThanOrEqual(1)
        expect(roll).toBeLessThanOrEqual(6)
      })

      const expectedTotal = result.rolls[0] + result.rolls[1]
      expect(result.total).toBe(expectedTotal)
    })

    it('should include optional type field', () => {
      const result = rollDice('1d20+5', 'attack')

      expect(result.type).toBe('attack')
    })

    it('should respect negative modifiers', () => {
      const result = rollDice('1d20-2')

      expect(result.modifier).toBe(-2)
      expect(result.total).toBe(result.rolls[0] - 2)
    })

    it('should generate results within valid range', () => {
      // Run multiple times to check randomness
      for (let i = 0; i < 100; i++) {
        const result = rollDice('1d20')
        expect(result.total).toBeGreaterThanOrEqual(1)
        expect(result.total).toBeLessThanOrEqual(20)
      }
    })
  })

  describe('rollWithAdvantage', () => {
    it('should roll twice and return both rolls', () => {
      const result = rollWithAdvantage('1d20+5')

      expect(result.rolls).toHaveLength(2)
      expect(result.advantage).toBe(true)
    })

    it('should take the higher of two rolls', () => {
      // Mock Math.random to control rolls
      const mockRandom = vi.spyOn(Math, 'random')

      // First roll: 15, Second roll: 8
      mockRandom.mockReturnValueOnce(0.7)  // (0.7 * 20) + 1 = 15
      mockRandom.mockReturnValueOnce(0.35) // (0.35 * 20) + 1 = 8

      const result = rollWithAdvantage('1d20+5')

      expect(result.rolls).toEqual([15, 8])
      expect(result.total).toBe(15 + 5) // Higher roll (15) + modifier (5)

      mockRandom.mockRestore()
    })

    it('should throw error for multiple dice', () => {
      expect(() => rollWithAdvantage('2d20')).toThrow('Advantage/Disadvantage only works with single die')
    })

    it('should include advantage flag', () => {
      const result = rollWithAdvantage('1d20+3', 'attack')

      expect(result.advantage).toBe(true)
      expect(result.type).toBe('attack')
    })
  })

  describe('rollWithDisadvantage', () => {
    it('should roll twice and return both rolls', () => {
      const result = rollWithDisadvantage('1d20+5')

      expect(result.rolls).toHaveLength(2)
      expect(result.disadvantage).toBe(true)
    })

    it('should take the lower of two rolls', () => {
      const mockRandom = vi.spyOn(Math, 'random')

      // First roll: 15, Second roll: 8
      mockRandom.mockReturnValueOnce(0.7)  // 15
      mockRandom.mockReturnValueOnce(0.35) // 8

      const result = rollWithDisadvantage('1d20+5')

      expect(result.rolls).toEqual([15, 8])
      expect(result.total).toBe(8 + 5) // Lower roll (8) + modifier (5)

      mockRandom.mockRestore()
    })

    it('should throw error for multiple dice', () => {
      expect(() => rollWithDisadvantage('2d20')).toThrow('Advantage/Disadvantage only works with single die')
    })

    it('should include disadvantage flag', () => {
      const result = rollWithDisadvantage('1d20-1', 'saving_throw')

      expect(result.disadvantage).toBe(true)
      expect(result.type).toBe('saving_throw')
    })
  })

  describe('isCriticalHit', () => {
    it('should return true for natural 20', () => {
      const roll: DiceRoll = {
        notation: '1d20',
        count: 1,
        sides: 20,
        modifier: 0,
        rolls: [20],
        total: 20
      }

      expect(isCriticalHit(roll)).toBe(true)
    })

    it('should return false for non-20 roll', () => {
      const roll: DiceRoll = {
        notation: '1d20',
        count: 1,
        sides: 20,
        modifier: 0,
        rolls: [19],
        total: 19
      }

      expect(isCriticalHit(roll)).toBe(false)
    })

    it('should return true for advantage with one 20', () => {
      const roll: DiceRoll = {
        notation: '1d20',
        count: 1,
        sides: 20,
        modifier: 0,
        rolls: [20, 15],
        total: 20,
        advantage: true
      }

      expect(isCriticalHit(roll)).toBe(true)
    })

    it('should return false for non-d20 rolls', () => {
      const roll: DiceRoll = {
        notation: '1d6',
        count: 1,
        sides: 6,
        modifier: 0,
        rolls: [6],
        total: 6
      }

      expect(isCriticalHit(roll)).toBe(false)
    })
  })

  describe('isCriticalMiss', () => {
    it('should return true for natural 1', () => {
      const roll: DiceRoll = {
        notation: '1d20',
        count: 1,
        sides: 20,
        modifier: 0,
        rolls: [1],
        total: 1
      }

      expect(isCriticalMiss(roll)).toBe(true)
    })

    it('should return false for non-1 roll', () => {
      const roll: DiceRoll = {
        notation: '1d20',
        count: 1,
        sides: 20,
        modifier: 0,
        rolls: [2],
        total: 2
      }

      expect(isCriticalMiss(roll)).toBe(false)
    })

    it('should return true only if both rolls are 1 (advantage/disadvantage)', () => {
      const rollBoth1: DiceRoll = {
        notation: '1d20',
        count: 1,
        sides: 20,
        modifier: 0,
        rolls: [1, 1],
        total: 1,
        disadvantage: true
      }

      expect(isCriticalMiss(rollBoth1)).toBe(true)

      const rollOne1: DiceRoll = {
        notation: '1d20',
        count: 1,
        sides: 20,
        modifier: 0,
        rolls: [1, 15],
        total: 15,
        advantage: true
      }

      expect(isCriticalMiss(rollOne1)).toBe(false)
    })
  })

  describe('formatDiceRoll', () => {
    it('should format basic dice roll', () => {
      const roll: DiceRoll = {
        notation: '1d20',
        count: 1,
        sides: 20,
        modifier: 0,
        rolls: [15],
        total: 15
      }

      const formatted = formatDiceRoll(roll)
      expect(formatted).toBe('1d20 → [15] = 15')
    })

    it('should format dice roll with positive modifier', () => {
      const roll: DiceRoll = {
        notation: '1d20+5',
        count: 1,
        sides: 20,
        modifier: 5,
        rolls: [13],
        total: 18
      }

      const formatted = formatDiceRoll(roll)
      expect(formatted).toBe('1d20+5 → [13] +5 = 18')
    })

    it('should format dice roll with negative modifier', () => {
      const roll: DiceRoll = {
        notation: '1d20-2',
        count: 1,
        sides: 20,
        modifier: -2,
        rolls: [13],
        total: 11
      }

      const formatted = formatDiceRoll(roll)
      expect(formatted).toBe('1d20-2 → [13] -2 = 11')
    })

    it('should include advantage indicator', () => {
      const roll: DiceRoll = {
        notation: '1d20+3',
        count: 1,
        sides: 20,
        modifier: 3,
        rolls: [15, 8],
        total: 18,
        advantage: true
      }

      const formatted = formatDiceRoll(roll)
      expect(formatted).toContain('(Advantage)')
    })

    it('should include disadvantage indicator', () => {
      const roll: DiceRoll = {
        notation: '1d20+3',
        count: 1,
        sides: 20,
        modifier: 3,
        rolls: [15, 8],
        total: 11,
        disadvantage: true
      }

      const formatted = formatDiceRoll(roll)
      expect(formatted).toContain('(Disadvantage)')
    })

    it('should include critical hit indicator', () => {
      const roll: DiceRoll = {
        notation: '1d20',
        count: 1,
        sides: 20,
        modifier: 0,
        rolls: [20],
        total: 20
      }

      const formatted = formatDiceRoll(roll)
      expect(formatted).toContain('CRITICAL HIT!')
    })

    it('should include critical miss indicator', () => {
      const roll: DiceRoll = {
        notation: '1d20',
        count: 1,
        sides: 20,
        modifier: 0,
        rolls: [1],
        total: 1
      }

      const formatted = formatDiceRoll(roll)
      expect(formatted).toContain('CRITICAL MISS!')
    })

    it('should format multiple dice rolls', () => {
      const roll: DiceRoll = {
        notation: '2d6+3',
        count: 2,
        sides: 6,
        modifier: 3,
        rolls: [4, 5],
        total: 12
      }

      const formatted = formatDiceRoll(roll)
      expect(formatted).toBe('2d6+3 → [4, 5] +3 = 12')
    })
  })
})
