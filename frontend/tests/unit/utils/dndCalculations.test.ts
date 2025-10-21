/**
 * Unit Tests for dndCalculations utility
 * Tests D&D game mechanics calculations
 */

import { describe, it, expect } from 'vitest'
import {
  calculateModifier,
  formatModifier,
  calculateProficiencyBonus,
  calculateMaxHP,
  calculateBaseAC,
  isValidAbilityScore,
  calculatePointBuyCost,
  getStandardArray,
  getDefaultAbilityScores,
  getAbilityLabel,
  getAbilityFullName,
  getClassPrimaryAbilities,
  experienceForLevel
} from '@/utils/dndCalculations'
import type { CharacterClass, AbilityScores } from '@/types/character'

describe('dndCalculations', () => {
  describe('calculateModifier', () => {
    it('should calculate modifier for score 10', () => {
      expect(calculateModifier(10)).toBe(0)
    })

    it('should calculate modifier for score 11', () => {
      expect(calculateModifier(11)).toBe(0)
    })

    it('should calculate modifier for score 12', () => {
      expect(calculateModifier(12)).toBe(1)
    })

    it('should calculate modifier for score 8', () => {
      expect(calculateModifier(8)).toBe(-1)
    })

    it('should calculate modifier for score 20', () => {
      expect(calculateModifier(20)).toBe(5)
    })

    it('should calculate modifier for score 3 (minimum)', () => {
      expect(calculateModifier(3)).toBe(-4)
    })

    it('should calculate modifier for score 15', () => {
      expect(calculateModifier(15)).toBe(2)
    })

    it('should calculate modifier for score 18', () => {
      expect(calculateModifier(18)).toBe(4)
    })

    it('should calculate modifier for odd score (13)', () => {
      expect(calculateModifier(13)).toBe(1)
    })

    it('should calculate modifier for odd score (19)', () => {
      expect(calculateModifier(19)).toBe(4)
    })

    it('should handle negative scores', () => {
      expect(calculateModifier(1)).toBe(-5)
    })
  })

  describe('formatModifier', () => {
    it('should format positive modifier with plus sign', () => {
      expect(formatModifier(3)).toBe('+3')
    })

    it('should format zero modifier with plus sign', () => {
      expect(formatModifier(0)).toBe('+0')
    })

    it('should format negative modifier without extra sign', () => {
      expect(formatModifier(-2)).toBe('-2')
    })

    it('should format +1', () => {
      expect(formatModifier(1)).toBe('+1')
    })

    it('should format +5', () => {
      expect(formatModifier(5)).toBe('+5')
    })

    it('should format -1', () => {
      expect(formatModifier(-1)).toBe('-1')
    })

    it('should format -4', () => {
      expect(formatModifier(-4)).toBe('-4')
    })
  })

  describe('calculateProficiencyBonus', () => {
    it('should return +2 for levels 1-4', () => {
      expect(calculateProficiencyBonus(1)).toBe(2)
      expect(calculateProficiencyBonus(2)).toBe(2)
      expect(calculateProficiencyBonus(3)).toBe(2)
      expect(calculateProficiencyBonus(4)).toBe(2)
    })

    it('should return +3 for levels 5-8', () => {
      expect(calculateProficiencyBonus(5)).toBe(3)
      expect(calculateProficiencyBonus(6)).toBe(3)
      expect(calculateProficiencyBonus(7)).toBe(3)
      expect(calculateProficiencyBonus(8)).toBe(3)
    })

    it('should return +4 for levels 9-12', () => {
      expect(calculateProficiencyBonus(9)).toBe(4)
      expect(calculateProficiencyBonus(10)).toBe(4)
      expect(calculateProficiencyBonus(11)).toBe(4)
      expect(calculateProficiencyBonus(12)).toBe(4)
    })

    it('should return +5 for levels 13-16', () => {
      expect(calculateProficiencyBonus(13)).toBe(5)
      expect(calculateProficiencyBonus(14)).toBe(5)
      expect(calculateProficiencyBonus(15)).toBe(5)
      expect(calculateProficiencyBonus(16)).toBe(5)
    })

    it('should return +6 for levels 17-20', () => {
      expect(calculateProficiencyBonus(17)).toBe(6)
      expect(calculateProficiencyBonus(18)).toBe(6)
      expect(calculateProficiencyBonus(19)).toBe(6)
      expect(calculateProficiencyBonus(20)).toBe(6)
    })
  })

  describe('calculateMaxHP', () => {
    it('should calculate HP for Barbarian (d12)', () => {
      expect(calculateMaxHP('Barbarian', 2)).toBe(14) // 12 + 2
    })

    it('should calculate HP for Fighter (d10)', () => {
      expect(calculateMaxHP('Fighter', 2)).toBe(12) // 10 + 2
    })

    it('should calculate HP for Wizard (d6)', () => {
      expect(calculateMaxHP('Wizard', 0)).toBe(6) // 6 + 0
    })

    it('should calculate HP for Sorcerer (d6)', () => {
      expect(calculateMaxHP('Sorcerer', -1)).toBe(5) // 6 - 1
    })

    it('should calculate HP for Cleric (d8)', () => {
      expect(calculateMaxHP('Cleric', 1)).toBe(9) // 8 + 1
    })

    it('should calculate HP for Bard (d8)', () => {
      expect(calculateMaxHP('Bard', 2)).toBe(10) // 8 + 2
    })

    it('should calculate HP for Druid (d8)', () => {
      expect(calculateMaxHP('Druid', 0)).toBe(8) // 8 + 0
    })

    it('should calculate HP for Monk (d8)', () => {
      expect(calculateMaxHP('Monk', 1)).toBe(9) // 8 + 1
    })

    it('should calculate HP for Rogue (d8)', () => {
      expect(calculateMaxHP('Rogue', 2)).toBe(10) // 8 + 2
    })

    it('should calculate HP for Warlock (d8)', () => {
      expect(calculateMaxHP('Warlock', 1)).toBe(9) // 8 + 1
    })

    it('should calculate HP for Paladin (d10)', () => {
      expect(calculateMaxHP('Paladin', 3)).toBe(13) // 10 + 3
    })

    it('should calculate HP for Ranger (d10)', () => {
      expect(calculateMaxHP('Ranger', 1)).toBe(11) // 10 + 1
    })

    it('should handle negative constitution modifier', () => {
      expect(calculateMaxHP('Wizard', -2)).toBe(4) // 6 - 2
    })

    it('should handle high constitution modifier', () => {
      expect(calculateMaxHP('Barbarian', 5)).toBe(17) // 12 + 5
    })
  })

  describe('calculateBaseAC', () => {
    it('should calculate AC with 0 dex modifier', () => {
      expect(calculateBaseAC(0)).toBe(10)
    })

    it('should calculate AC with +2 dex modifier', () => {
      expect(calculateBaseAC(2)).toBe(12)
    })

    it('should calculate AC with +5 dex modifier', () => {
      expect(calculateBaseAC(5)).toBe(15)
    })

    it('should calculate AC with negative dex modifier', () => {
      expect(calculateBaseAC(-1)).toBe(9)
    })

    it('should calculate AC with +1 dex modifier', () => {
      expect(calculateBaseAC(1)).toBe(11)
    })

    it('should calculate AC with +3 dex modifier', () => {
      expect(calculateBaseAC(3)).toBe(13)
    })
  })

  describe('isValidAbilityScore', () => {
    it('should validate score 10', () => {
      expect(isValidAbilityScore(10)).toBe(true)
    })

    it('should validate minimum score (3)', () => {
      expect(isValidAbilityScore(3)).toBe(true)
    })

    it('should validate maximum score (20)', () => {
      expect(isValidAbilityScore(20)).toBe(true)
    })

    it('should invalidate score below 3', () => {
      expect(isValidAbilityScore(2)).toBe(false)
    })

    it('should invalidate score above 20', () => {
      expect(isValidAbilityScore(21)).toBe(false)
    })

    it('should invalidate score 0', () => {
      expect(isValidAbilityScore(0)).toBe(false)
    })

    it('should invalidate negative score', () => {
      expect(isValidAbilityScore(-5)).toBe(false)
    })

    it('should validate score 15', () => {
      expect(isValidAbilityScore(15)).toBe(true)
    })

    it('should validate score 8', () => {
      expect(isValidAbilityScore(8)).toBe(true)
    })
  })

  describe('calculatePointBuyCost', () => {
    it('should calculate cost for all 8s (minimum)', () => {
      const scores: AbilityScores = {
        strength: 8,
        dexterity: 8,
        constitution: 8,
        intelligence: 8,
        wisdom: 8,
        charisma: 8
      }
      expect(calculatePointBuyCost(scores)).toBe(0)
    })

    it('should calculate cost for balanced scores', () => {
      const scores: AbilityScores = {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      }
      expect(calculatePointBuyCost(scores)).toBe(12) // 6 × 2 points
    })

    it('should calculate cost with mixed scores', () => {
      const scores: AbilityScores = {
        strength: 15,
        dexterity: 14,
        constitution: 13,
        intelligence: 12,
        wisdom: 10,
        charisma: 8
      }
      expect(calculatePointBuyCost(scores)).toBe(27) // Standard 27-point buy
    })

    it('should return Infinity for score below 8', () => {
      const scores: AbilityScores = {
        strength: 7,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      }
      expect(calculatePointBuyCost(scores)).toBe(Infinity)
    })

    it('should return Infinity for score above 15', () => {
      const scores: AbilityScores = {
        strength: 16,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      }
      expect(calculatePointBuyCost(scores)).toBe(Infinity)
    })

    it('should calculate cost for all 15s (maximum)', () => {
      const scores: AbilityScores = {
        strength: 15,
        dexterity: 15,
        constitution: 15,
        intelligence: 15,
        wisdom: 15,
        charisma: 15
      }
      expect(calculatePointBuyCost(scores)).toBe(54) // 6 × 9 points
    })
  })

  describe('getStandardArray', () => {
    it('should return standard array', () => {
      const array = getStandardArray()
      expect(array).toEqual([15, 14, 13, 12, 10, 8])
    })

    it('should return array with 6 values', () => {
      expect(getStandardArray()).toHaveLength(6)
    })
  })

  describe('getDefaultAbilityScores', () => {
    it('should return all scores as 10', () => {
      const scores = getDefaultAbilityScores()
      expect(scores.strength).toBe(10)
      expect(scores.dexterity).toBe(10)
      expect(scores.constitution).toBe(10)
      expect(scores.intelligence).toBe(10)
      expect(scores.wisdom).toBe(10)
      expect(scores.charisma).toBe(10)
    })

    it('should return object with all ability scores', () => {
      const scores = getDefaultAbilityScores()
      expect(Object.keys(scores)).toHaveLength(6)
    })
  })

  describe('getAbilityLabel', () => {
    it('should return STR for strength', () => {
      expect(getAbilityLabel('strength')).toBe('STR')
    })

    it('should return DEX for dexterity', () => {
      expect(getAbilityLabel('dexterity')).toBe('DEX')
    })

    it('should return CON for constitution', () => {
      expect(getAbilityLabel('constitution')).toBe('CON')
    })

    it('should return INT for intelligence', () => {
      expect(getAbilityLabel('intelligence')).toBe('INT')
    })

    it('should return WIS for wisdom', () => {
      expect(getAbilityLabel('wisdom')).toBe('WIS')
    })

    it('should return CHA for charisma', () => {
      expect(getAbilityLabel('charisma')).toBe('CHA')
    })
  })

  describe('getAbilityFullName', () => {
    it('should return full name for strength', () => {
      expect(getAbilityFullName('strength')).toBe('Síla')
    })

    it('should return full name for dexterity', () => {
      expect(getAbilityFullName('dexterity')).toBe('Obratnost')
    })

    it('should return full name for constitution', () => {
      expect(getAbilityFullName('constitution')).toBe('Odolnost')
    })

    it('should return full name for intelligence', () => {
      expect(getAbilityFullName('intelligence')).toBe('Inteligence')
    })

    it('should return full name for wisdom', () => {
      expect(getAbilityFullName('wisdom')).toBe('Moudrost')
    })

    it('should return full name for charisma', () => {
      expect(getAbilityFullName('charisma')).toBe('Charisma')
    })
  })

  describe('getClassPrimaryAbilities', () => {
    it('should return STR and CON for Barbarian', () => {
      const abilities = getClassPrimaryAbilities('Barbarian')
      expect(abilities).toContain('strength')
      expect(abilities).toContain('constitution')
    })

    it('should return CHA for Bard', () => {
      const abilities = getClassPrimaryAbilities('Bard')
      expect(abilities).toEqual(['charisma'])
    })

    it('should return WIS for Cleric', () => {
      const abilities = getClassPrimaryAbilities('Cleric')
      expect(abilities).toEqual(['wisdom'])
    })

    it('should return WIS for Druid', () => {
      const abilities = getClassPrimaryAbilities('Druid')
      expect(abilities).toEqual(['wisdom'])
    })

    it('should return STR and DEX for Fighter', () => {
      const abilities = getClassPrimaryAbilities('Fighter')
      expect(abilities).toContain('strength')
      expect(abilities).toContain('dexterity')
    })

    it('should return DEX and WIS for Monk', () => {
      const abilities = getClassPrimaryAbilities('Monk')
      expect(abilities).toContain('dexterity')
      expect(abilities).toContain('wisdom')
    })

    it('should return STR and CHA for Paladin', () => {
      const abilities = getClassPrimaryAbilities('Paladin')
      expect(abilities).toContain('strength')
      expect(abilities).toContain('charisma')
    })

    it('should return DEX and WIS for Ranger', () => {
      const abilities = getClassPrimaryAbilities('Ranger')
      expect(abilities).toContain('dexterity')
      expect(abilities).toContain('wisdom')
    })

    it('should return DEX for Rogue', () => {
      const abilities = getClassPrimaryAbilities('Rogue')
      expect(abilities).toEqual(['dexterity'])
    })

    it('should return CHA for Sorcerer', () => {
      const abilities = getClassPrimaryAbilities('Sorcerer')
      expect(abilities).toEqual(['charisma'])
    })

    it('should return CHA for Warlock', () => {
      const abilities = getClassPrimaryAbilities('Warlock')
      expect(abilities).toEqual(['charisma'])
    })

    it('should return INT for Wizard', () => {
      const abilities = getClassPrimaryAbilities('Wizard')
      expect(abilities).toEqual(['intelligence'])
    })
  })

  describe('experienceForLevel', () => {
    it('should return 0 XP for level 1', () => {
      expect(experienceForLevel(1)).toBe(0)
    })

    it('should return 300 XP for level 2', () => {
      expect(experienceForLevel(2)).toBe(300)
    })

    it('should return 900 XP for level 3', () => {
      expect(experienceForLevel(3)).toBe(900)
    })

    it('should return 2700 XP for level 4', () => {
      expect(experienceForLevel(4)).toBe(2700)
    })

    it('should return 6500 XP for level 5', () => {
      expect(experienceForLevel(5)).toBe(6500)
    })

    it('should return 14000 XP for level 6', () => {
      expect(experienceForLevel(6)).toBe(14000)
    })

    it('should return 48000 XP for level 9', () => {
      expect(experienceForLevel(9)).toBe(48000)
    })

    it('should return 64000 XP for level 10', () => {
      expect(experienceForLevel(10)).toBe(64000)
    })

    it('should return 100000 XP for level 12', () => {
      expect(experienceForLevel(12)).toBe(100000)
    })

    it('should return 165000 XP for level 15', () => {
      expect(experienceForLevel(15)).toBe(165000)
    })

    it('should return 355000 XP for level 20', () => {
      expect(experienceForLevel(20)).toBe(355000)
    })

    it('should return 0 for invalid level', () => {
      expect(experienceForLevel(21)).toBe(0)
      expect(experienceForLevel(0)).toBe(0)
      expect(experienceForLevel(-1)).toBe(0)
    })
  })

  describe('Edge Cases and Integration', () => {
    it('should handle maximum ability score (20) correctly', () => {
      const modifier = calculateModifier(20)
      expect(modifier).toBe(5)
      expect(formatModifier(modifier)).toBe('+5')
    })

    it('should handle minimum ability score (3) correctly', () => {
      const modifier = calculateModifier(3)
      expect(modifier).toBe(-4)
      expect(formatModifier(modifier)).toBe('-4')
    })

    it('should validate full character creation scores', () => {
      const scores: AbilityScores = {
        strength: 15,
        dexterity: 14,
        constitution: 13,
        intelligence: 12,
        wisdom: 10,
        charisma: 8
      }

      expect(isValidAbilityScore(scores.strength)).toBe(true)
      expect(isValidAbilityScore(scores.dexterity)).toBe(true)
      expect(isValidAbilityScore(scores.constitution)).toBe(true)
      expect(calculatePointBuyCost(scores)).toBe(27)
    })

    it('should calculate HP for high-level Barbarian', () => {
      const conMod = calculateModifier(18) // +4
      const hp = calculateMaxHP('Barbarian', conMod)
      expect(hp).toBe(16) // 12 + 4
    })
  })
})
