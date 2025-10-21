/**
 * Character API Integration Tests
 * Testuje všechny /api/characters endpointy s REAL DATABASE
 * Cíl: 25+ testů, 90%+ coverage
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import app from '@/app'
import { prisma } from '@/config/database'

describe('Character API Integration', () => {
  let createdCharacterId: string

  // Před všemi testy: Připoj databázi
  beforeAll(async () => {
    await prisma.$connect()
  })

  // Po všech testech: Zavři connection
  afterAll(async () => {
    await prisma.$disconnect()
  })

  // Před každým testem: Vyčisti test data
  beforeEach(async () => {
    await prisma.message.deleteMany({})
    await prisma.gameSession.deleteMany({})
    await prisma.item.deleteMany({})
    await prisma.character.deleteMany({})
  })

  // ============================================================================
  // POST /api/characters - Create Character
  // ============================================================================

  describe('POST /api/characters', () => {
    it('should create a Wizard with correct HP and AC', async () => {
      const characterData = {
        name: 'Gandalf',
        race: 'Human',
        class: 'Wizard',
        level: 1,
        strength: 8,
        dexterity: 14,
        constitution: 10,
        intelligence: 18,
        wisdom: 12,
        charisma: 10,
        background: 'Sage',
        avatarUrl: 'https://example.com/wizard.png'
      }

      const response = await request(app)
        .post('/api/characters')
        .send(characterData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe('Gandalf')
      expect(response.body.data.class).toBe('Wizard')
      expect(response.body.data.hitPoints).toBe(6) // Wizard d6 + 0 CON mod
      expect(response.body.data.maxHitPoints).toBe(6)
      expect(response.body.data.armorClass).toBe(12) // 10 + 2 DEX mod
      expect(response.body.data.experience).toBe(0)

      createdCharacterId = response.body.data.id

      // Ověř v databázi
      const dbChar = await prisma.character.findUnique({ where: { id: createdCharacterId } })
      expect(dbChar).toBeTruthy()
      expect(dbChar!.name).toBe('Gandalf')
    })

    it('should create a Fighter with correct HP calculation', async () => {
      const characterData = {
        name: 'Aragorn',
        race: 'Human',
        class: 'Fighter',
        level: 1,
        strength: 16,
        dexterity: 14,
        constitution: 14,
        intelligence: 10,
        wisdom: 13,
        charisma: 11
      }

      const response = await request(app)
        .post('/api/characters')
        .send(characterData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.hitPoints).toBe(12) // Fighter d10 + 2 CON mod
      expect(response.body.data.maxHitPoints).toBe(12)
      expect(response.body.data.armorClass).toBe(12) // 10 + 2 DEX mod
    })

    it('should create a Barbarian with high HP', async () => {
      const characterData = {
        name: 'Gorak',
        race: 'Half-Orc',
        class: 'Barbarian',
        level: 1,
        strength: 18,
        dexterity: 12,
        constitution: 16,
        intelligence: 8,
        wisdom: 10,
        charisma: 8
      }

      const response = await request(app)
        .post('/api/characters')
        .send(characterData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.hitPoints).toBe(15) // Barbarian d12 + 3 CON mod
      expect(response.body.data.maxHitPoints).toBe(15)
    })

    it('should create a Rogue with high DEX and AC', async () => {
      const characterData = {
        name: 'Shadow',
        race: 'Elf',
        class: 'Rogue',
        level: 1,
        strength: 10,
        dexterity: 18,
        constitution: 12,
        intelligence: 14,
        wisdom: 13,
        charisma: 10
      }

      const response = await request(app)
        .post('/api/characters')
        .send(characterData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.hitPoints).toBe(9) // Rogue d8 + 1 CON mod
      expect(response.body.data.armorClass).toBe(14) // 10 + 4 DEX mod
    })

    it('should create character with all supported races', async () => {
      const races = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling']

      for (const race of races) {
        const response = await request(app)
          .post('/api/characters')
          .send({
            name: `Test ${race}`,
            race,
            class: 'Fighter',
            level: 1,
            strength: 14,
            dexterity: 14,
            constitution: 14,
            intelligence: 10,
            wisdom: 10,
            charisma: 10
          })
          .expect(201)

        expect(response.body.success).toBe(true)
        expect(response.body.data.race).toBe(race)
      }
    })

    it('should create character with all supported classes', async () => {
      const classes = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard']

      for (const charClass of classes) {
        const response = await request(app)
          .post('/api/characters')
          .send({
            name: `Test ${charClass}`,
            race: 'Human',
            class: charClass,
            level: 1,
            strength: 14,
            dexterity: 14,
            constitution: 14,
            intelligence: 10,
            wisdom: 10,
            charisma: 10
          })
          .expect(201)

        expect(response.body.success).toBe(true)
        expect(response.body.data.class).toBe(charClass)
      }
    })

    it('should return 400 for invalid ability score (too high)', async () => {
      const invalidData = {
        name: 'Invalid',
        race: 'Human',
        class: 'Fighter',
        level: 1,
        strength: 25, // Max is 20
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      }

      const response = await request(app)
        .post('/api/characters')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should return 400 for invalid ability score (too low)', async () => {
      const invalidData = {
        name: 'Invalid',
        race: 'Human',
        class: 'Fighter',
        level: 1,
        strength: 2, // Min is 3
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      }

      const response = await request(app)
        .post('/api/characters')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should return 400 for missing required field (name)', async () => {
      const invalidData = {
        race: 'Human',
        class: 'Fighter',
        level: 1,
        strength: 14,
        dexterity: 14,
        constitution: 14,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      }

      const response = await request(app)
        .post('/api/characters')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should return 400 for invalid race', async () => {
      const invalidData = {
        name: 'Test',
        race: 'Alien', // Invalid race
        class: 'Fighter',
        level: 1,
        strength: 14,
        dexterity: 14,
        constitution: 14,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      }

      const response = await request(app)
        .post('/api/characters')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should return 400 for invalid class', async () => {
      const invalidData = {
        name: 'Test',
        race: 'Human',
        class: 'Jedi', // Invalid class
        level: 1,
        strength: 14,
        dexterity: 14,
        constitution: 14,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      }

      const response = await request(app)
        .post('/api/characters')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should return 400 for invalid avatarUrl format', async () => {
      const invalidData = {
        name: 'Test',
        race: 'Human',
        class: 'Fighter',
        level: 1,
        strength: 14,
        dexterity: 14,
        constitution: 14,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        avatarUrl: 'not-a-url'
      }

      const response = await request(app)
        .post('/api/characters')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  // ============================================================================
  // GET /api/characters - List All Characters
  // ============================================================================

  describe('GET /api/characters', () => {
    it('should return empty array when no characters exist', async () => {
      const response = await request(app)
        .get('/api/characters')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual([])
      expect(response.body.count).toBe(0)
    })

    it('should return all characters', async () => {
      // Vytvoř 3 postavy
      await prisma.character.create({
        data: {
          name: 'Gandalf',
          race: 'Human',
          class: 'Wizard',
          level: 1,
          strength: 8,
          dexterity: 14,
          constitution: 10,
          intelligence: 18,
          wisdom: 12,
          charisma: 10,
          hitPoints: 6,
          maxHitPoints: 6,
          armorClass: 12
        }
      })

      await prisma.character.create({
        data: {
          name: 'Aragorn',
          race: 'Human',
          class: 'Ranger',
          level: 5,
          strength: 16,
          dexterity: 14,
          constitution: 14,
          intelligence: 10,
          wisdom: 13,
          charisma: 11,
          hitPoints: 45,
          maxHitPoints: 45,
          armorClass: 15
        }
      })

      const response = await request(app)
        .get('/api/characters')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.count).toBe(2)
    })
  })

  // ============================================================================
  // GET /api/characters/:id - Get Character by ID
  // ============================================================================

  describe('GET /api/characters/:id', () => {
    it('should return character with inventory', async () => {
      // Vytvoř testovací postavu s inventářem
      const char = await prisma.character.create({
        data: {
          name: 'Aragorn',
          race: 'Human',
          class: 'Ranger',
          level: 5,
          strength: 16,
          dexterity: 14,
          constitution: 14,
          intelligence: 10,
          wisdom: 13,
          charisma: 11,
          hitPoints: 45,
          maxHitPoints: 45,
          armorClass: 15,
          inventory: {
            create: [
              {
                name: 'Longsword',
                type: 'weapon',
                quantity: 1,
                equipped: true,
                damage: '1d8+3'
              },
              {
                name: 'Shortbow',
                type: 'weapon',
                quantity: 1,
                equipped: false,
                damage: '1d6+2'
              },
              {
                name: 'Arrows',
                type: 'misc',
                quantity: 20,
                equipped: false
              }
            ]
          }
        }
      })

      const response = await request(app)
        .get(`/api/characters/${char.id}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe('Aragorn')
      expect(response.body.data.inventory).toHaveLength(3)
    })

    it('should return 404 for non-existent character', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'

      const response = await request(app)
        .get(`/api/characters/${fakeId}`)
        .expect(404)

      expect(response.body.success).toBe(false)
    })

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/characters/not-a-uuid')
        .expect(400)
    })
  })

  // ============================================================================
  // PUT /api/characters/:id - Update Character
  // ============================================================================

  describe('PUT /api/characters/:id', () => {
    it('should update character name', async () => {
      const char = await prisma.character.create({
        data: {
          name: 'Test',
          race: 'Human',
          class: 'Fighter',
          level: 1,
          strength: 14,
          dexterity: 14,
          constitution: 14,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
          hitPoints: 12,
          maxHitPoints: 12,
          armorClass: 12
        }
      })

      const response = await request(app)
        .put(`/api/characters/${char.id}`)
        .send({ name: 'Updated Name' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe('Updated Name')

      // Ověř v DB
      const updated = await prisma.character.findUnique({ where: { id: char.id } })
      expect(updated!.name).toBe('Updated Name')
    })

    it('should update character level and recalculate max HP', async () => {
      const char = await prisma.character.create({
        data: {
          name: 'Test',
          race: 'Human',
          class: 'Fighter',
          level: 1,
          strength: 14,
          dexterity: 14,
          constitution: 14,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
          hitPoints: 12,
          maxHitPoints: 12,
          armorClass: 12
        }
      })

      const response = await request(app)
        .put(`/api/characters/${char.id}`)
        .send({ level: 5 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.level).toBe(5)
      expect(response.body.data.maxHitPoints).toBeGreaterThan(12)
    })

    it('should return 404 for non-existent character', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'

      const response = await request(app)
        .put(`/api/characters/${fakeId}`)
        .send({ name: 'Test' })
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  // ============================================================================
  // DELETE /api/characters/:id - Delete Character
  // ============================================================================

  describe('DELETE /api/characters/:id', () => {
    it('should delete character successfully', async () => {
      const char = await prisma.character.create({
        data: {
          name: 'ToDelete',
          race: 'Human',
          class: 'Fighter',
          level: 1,
          strength: 14,
          dexterity: 14,
          constitution: 14,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
          hitPoints: 12,
          maxHitPoints: 12,
          armorClass: 12
        }
      })

      const response = await request(app)
        .delete(`/api/characters/${char.id}`)
        .expect(200)

      expect(response.body.success).toBe(true)

      // Ověř že postava neexistuje
      const deleted = await prisma.character.findUnique({ where: { id: char.id } })
      expect(deleted).toBeNull()
    })

    it('should delete character and cascade delete inventory', async () => {
      const char = await prisma.character.create({
        data: {
          name: 'ToDelete',
          race: 'Human',
          class: 'Fighter',
          level: 1,
          strength: 14,
          dexterity: 14,
          constitution: 14,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
          hitPoints: 12,
          maxHitPoints: 12,
          armorClass: 12,
          inventory: {
            create: [
              { name: 'Sword', type: 'weapon', quantity: 1 }
            ]
          }
        }
      })

      await request(app)
        .delete(`/api/characters/${char.id}`)
        .expect(200)

      // Ověř že i inventory bylo smazáno
      const items = await prisma.item.findMany({ where: { characterId: char.id } })
      expect(items).toHaveLength(0)
    })

    it('should return 404 for non-existent character', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'

      const response = await request(app)
        .delete(`/api/characters/${fakeId}`)
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  // ============================================================================
  // POST /api/characters/:id/hp - Modify HP
  // ============================================================================

  describe('POST /api/characters/:id/hp', () => {
    it('should heal character (positive amount)', async () => {
      const char = await prisma.character.create({
        data: {
          name: 'Test',
          race: 'Human',
          class: 'Fighter',
          level: 1,
          strength: 14,
          dexterity: 14,
          constitution: 14,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
          hitPoints: 5,
          maxHitPoints: 12,
          armorClass: 12
        }
      })

      const response = await request(app)
        .post(`/api/characters/${char.id}/hp`)
        .send({ amount: 3 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.hitPoints).toBe(8)
    })

    it('should damage character (negative amount)', async () => {
      const char = await prisma.character.create({
        data: {
          name: 'Test',
          race: 'Human',
          class: 'Fighter',
          level: 1,
          strength: 14,
          dexterity: 14,
          constitution: 14,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
          hitPoints: 12,
          maxHitPoints: 12,
          armorClass: 12
        }
      })

      const response = await request(app)
        .post(`/api/characters/${char.id}/hp`)
        .send({ amount: -5 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.hitPoints).toBe(7)
    })

    it('should not exceed max HP when healing', async () => {
      const char = await prisma.character.create({
        data: {
          name: 'Test',
          race: 'Human',
          class: 'Fighter',
          level: 1,
          strength: 14,
          dexterity: 14,
          constitution: 14,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
          hitPoints: 10,
          maxHitPoints: 12,
          armorClass: 12
        }
      })

      const response = await request(app)
        .post(`/api/characters/${char.id}/hp`)
        .send({ amount: 10 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.hitPoints).toBe(12) // Capped at max
    })

    it('should not go below 0 HP when damaged', async () => {
      const char = await prisma.character.create({
        data: {
          name: 'Test',
          race: 'Human',
          class: 'Fighter',
          level: 1,
          strength: 14,
          dexterity: 14,
          constitution: 14,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
          hitPoints: 5,
          maxHitPoints: 12,
          armorClass: 12
        }
      })

      const response = await request(app)
        .post(`/api/characters/${char.id}/hp`)
        .send({ amount: -20 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.hitPoints).toBe(0) // Minimum 0
    })

    it('should return 400 for invalid amount (not a number)', async () => {
      const char = await prisma.character.create({
        data: {
          name: 'Test',
          race: 'Human',
          class: 'Fighter',
          level: 1,
          strength: 14,
          dexterity: 14,
          constitution: 14,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
          hitPoints: 12,
          maxHitPoints: 12,
          armorClass: 12
        }
      })

      const response = await request(app)
        .post(`/api/characters/${char.id}/hp`)
        .send({ amount: 'invalid' })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should return 404 for non-existent character', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'

      const response = await request(app)
        .post(`/api/characters/${fakeId}/hp`)
        .send({ amount: 5 })
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  // ============================================================================
  // POST /api/characters/:id/experience - Add Experience
  // ============================================================================

  describe('POST /api/characters/:id/experience', () => {
    it('should add experience to character', async () => {
      const char = await prisma.character.create({
        data: {
          name: 'Test',
          race: 'Human',
          class: 'Fighter',
          level: 1,
          strength: 14,
          dexterity: 14,
          constitution: 14,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
          hitPoints: 12,
          maxHitPoints: 12,
          armorClass: 12,
          experience: 0
        }
      })

      const response = await request(app)
        .post(`/api/characters/${char.id}/experience`)
        .send({ amount: 300 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.experience).toBe(300)
    })

    it('should return 400 for negative experience', async () => {
      const char = await prisma.character.create({
        data: {
          name: 'Test',
          race: 'Human',
          class: 'Fighter',
          level: 1,
          strength: 14,
          dexterity: 14,
          constitution: 14,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
          hitPoints: 12,
          maxHitPoints: 12,
          armorClass: 12,
          experience: 0
        }
      })

      const response = await request(app)
        .post(`/api/characters/${char.id}/experience`)
        .send({ amount: -100 })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should return 404 for non-existent character', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'

      const response = await request(app)
        .post(`/api/characters/${fakeId}/experience`)
        .send({ amount: 100 })
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })
})
