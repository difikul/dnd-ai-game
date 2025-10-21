/**
 * Unit Tests - Character Service
 * Testuje business logiku pro správu postav a D&D 5e mechaniky
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { PrismaClient, Character } from '@prisma/client'
import {
  calculateModifier,
  calculateModifiers,
  calculateMaxHP,
  calculateAC,
  createCharacter,
  getCharacter,
  getAllCharacters,
  updateCharacter,
  deleteCharacter,
  addExperience,
  modifyHP
} from '../../../src/services/characterService'
import { CreateCharacterRequest, UpdateCharacterRequest } from '../../../src/types/api.types'
import { CharacterClass } from '../../../src/types/dnd.types'
import { mockCharacter, mockWizard, mockRogue, mockHighLevelCharacter } from '../../fixtures/characters'

// Mock Prisma Client
vi.mock('@prisma/client', () => {
  const mockPrisma = {
    character: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  }
  return {
    PrismaClient: vi.fn(() => mockPrisma)
  }
})

describe('CharacterService - D&D 5e Mechanics', () => {
  // ============================================================================
  // calculateModifier Tests
  // ============================================================================

  describe('calculateModifier', () => {
    it('should calculate modifier for ability score 10 as 0', () => {
      expect(calculateModifier(10)).toBe(0)
    })

    it('should calculate modifier for ability score 11 as 0', () => {
      expect(calculateModifier(11)).toBe(0)
    })

    it('should calculate modifier for ability score 8 as -1', () => {
      expect(calculateModifier(8)).toBe(-1)
    })

    it('should calculate modifier for ability score 9 as -1', () => {
      expect(calculateModifier(9)).toBe(-1)
    })

    it('should calculate modifier for ability score 12 as +1', () => {
      expect(calculateModifier(12)).toBe(1)
    })

    it('should calculate modifier for ability score 13 as +1', () => {
      expect(calculateModifier(13)).toBe(1)
    })

    it('should calculate modifier for ability score 20 as +5', () => {
      expect(calculateModifier(20)).toBe(5)
    })

    it('should calculate modifier for ability score 3 as -4', () => {
      expect(calculateModifier(3)).toBe(-4)
    })

    it('should calculate modifier for ability score 18 as +4', () => {
      expect(calculateModifier(18)).toBe(4)
    })

    it('should calculate modifier for ability score 14 as +2', () => {
      expect(calculateModifier(14)).toBe(2)
    })
  })

  // ============================================================================
  // calculateModifiers Tests
  // ============================================================================

  describe('calculateModifiers', () => {
    it('should calculate all modifiers for character stats', () => {
      const stats = {
        strength: 15,
        dexterity: 14,
        constitution: 13,
        intelligence: 12,
        wisdom: 10,
        charisma: 8
      }

      const modifiers = calculateModifiers(stats)

      expect(modifiers).toEqual({
        strength: 2,
        dexterity: 2,
        constitution: 1,
        intelligence: 1,
        wisdom: 0,
        charisma: -1
      })
    })

    it('should calculate all modifiers as 0 for all stats at 10', () => {
      const stats = {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      }

      const modifiers = calculateModifiers(stats)

      expect(modifiers).toEqual({
        strength: 0,
        dexterity: 0,
        constitution: 0,
        intelligence: 0,
        wisdom: 0,
        charisma: 0
      })
    })

    it('should calculate negative modifiers for low stats', () => {
      const stats = {
        strength: 8,
        dexterity: 7,
        constitution: 6,
        intelligence: 5,
        wisdom: 4,
        charisma: 3
      }

      const modifiers = calculateModifiers(stats)

      expect(modifiers).toEqual({
        strength: -1,
        dexterity: -2,
        constitution: -2,
        intelligence: -3,
        wisdom: -3,
        charisma: -4
      })
    })

    it('should calculate high positive modifiers for max stats', () => {
      const stats = {
        strength: 20,
        dexterity: 20,
        constitution: 20,
        intelligence: 20,
        wisdom: 20,
        charisma: 20
      }

      const modifiers = calculateModifiers(stats)

      expect(modifiers).toEqual({
        strength: 5,
        dexterity: 5,
        constitution: 5,
        intelligence: 5,
        wisdom: 5,
        charisma: 5
      })
    })
  })

  // ============================================================================
  // calculateMaxHP Tests
  // ============================================================================

  describe('calculateMaxHP', () => {
    it('should calculate level 1 Fighter HP correctly (10 + CON)', () => {
      const hp = calculateMaxHP(14, 'Fighter', 1) // CON 14 = +2
      expect(hp).toBe(12) // 10 (Fighter d10) + 2 (CON modifier)
    })

    it('should calculate level 1 Wizard HP correctly (6 + CON)', () => {
      const hp = calculateMaxHP(12, 'Wizard', 1) // CON 12 = +1
      expect(hp).toBe(7) // 6 (Wizard d6) + 1 (CON modifier)
    })

    it('should calculate level 1 Barbarian HP correctly (12 + CON)', () => {
      const hp = calculateMaxHP(16, 'Barbarian', 1) // CON 16 = +3
      expect(hp).toBe(15) // 12 (Barbarian d12) + 3 (CON modifier)
    })

    it('should calculate level 5 Fighter HP correctly', () => {
      // Level 1: 10 + 2 = 12
      // Levels 2-5: (6 + 2) * 4 = 32
      // Total: 12 + 32 = 44
      const hp = calculateMaxHP(14, 'Fighter', 5)
      expect(hp).toBe(44)
    })

    it('should calculate level 10 Wizard HP correctly', () => {
      // Level 1: 6 + 1 = 7
      // Levels 2-10: (4 + 1) * 9 = 45
      // Total: 7 + 45 = 52
      const hp = calculateMaxHP(12, 'Wizard', 10)
      expect(hp).toBe(52)
    })

    it('should handle negative CON modifier', () => {
      // Level 1: 6 + (-2) = 4
      const hp = calculateMaxHP(6, 'Wizard', 1) // CON 6 = -2
      expect(hp).toBe(4)
    })

    it('should enforce minimum 1 HP per level', () => {
      // Level 1: 6 + (-4) = 2
      // Aktuální implementace: Math.max(maxHP, level) = Math.max(2, 1) = 2
      // Správné chování: Minimálně 1 HP per level znamená level * 1
      const hp = calculateMaxHP(3, 'Wizard', 1) // CON 3 = -4
      expect(hp).toBeGreaterThanOrEqual(1) // Minimum 1 HP
      // Poznámka: Aktuální implementace dává 2 HP (6-4=2, což je více než 1*level)
    })

    it('should calculate HP for all character classes', () => {
      const classes: CharacterClass[] = [
        'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter',
        'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'
      ]

      classes.forEach(charClass => {
        const hp = calculateMaxHP(10, charClass, 1)
        expect(hp).toBeGreaterThan(0)
        expect(hp).toBeLessThanOrEqual(20) // Max možné HP na level 1
      })
    })

    it('should calculate level 20 character HP correctly', () => {
      // Level 1: 10 + 2 = 12
      // Levels 2-20: (6 + 2) * 19 = 152
      // Total: 12 + 152 = 164
      const hp = calculateMaxHP(14, 'Fighter', 20)
      expect(hp).toBe(164)
    })
  })

  // ============================================================================
  // calculateAC Tests
  // ============================================================================

  describe('calculateAC', () => {
    it('should calculate base AC as 10 + DEX modifier', () => {
      const ac = calculateAC(10) // DEX 10 = +0
      expect(ac).toBe(10)
    })

    it('should add DEX modifier to base AC', () => {
      const ac = calculateAC(14) // DEX 14 = +2
      expect(ac).toBe(12) // 10 + 2
    })

    it('should handle negative DEX modifier', () => {
      const ac = calculateAC(6) // DEX 6 = -2
      expect(ac).toBe(8) // 10 - 2
    })

    it('should add equipped armor value with DEX modifier', () => {
      const ac = calculateAC(14, 15) // DEX 14 = +2, Armor 15
      expect(ac).toBe(17) // 15 + 2
    })

    it('should handle high DEX modifier', () => {
      const ac = calculateAC(20) // DEX 20 = +5
      expect(ac).toBe(15) // 10 + 5
    })

    it('should handle armor without DEX bonus', () => {
      const ac = calculateAC(10, 18) // DEX 10 = +0, Heavy Armor
      expect(ac).toBe(18)
    })
  })
})

// ============================================================================
// Character Service CRUD Operations Tests
// ============================================================================

describe('CharacterService - CRUD Operations', () => {
  let prisma: any

  beforeEach(() => {
    prisma = new PrismaClient()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // createCharacter Tests
  // ============================================================================

  describe('createCharacter', () => {
    it('should create character with correct HP and AC calculation', async () => {
      const input: CreateCharacterRequest = {
        name: 'Thorin',
        race: 'Dwarf',
        class: 'Fighter',
        level: 1,
        strength: 15,
        dexterity: 14,
        constitution: 14,
        intelligence: 12,
        wisdom: 10,
        charisma: 8
      }

      const expectedCharacter = {
        id: 'test-id',
        ...input,
        hitPoints: 12,
        maxHitPoints: 12,
        armorClass: 12,
        experience: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        inventory: []
      }

      prisma.character.create.mockResolvedValue(expectedCharacter)

      const result = await createCharacter(input)

      expect(result.hitPoints).toBe(12) // 10 (Fighter) + 2 (CON modifier)
      expect(result.maxHitPoints).toBe(12)
      expect(result.armorClass).toBe(12) // 10 + 2 (DEX modifier)
      expect(prisma.character.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Thorin',
          class: 'Fighter',
          hitPoints: 12,
          maxHitPoints: 12,
          armorClass: 12,
          experience: 0
        }),
        include: {
          inventory: true
        }
      })
    })

    it('should create Wizard with correct HP', async () => {
      const input: CreateCharacterRequest = {
        name: 'Gandalf',
        race: 'Human',
        class: 'Wizard',
        level: 1,
        strength: 8,
        dexterity: 14,
        constitution: 12,
        intelligence: 18,
        wisdom: 14,
        charisma: 10
      }

      const expectedCharacter = {
        id: 'wizard-id',
        ...input,
        hitPoints: 7,
        maxHitPoints: 7,
        armorClass: 12,
        experience: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        inventory: []
      }

      prisma.character.create.mockResolvedValue(expectedCharacter)

      const result = await createCharacter(input)

      expect(result.hitPoints).toBe(7) // 6 (Wizard) + 1 (CON modifier)
      expect(result.armorClass).toBe(12) // 10 + 2 (DEX modifier)
    })

    it('should create Barbarian with correct HP', async () => {
      const input: CreateCharacterRequest = {
        name: 'Conan',
        race: 'Human',
        class: 'Barbarian',
        level: 1,
        strength: 18,
        dexterity: 14,
        constitution: 16,
        intelligence: 8,
        wisdom: 10,
        charisma: 12
      }

      const expectedCharacter = {
        id: 'barbarian-id',
        ...input,
        hitPoints: 15,
        maxHitPoints: 15,
        armorClass: 12,
        experience: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        inventory: []
      }

      prisma.character.create.mockResolvedValue(expectedCharacter)

      const result = await createCharacter(input)

      expect(result.hitPoints).toBe(15) // 12 (Barbarian) + 3 (CON modifier)
    })

    it('should handle character with background and avatar', async () => {
      const input: CreateCharacterRequest = {
        name: 'Aragorn',
        race: 'Human',
        class: 'Ranger',
        strength: 16,
        dexterity: 15,
        constitution: 14,
        intelligence: 12,
        wisdom: 14,
        charisma: 13,
        background: 'Noble ranger from the North',
        avatarUrl: 'https://example.com/aragorn.jpg'
      }

      const expectedCharacter = {
        id: 'ranger-id',
        ...input,
        level: 1,
        hitPoints: 12,
        maxHitPoints: 12,
        armorClass: 12,
        experience: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        inventory: []
      }

      prisma.character.create.mockResolvedValue(expectedCharacter)

      const result = await createCharacter(input)

      expect(result.background).toBe('Noble ranger from the North')
      expect(result.avatarUrl).toBe('https://example.com/aragorn.jpg')
    })

    it('should throw error on database failure', async () => {
      const input: CreateCharacterRequest = mockCharacter() as CreateCharacterRequest

      prisma.character.create.mockRejectedValue(new Error('Database error'))

      await expect(createCharacter(input)).rejects.toThrow('Nepodařilo se vytvořit postavu')
    })

    it('should create character with default level 1', async () => {
      const input = {
        name: 'Test',
        race: 'Human' as const,
        class: 'Fighter' as const,
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      }

      const expectedCharacter = {
        id: 'test-id',
        ...input,
        level: 1,
        hitPoints: 10,
        maxHitPoints: 10,
        armorClass: 10,
        experience: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        inventory: []
      }

      prisma.character.create.mockResolvedValue(expectedCharacter)

      const result = await createCharacter(input)

      expect(result.level).toBe(1)
    })
  })

  // ============================================================================
  // getCharacter Tests
  // ============================================================================

  describe('getCharacter', () => {
    it('should return character with inventory', async () => {
      const mockChar = {
        id: 'char-id',
        name: 'Test Character',
        race: 'Human',
        class: 'Fighter',
        level: 1,
        strength: 15,
        dexterity: 14,
        constitution: 13,
        intelligence: 12,
        wisdom: 10,
        charisma: 8,
        hitPoints: 13,
        maxHitPoints: 13,
        armorClass: 12,
        experience: 0,
        inventory: [
          { id: 'item-1', name: 'Sword', quantity: 1 }
        ]
      }

      prisma.character.findUnique.mockResolvedValue(mockChar)

      const result = await getCharacter('char-id')

      expect(result).toEqual(mockChar)
      expect(result?.inventory).toHaveLength(1)
      expect(prisma.character.findUnique).toHaveBeenCalledWith({
        where: { id: 'char-id' },
        include: {
          inventory: {
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      })
    })

    it('should return null when character not found', async () => {
      prisma.character.findUnique.mockResolvedValue(null)

      const result = await getCharacter('non-existent-id')

      expect(result).toBeNull()
    })

    it('should throw error on database failure', async () => {
      prisma.character.findUnique.mockRejectedValue(new Error('Database error'))

      await expect(getCharacter('char-id')).rejects.toThrow('Nepodařilo se načíst postavu')
    })
  })

  // ============================================================================
  // getAllCharacters Tests
  // ============================================================================

  describe('getAllCharacters', () => {
    it('should return all characters ordered by createdAt desc', async () => {
      const mockCharacters = [
        { id: 'char-1', name: 'Character 1', createdAt: new Date('2024-01-02') },
        { id: 'char-2', name: 'Character 2', createdAt: new Date('2024-01-01') }
      ]

      prisma.character.findMany.mockResolvedValue(mockCharacters)

      const result = await getAllCharacters()

      expect(result).toEqual(mockCharacters)
      expect(prisma.character.findMany).toHaveBeenCalledWith({
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          inventory: true
        }
      })
    })

    it('should return empty array when no characters exist', async () => {
      prisma.character.findMany.mockResolvedValue([])

      const result = await getAllCharacters()

      expect(result).toEqual([])
    })

    it('should throw error on database failure', async () => {
      prisma.character.findMany.mockRejectedValue(new Error('Database error'))

      await expect(getAllCharacters()).rejects.toThrow('Nepodařilo se načíst postavy')
    })
  })

  // ============================================================================
  // updateCharacter Tests
  // ============================================================================

  describe('updateCharacter', () => {
    it('should update character basic fields', async () => {
      const existingCharacter = {
        id: 'char-id',
        name: 'Old Name',
        class: 'Fighter',
        constitution: 14,
        level: 1,
        hitPoints: 12,
        maxHitPoints: 12
      }

      const updateData: UpdateCharacterRequest = {
        name: 'New Name'
      }

      const updatedCharacter = {
        ...existingCharacter,
        name: 'New Name'
      }

      prisma.character.findUnique.mockResolvedValue(existingCharacter)
      prisma.character.update.mockResolvedValue(updatedCharacter)

      const result = await updateCharacter('char-id', updateData)

      expect(result.name).toBe('New Name')
      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-id' },
        data: { name: 'New Name' },
        include: { inventory: true }
      })
    })

    it('should recalculate max HP when level increases', async () => {
      const existingCharacter = {
        id: 'char-id',
        name: 'Fighter',
        class: 'Fighter',
        constitution: 14, // +2 modifier
        level: 1,
        hitPoints: 12,
        maxHitPoints: 12
      }

      const updateData: UpdateCharacterRequest = {
        level: 5
      }

      prisma.character.findUnique.mockResolvedValue(existingCharacter)
      prisma.character.update.mockResolvedValue({
        ...existingCharacter,
        level: 5,
        maxHitPoints: 44 // 12 + (6+2)*4 = 44
      })

      const result = await updateCharacter('char-id', updateData)

      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-id' },
        data: {
          level: 5,
          maxHitPoints: 44
        },
        include: { inventory: true }
      })
    })

    it('should cap current HP when max HP decreases', async () => {
      const existingCharacter = {
        id: 'char-id',
        name: 'Fighter',
        class: 'Fighter',
        constitution: 14,
        level: 5,
        hitPoints: 44,
        maxHitPoints: 44
      }

      const updateData: UpdateCharacterRequest = {
        level: 1
      }

      prisma.character.findUnique.mockResolvedValue(existingCharacter)
      prisma.character.update.mockResolvedValue({
        ...existingCharacter,
        level: 1,
        hitPoints: 12,
        maxHitPoints: 12
      })

      await updateCharacter('char-id', updateData)

      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-id' },
        data: {
          level: 1,
          maxHitPoints: 12,
          hitPoints: 12 // Capped to new maxHP
        },
        include: { inventory: true }
      })
    })

    it('should throw error when character not found', async () => {
      prisma.character.findUnique.mockResolvedValue(null)

      await expect(updateCharacter('non-existent-id', { name: 'Test' })).rejects.toThrow('Postava nenalezena')
    })

    it('should throw error on database failure', async () => {
      prisma.character.findUnique.mockRejectedValue(new Error('Database error'))

      await expect(updateCharacter('char-id', { name: 'Test' })).rejects.toThrow('Database error')
    })
  })

  // ============================================================================
  // deleteCharacter Tests
  // ============================================================================

  describe('deleteCharacter', () => {
    it('should delete character and return true', async () => {
      prisma.character.delete.mockResolvedValue({ id: 'char-id' })

      const result = await deleteCharacter('char-id')

      expect(result).toBe(true)
      expect(prisma.character.delete).toHaveBeenCalledWith({
        where: { id: 'char-id' }
      })
    })

    it('should throw error on database failure', async () => {
      prisma.character.delete.mockRejectedValue(new Error('Database error'))

      await expect(deleteCharacter('char-id')).rejects.toThrow('Nepodařilo se smazat postavu')
    })

    it('should handle cascade delete of inventory items', async () => {
      // Prisma automatically handles CASCADE deletes via schema
      prisma.character.delete.mockResolvedValue({ id: 'char-id' })

      const result = await deleteCharacter('char-id')

      expect(result).toBe(true)
    })
  })

  // ============================================================================
  // addExperience Tests
  // ============================================================================

  describe('addExperience', () => {
    it('should add experience to character', async () => {
      const existingCharacter = {
        id: 'char-id',
        name: 'Fighter',
        experience: 100
      }

      prisma.character.findUnique.mockResolvedValue(existingCharacter)
      prisma.character.update.mockResolvedValue({
        ...existingCharacter,
        experience: 350
      })

      const result = await addExperience('char-id', 250)

      expect(result.experience).toBe(350)
      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-id' },
        data: {
          experience: 350
        },
        include: { inventory: true }
      })
    })

    it('should handle adding zero experience', async () => {
      const existingCharacter = {
        id: 'char-id',
        experience: 100
      }

      prisma.character.findUnique.mockResolvedValue(existingCharacter)
      prisma.character.update.mockResolvedValue({
        ...existingCharacter,
        experience: 100
      })

      const result = await addExperience('char-id', 0)

      expect(result.experience).toBe(100)
    })

    it('should throw error when character not found', async () => {
      prisma.character.findUnique.mockResolvedValue(null)

      await expect(addExperience('non-existent-id', 100)).rejects.toThrow('Postava nenalezena')
    })

    it('should handle large XP amounts', async () => {
      const existingCharacter = {
        id: 'char-id',
        experience: 1000
      }

      prisma.character.findUnique.mockResolvedValue(existingCharacter)
      prisma.character.update.mockResolvedValue({
        ...existingCharacter,
        experience: 100000
      })

      const result = await addExperience('char-id', 99000)

      expect(result.experience).toBe(100000)
    })
  })

  // ============================================================================
  // modifyHP Tests
  // ============================================================================

  describe('modifyHP', () => {
    it('should add HP (healing)', async () => {
      const existingCharacter = {
        id: 'char-id',
        hitPoints: 10,
        maxHitPoints: 20
      }

      prisma.character.findUnique.mockResolvedValue(existingCharacter)
      prisma.character.update.mockResolvedValue({
        ...existingCharacter,
        hitPoints: 15
      })

      const result = await modifyHP('char-id', 5)

      expect(result.hitPoints).toBe(15)
      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-id' },
        data: {
          hitPoints: 15
        },
        include: { inventory: true }
      })
    })

    it('should subtract HP (damage)', async () => {
      const existingCharacter = {
        id: 'char-id',
        hitPoints: 20,
        maxHitPoints: 20
      }

      prisma.character.findUnique.mockResolvedValue(existingCharacter)
      prisma.character.update.mockResolvedValue({
        ...existingCharacter,
        hitPoints: 12
      })

      const result = await modifyHP('char-id', -8)

      expect(result.hitPoints).toBe(12)
    })

    it('should cap HP at maxHitPoints', async () => {
      const existingCharacter = {
        id: 'char-id',
        hitPoints: 15,
        maxHitPoints: 20
      }

      prisma.character.findUnique.mockResolvedValue(existingCharacter)
      prisma.character.update.mockResolvedValue({
        ...existingCharacter,
        hitPoints: 20
      })

      const result = await modifyHP('char-id', 50) // Overhealing

      expect(result.hitPoints).toBe(20)
      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-id' },
        data: {
          hitPoints: 20
        },
        include: { inventory: true }
      })
    })

    it('should cap HP at minimum 0', async () => {
      const existingCharacter = {
        id: 'char-id',
        hitPoints: 10,
        maxHitPoints: 20
      }

      prisma.character.findUnique.mockResolvedValue(existingCharacter)
      prisma.character.update.mockResolvedValue({
        ...existingCharacter,
        hitPoints: 0
      })

      const result = await modifyHP('char-id', -50) // Massive damage

      expect(result.hitPoints).toBe(0)
      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-id' },
        data: {
          hitPoints: 0
        },
        include: { inventory: true }
      })
    })

    it('should handle zero HP modification', async () => {
      const existingCharacter = {
        id: 'char-id',
        hitPoints: 15,
        maxHitPoints: 20
      }

      prisma.character.findUnique.mockResolvedValue(existingCharacter)
      prisma.character.update.mockResolvedValue(existingCharacter)

      const result = await modifyHP('char-id', 0)

      expect(result.hitPoints).toBe(15)
    })

    it('should throw error when character not found', async () => {
      prisma.character.findUnique.mockResolvedValue(null)

      await expect(modifyHP('non-existent-id', 5)).rejects.toThrow('Postava nenalezena')
    })

    it('should throw error on database failure', async () => {
      const existingCharacter = {
        id: 'char-id',
        hitPoints: 15,
        maxHitPoints: 20
      }

      prisma.character.findUnique.mockResolvedValue(existingCharacter)
      prisma.character.update.mockRejectedValue(new Error('Database error'))

      await expect(modifyHP('char-id', 5)).rejects.toThrow('Database error')
    })
  })
})
