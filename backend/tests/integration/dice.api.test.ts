/**
 * Dice API Integration Tests
 * Testuje všechny /api/dice endpointy
 * Cíl: 15+ testů, 95%+ coverage
 */

import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '@/app'

describe('Dice API Integration', () => {
  // ============================================================================
  // POST /api/dice/roll - Roll Dice
  // ============================================================================

  describe('POST /api/dice/roll', () => {
    it('should roll d20 successfully', async () => {
      const response = await request(app)
        .post('/api/dice/roll')
        .send({ notation: '1d20' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.notation).toBe('1d20')
      expect(response.body.data.count).toBe(1)
      expect(response.body.data.sides).toBe(20)
      expect(response.body.data.modifier).toBe(0)
      expect(response.body.data.rolls).toHaveLength(1)
      expect(response.body.data.rolls[0]).toBeGreaterThanOrEqual(1)
      expect(response.body.data.rolls[0]).toBeLessThanOrEqual(20)
      expect(response.body.data.total).toBe(response.body.data.rolls[0])
    })

    it('should roll d20 with positive modifier', async () => {
      const response = await request(app)
        .post('/api/dice/roll')
        .send({ notation: '1d20+5' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.modifier).toBe(5)
      expect(response.body.data.total).toBe(response.body.data.rolls[0] + 5)
    })

    it('should roll d20 with negative modifier', async () => {
      const response = await request(app)
        .post('/api/dice/roll')
        .send({ notation: '1d20-2' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.modifier).toBe(-2)
      expect(response.body.data.total).toBe(response.body.data.rolls[0] - 2)
    })

    it('should roll multiple d6 (damage roll)', async () => {
      const response = await request(app)
        .post('/api/dice/roll')
        .send({ notation: '2d6' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.count).toBe(2)
      expect(response.body.data.sides).toBe(6)
      expect(response.body.data.rolls).toHaveLength(2)
      expect(response.body.data.total).toBe(
        response.body.data.rolls[0] + response.body.data.rolls[1]
      )
    })

    it('should roll all supported dice types', async () => {
      const diceTypes = [4, 6, 8, 10, 12, 20, 100]

      for (const sides of diceTypes) {
        const response = await request(app)
          .post('/api/dice/roll')
          .send({ notation: `1d${sides}` })
          .expect(200)

        expect(response.body.success).toBe(true)
        expect(response.body.data.sides).toBe(sides)
        expect(response.body.data.rolls[0]).toBeGreaterThanOrEqual(1)
        expect(response.body.data.rolls[0]).toBeLessThanOrEqual(sides)
      }
    })

    it('should roll with advantage', async () => {
      const response = await request(app)
        .post('/api/dice/roll')
        .send({
          notation: '1d20+3',
          advantage: true
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.advantage).toBe(true)
      expect(response.body.data.rolls).toHaveLength(2) // Two rolls
      expect(response.body.data.total).toBe(
        Math.max(response.body.data.rolls[0], response.body.data.rolls[1]) + 3
      )
    })

    it('should roll with disadvantage', async () => {
      const response = await request(app)
        .post('/api/dice/roll')
        .send({
          notation: '1d20+3',
          disadvantage: true
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.disadvantage).toBe(true)
      expect(response.body.data.rolls).toHaveLength(2) // Two rolls
      expect(response.body.data.total).toBe(
        Math.min(response.body.data.rolls[0], response.body.data.rolls[1]) + 3
      )
    })

    it('should include roll type when specified', async () => {
      const response = await request(app)
        .post('/api/dice/roll')
        .send({
          notation: '1d20+5',
          type: 'attack'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.type).toBe('attack')
    })

    it('should return 400 for both advantage and disadvantage', async () => {
      const response = await request(app)
        .post('/api/dice/roll')
        .send({
          notation: '1d20',
          advantage: true,
          disadvantage: true
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Cannot roll with both')
    })

    it('should return 400 for missing notation', async () => {
      const response = await request(app)
        .post('/api/dice/roll')
        .send({})
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeTruthy()
    })

    it('should return 400 for invalid notation format', async () => {
      const response = await request(app)
        .post('/api/dice/roll')
        .send({ notation: 'invalid' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeTruthy()
    })

    it('should return 400 for unsupported dice type', async () => {
      const response = await request(app)
        .post('/api/dice/roll')
        .send({ notation: '1d7' }) // d7 není podporován
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeTruthy()
    })

    it('should return 400 for advantage with multiple dice', async () => {
      const response = await request(app)
        .post('/api/dice/roll')
        .send({
          notation: '2d6',
          advantage: true
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeTruthy()
    })

    it('should handle notation without count (defaults to 1)', async () => {
      const response = await request(app)
        .post('/api/dice/roll')
        .send({ notation: 'd20' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.count).toBe(1)
      expect(response.body.data.sides).toBe(20)
    })

    it('should handle large dice counts', async () => {
      const response = await request(app)
        .post('/api/dice/roll')
        .send({ notation: '10d6' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.count).toBe(10)
      expect(response.body.data.rolls).toHaveLength(10)
    })

    it('should return 400 for dice count exceeding limit', async () => {
      const response = await request(app)
        .post('/api/dice/roll')
        .send({ notation: '101d6' }) // Max je 100
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeTruthy()
    })

    it('should handle complex notation (4d6+3)', async () => {
      const response = await request(app)
        .post('/api/dice/roll')
        .send({ notation: '4d6+3' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.count).toBe(4)
      expect(response.body.data.sides).toBe(6)
      expect(response.body.data.modifier).toBe(3)
      expect(response.body.data.rolls).toHaveLength(4)

      const rollSum = response.body.data.rolls.reduce((a: number, b: number) => a + b, 0)
      expect(response.body.data.total).toBe(rollSum + 3)
    })

    it('should handle percentile dice (d100)', async () => {
      const response = await request(app)
        .post('/api/dice/roll')
        .send({ notation: '1d100' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.sides).toBe(100)
      expect(response.body.data.rolls[0]).toBeGreaterThanOrEqual(1)
      expect(response.body.data.rolls[0]).toBeLessThanOrEqual(100)
    })

    it('should validate all rolls are within range', async () => {
      const response = await request(app)
        .post('/api/dice/roll')
        .send({ notation: '5d8+2' })
        .expect(200)

      response.body.data.rolls.forEach((roll: number) => {
        expect(roll).toBeGreaterThanOrEqual(1)
        expect(roll).toBeLessThanOrEqual(8)
      })
    })
  })

  // ============================================================================
  // GET /api/dice/types - Get Supported Dice Types
  // ============================================================================

  describe('GET /api/dice/types', () => {
    it('should return list of supported dice types', async () => {
      const response = await request(app)
        .get('/api/dice/types')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.diceTypes).toEqual([4, 6, 8, 10, 12, 20, 100])
    })

    it('should return dice notation examples', async () => {
      const response = await request(app)
        .get('/api/dice/types')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.examples).toBeInstanceOf(Array)
      expect(response.body.data.examples.length).toBeGreaterThan(0)

      response.body.data.examples.forEach((example: any) => {
        expect(example).toHaveProperty('notation')
        expect(example).toHaveProperty('description')
      })
    })

    it('should return list of roll types', async () => {
      const response = await request(app)
        .get('/api/dice/types')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.rollTypes).toBeInstanceOf(Array)
      expect(response.body.data.rollTypes).toContain('attack')
      expect(response.body.data.rollTypes).toContain('damage')
      expect(response.body.data.rollTypes).toContain('saving_throw')
    })
  })
})
