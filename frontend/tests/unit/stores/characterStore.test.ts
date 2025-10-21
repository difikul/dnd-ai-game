/**
 * Unit Tests for characterStore
 * Tests Pinia store for character state management
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCharacterStore } from '@/stores/characterStore'
import { server } from '../../setup'
import { http, HttpResponse } from 'msw'
import { mockCharacter, mockFighter, mockRogue, mockCreateCharacterDto, createMockCharacter } from '../../fixtures/mockData'
import type { Character, CreateCharacterDto, UpdateCharacterDto } from '@/types/character'

describe('characterStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    server.resetHandlers()
  })

  describe('Initial State', () => {
    it('should initialize with null currentCharacter', () => {
      const store = useCharacterStore()
      expect(store.currentCharacter).toBeNull()
    })

    it('should initialize with empty characters array', () => {
      const store = useCharacterStore()
      expect(store.characters).toEqual([])
    })

    it('should initialize with loading as false', () => {
      const store = useCharacterStore()
      expect(store.loading).toBe(false)
    })

    it('should initialize with null error', () => {
      const store = useCharacterStore()
      expect(store.error).toBeNull()
    })
  })

  describe('Getters', () => {
    it('hasCharacter should be false when no character', () => {
      const store = useCharacterStore()
      expect(store.hasCharacter).toBe(false)
    })

    it('hasCharacter should be true when character exists', () => {
      const store = useCharacterStore()
      store.currentCharacter = mockCharacter
      expect(store.hasCharacter).toBe(true)
    })

    it('characterCount should return number of characters', () => {
      const store = useCharacterStore()
      store.characters = [mockCharacter, mockFighter]
      expect(store.characterCount).toBe(2)
    })

    it('characterCount should return 0 for empty list', () => {
      const store = useCharacterStore()
      expect(store.characterCount).toBe(0)
    })

    it('isLoading should reflect loading state', () => {
      const store = useCharacterStore()
      expect(store.isLoading).toBe(false)
      store.loading = true
      expect(store.isLoading).toBe(true)
    })

    it('hasError should be false when no error', () => {
      const store = useCharacterStore()
      expect(store.hasError).toBe(false)
    })

    it('hasError should be true when error exists', () => {
      const store = useCharacterStore()
      store.error = 'Some error'
      expect(store.hasError).toBe(true)
    })
  })

  describe('createCharacter', () => {
    it('should create character successfully', async () => {
      const newCharacter = createMockCharacter({ id: 'new-char-123', name: 'New Character' })

      server.use(
        http.post('http://localhost:3000/api/characters', async ({ request }) => {
          return HttpResponse.json(newCharacter)
        })
      )

      const store = useCharacterStore()
      const result = await store.createCharacter(mockCreateCharacterDto)

      expect(result.id).toBe('new-char-123')
      expect(result.name).toBe('New Character')
      expect(store.currentCharacter).toEqual(newCharacter)
      expect(store.characters).toContain(newCharacter)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should add character to characters list', async () => {
      const newCharacter = mockCharacter

      server.use(
        http.post('http://localhost:3000/api/characters', () => {
          return HttpResponse.json(newCharacter)
        })
      )

      const store = useCharacterStore()
      await store.createCharacter(mockCreateCharacterDto)

      expect(store.characters).toHaveLength(1)
      expect(store.characters[0]).toEqual(newCharacter)
    })

    it('should set loading state during creation', async () => {
      let loadingDuringCall = false

      server.use(
        http.post('http://localhost:3000/api/characters', async () => {
          await new Promise(resolve => setTimeout(resolve, 10))
          return HttpResponse.json(mockCharacter)
        })
      )

      const store = useCharacterStore()
      const promise = store.createCharacter(mockCreateCharacterDto)

      loadingDuringCall = store.loading

      await promise

      expect(loadingDuringCall).toBe(true)
      expect(store.loading).toBe(false)
    })

    it('should handle validation error', async () => {
      server.use(
        http.post('http://localhost:3000/api/characters', () => {
          return HttpResponse.json(
            { success: false, error: 'Invalid ability scores' },
            { status: 400 }
          )
        })
      )

      const store = useCharacterStore()

      await expect(store.createCharacter(mockCreateCharacterDto)).rejects.toThrow()
      expect(store.error).toBeTruthy()
    })

    it('should handle D&D calculations for HP and AC', async () => {
      const fighterCharacter = createMockCharacter({
        class: 'Fighter',
        constitution: 15,
        dexterity: 14,
        hitPoints: 12, // 10 (Fighter HD) + 2 (CON mod)
        armorClass: 12  // 10 + 2 (DEX mod)
      })

      server.use(
        http.post('http://localhost:3000/api/characters', () => {
          return HttpResponse.json(fighterCharacter)
        })
      )

      const store = useCharacterStore()
      const result = await store.createCharacter({
        ...mockCreateCharacterDto,
        class: 'Fighter',
        constitution: 15,
        dexterity: 14
      })

      expect(result.hitPoints).toBe(12)
      expect(result.armorClass).toBe(12)
    })

    it('should handle Wizard with low HP', async () => {
      const wizardCharacter = createMockCharacter({
        class: 'Wizard',
        constitution: 10,
        hitPoints: 6, // 6 (Wizard HD) + 0 (CON mod)
        armorClass: 10
      })

      server.use(
        http.post('http://localhost:3000/api/characters', () => {
          return HttpResponse.json(wizardCharacter)
        })
      )

      const store = useCharacterStore()
      const result = await store.createCharacter({
        ...mockCreateCharacterDto,
        class: 'Wizard',
        constitution: 10
      })

      expect(result.hitPoints).toBe(6)
    })
  })

  describe('loadCharacter', () => {
    it('should load character by ID successfully', async () => {
      server.use(
        http.get('http://localhost:3000/api/characters/:id', () => {
          return HttpResponse.json(mockCharacter)
        })
      )

      const store = useCharacterStore()
      await store.loadCharacter('char-123')

      expect(store.currentCharacter).toEqual(mockCharacter)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should add character to list if not exists', async () => {
      server.use(
        http.get('http://localhost:3000/api/characters/:id', () => {
          return HttpResponse.json(mockCharacter)
        })
      )

      const store = useCharacterStore()
      await store.loadCharacter('char-123')

      expect(store.characters).toContain(mockCharacter)
    })

    it('should update character in list if exists', async () => {
      const updatedCharacter = { ...mockCharacter, level: 5 }

      server.use(
        http.get('http://localhost:3000/api/characters/:id', () => {
          return HttpResponse.json(updatedCharacter)
        })
      )

      const store = useCharacterStore()
      store.characters = [mockCharacter]

      await store.loadCharacter('char-123')

      expect(store.characters[0].level).toBe(5)
    })

    it('should handle 404 error', async () => {
      server.use(
        http.get('http://localhost:3000/api/characters/:id', () => {
          return HttpResponse.json(
            { success: false, error: 'Character not found' },
            { status: 404 }
          )
        })
      )

      const store = useCharacterStore()

      await expect(store.loadCharacter('invalid-id')).rejects.toThrow()
      expect(store.error).toBeTruthy()
    })
  })

  describe('loadAllCharacters', () => {
    it('should load all characters successfully', async () => {
      const characters = [mockCharacter, mockFighter, mockRogue]

      server.use(
        http.get('http://localhost:3000/api/characters', () => {
          return HttpResponse.json(characters)
        })
      )

      const store = useCharacterStore()
      await store.loadAllCharacters()

      expect(store.characters).toHaveLength(3)
      expect(store.characters).toEqual(characters)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should handle empty list', async () => {
      server.use(
        http.get('http://localhost:3000/api/characters', () => {
          return HttpResponse.json([])
        })
      )

      const store = useCharacterStore()
      await store.loadAllCharacters()

      expect(store.characters).toEqual([])
    })

    it('should replace existing characters list', async () => {
      const newCharacters = [mockFighter]

      server.use(
        http.get('http://localhost:3000/api/characters', () => {
          return HttpResponse.json(newCharacters)
        })
      )

      const store = useCharacterStore()
      store.characters = [mockCharacter, mockRogue]

      await store.loadAllCharacters()

      expect(store.characters).toHaveLength(1)
      expect(store.characters[0]).toEqual(mockFighter)
    })

    it('should handle API error', async () => {
      server.use(
        http.get('http://localhost:3000/api/characters', () => {
          return HttpResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
          )
        })
      )

      const store = useCharacterStore()

      await expect(store.loadAllCharacters()).rejects.toThrow()
      expect(store.error).toBeTruthy()
    })
  })

  describe('updateCharacter', () => {
    it('should update character successfully', async () => {
      const updateDto: UpdateCharacterDto = { level: 2, experience: 300 }
      const updatedCharacter = { ...mockCharacter, level: 2, experience: 300 }

      server.use(
        http.patch('http://localhost:3000/api/characters/:id', () => {
          return HttpResponse.json(updatedCharacter)
        })
      )

      const store = useCharacterStore()
      store.currentCharacter = mockCharacter
      store.characters = [mockCharacter]

      await store.updateCharacter('char-123', updateDto)

      expect(store.currentCharacter?.level).toBe(2)
      expect(store.currentCharacter?.experience).toBe(300)
      expect(store.characters[0].level).toBe(2)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should update HP after taking damage', async () => {
      const updateDto: UpdateCharacterDto = { hitPoints: 5 }
      const updatedCharacter = { ...mockCharacter, hitPoints: 5 }

      server.use(
        http.patch('http://localhost:3000/api/characters/:id', () => {
          return HttpResponse.json(updatedCharacter)
        })
      )

      const store = useCharacterStore()
      store.currentCharacter = mockCharacter

      await store.updateCharacter('char-123', updateDto)

      expect(store.currentCharacter?.hitPoints).toBe(5)
    })

    it('should update character in list but not current if different', async () => {
      const updateDto: UpdateCharacterDto = { level: 3 }
      const updatedCharacter = { ...mockFighter, level: 3 }

      server.use(
        http.patch('http://localhost:3000/api/characters/:id', () => {
          return HttpResponse.json(updatedCharacter)
        })
      )

      const store = useCharacterStore()
      store.currentCharacter = mockCharacter
      store.characters = [mockFighter]

      await store.updateCharacter('char-456', updateDto)

      expect(store.currentCharacter?.id).toBe('char-123')
      expect(store.characters[0].level).toBe(3)
    })

    it('should handle update validation error', async () => {
      server.use(
        http.patch('http://localhost:3000/api/characters/:id', () => {
          return HttpResponse.json(
            { success: false, error: 'Invalid level' },
            { status: 400 }
          )
        })
      )

      const store = useCharacterStore()

      await expect(store.updateCharacter('char-123', { level: -1 })).rejects.toThrow()
      expect(store.error).toBeTruthy()
    })

    it('should update character not in list without error', async () => {
      const updateDto: UpdateCharacterDto = { level: 2 }
      const updatedCharacter = { ...mockCharacter, level: 2 }

      server.use(
        http.patch('http://localhost:3000/api/characters/:id', () => {
          return HttpResponse.json(updatedCharacter)
        })
      )

      const store = useCharacterStore()
      store.characters = [mockFighter]

      await store.updateCharacter('char-123', updateDto)

      // Should not crash or add to list
      expect(store.characters).toHaveLength(1)
    })
  })

  describe('deleteCharacter', () => {
    it('should delete character successfully', async () => {
      server.use(
        http.delete('http://localhost:3000/api/characters/:id', () => {
          return HttpResponse.json({ success: true })
        })
      )

      const store = useCharacterStore()
      store.characters = [mockCharacter, mockFighter]

      await store.deleteCharacter('char-123')

      expect(store.characters).toHaveLength(1)
      expect(store.characters[0].id).toBe('char-456')
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should clear current character if same as deleted', async () => {
      server.use(
        http.delete('http://localhost:3000/api/characters/:id', () => {
          return HttpResponse.json({ success: true })
        })
      )

      const store = useCharacterStore()
      store.currentCharacter = mockCharacter
      store.characters = [mockCharacter]

      await store.deleteCharacter('char-123')

      expect(store.currentCharacter).toBeNull()
      expect(store.characters).toHaveLength(0)
    })

    it('should not clear current character if different', async () => {
      server.use(
        http.delete('http://localhost:3000/api/characters/:id', () => {
          return HttpResponse.json({ success: true })
        })
      )

      const store = useCharacterStore()
      store.currentCharacter = mockCharacter
      store.characters = [mockCharacter, mockFighter]

      await store.deleteCharacter('char-456')

      expect(store.currentCharacter).toEqual(mockCharacter)
    })

    it('should handle delete error', async () => {
      server.use(
        http.delete('http://localhost:3000/api/characters/:id', () => {
          return HttpResponse.json(
            { success: false, error: 'Cannot delete' },
            { status: 400 }
          )
        })
      )

      const store = useCharacterStore()

      await expect(store.deleteCharacter('char-123')).rejects.toThrow()
      expect(store.error).toBeTruthy()
    })
  })

  describe('setCurrentCharacter', () => {
    it('should set current character', () => {
      const store = useCharacterStore()
      store.setCurrentCharacter(mockCharacter)

      expect(store.currentCharacter).toEqual(mockCharacter)
    })

    it('should allow setting to null', () => {
      const store = useCharacterStore()
      store.currentCharacter = mockCharacter
      store.setCurrentCharacter(null)

      expect(store.currentCharacter).toBeNull()
    })
  })

  describe('clearError', () => {
    it('should clear error message', () => {
      const store = useCharacterStore()
      store.error = 'Some error'

      store.clearError()

      expect(store.error).toBeNull()
    })
  })

  describe('reset', () => {
    it('should reset store to initial state', () => {
      const store = useCharacterStore()
      store.currentCharacter = mockCharacter
      store.characters = [mockCharacter, mockFighter]
      store.loading = true
      store.error = 'Some error'

      store.reset()

      expect(store.currentCharacter).toBeNull()
      expect(store.characters).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('should handle character with maximum level', async () => {
      const maxLevelCharacter = createMockCharacter({ level: 20, experience: 355000 })

      server.use(
        http.get('http://localhost:3000/api/characters/:id', () => {
          return HttpResponse.json(maxLevelCharacter)
        })
      )

      const store = useCharacterStore()
      await store.loadCharacter('char-999')

      expect(store.currentCharacter?.level).toBe(20)
    })

    it('should handle character with 0 HP', async () => {
      const unconsciousCharacter = createMockCharacter({ hitPoints: 0 })

      server.use(
        http.patch('http://localhost:3000/api/characters/:id', () => {
          return HttpResponse.json(unconsciousCharacter)
        })
      )

      const store = useCharacterStore()
      store.currentCharacter = mockCharacter

      await store.updateCharacter('char-123', { hitPoints: 0 })

      expect(store.currentCharacter?.hitPoints).toBe(0)
    })

    it('should handle character with all ability scores at 20', async () => {
      const maxStatsCharacter = createMockCharacter({
        strength: 20,
        dexterity: 20,
        constitution: 20,
        intelligence: 20,
        wisdom: 20,
        charisma: 20
      })

      server.use(
        http.post('http://localhost:3000/api/characters', () => {
          return HttpResponse.json(maxStatsCharacter)
        })
      )

      const store = useCharacterStore()
      const result = await store.createCharacter({
        ...mockCreateCharacterDto,
        strength: 20,
        dexterity: 20,
        constitution: 20,
        intelligence: 20,
        wisdom: 20,
        charisma: 20
      })

      expect(result.strength).toBe(20)
      expect(result.intelligence).toBe(20)
    })

    it('should handle network error gracefully', async () => {
      server.use(
        http.get('http://localhost:3000/api/characters', () => {
          return HttpResponse.error()
        })
      )

      const store = useCharacterStore()

      await expect(store.loadAllCharacters()).rejects.toThrow()
      expect(store.error).toBeTruthy()
    })
  })
})
