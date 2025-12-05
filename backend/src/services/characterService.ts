/**
 * Character Service - Business logika pro správu postav
 * Implementuje D&D 5e pravidla pro výpočet statistik
 */

import { Character } from '@prisma/client'
import { CharacterStats, CharacterModifiers, CharacterClass } from '../types/dnd.types'
import { CreateCharacterRequest, UpdateCharacterRequest, EffectiveStats, EquippedBonuses } from '../types/api.types'
import { prisma } from '../config/database'
import {
  isSpellcaster,
  getInitialSpellsForCharacter,
  getSpellSlotsForLevel
} from '../constants/spells'
import { itemService, StatBonuses } from './itemService'

// ============================================================================
// D&D 5e Constants - Hit Dice podle třídy
// ============================================================================

const HIT_DICE: Record<CharacterClass, number> = {
  Barbarian: 12,
  Fighter: 10,
  Paladin: 10,
  Ranger: 10,
  Bard: 8,
  Cleric: 8,
  Druid: 8,
  Monk: 8,
  Rogue: 8,
  Warlock: 8,
  Sorcerer: 6,
  Wizard: 6
}

/**
 * D&D 5e Experience Point Thresholds
 * XP required to reach each level (cumulative)
 */
const XP_THRESHOLDS: Record<number, number> = {
  1: 0,       // Starting level
  2: 300,
  3: 900,
  4: 2700,
  5: 6500,
  6: 14000,
  7: 23000,
  8: 34000,
  9: 48000,
  10: 64000,
  11: 85000,
  12: 100000,
  13: 120000,
  14: 140000,
  15: 165000,
  16: 195000,
  17: 225000,
  18: 265000,
  19: 305000,
  20: 355000
}

// ============================================================================
// Helper Functions - D&D 5e Mechaniky
// ============================================================================

/**
 * Vypočítá modifier podle D&D 5e pravidel
 * Vzorec: (stat - 10) / 2 (zaokrouhleno dolů)
 */
export function calculateModifier(stat: number): number {
  return Math.floor((stat - 10) / 2)
}

/**
 * Vypočítá všechny modifikátory pro postavu
 */
export function calculateModifiers(stats: CharacterStats): CharacterModifiers {
  return {
    strength: calculateModifier(stats.strength),
    dexterity: calculateModifier(stats.dexterity),
    constitution: calculateModifier(stats.constitution),
    intelligence: calculateModifier(stats.intelligence),
    wisdom: calculateModifier(stats.wisdom),
    charisma: calculateModifier(stats.charisma)
  }
}

/**
 * Vypočítá maximální HP podle D&D 5e pravidel
 * Level 1: Maximum z Hit Dice + CON modifier
 * Další levely: (Hit Dice / 2 + 1) + CON modifier per level
 */
export function calculateMaxHP(
  constitution: number,
  characterClass: CharacterClass,
  level: number = 1
): number {
  const conModifier = calculateModifier(constitution)
  const hitDie = HIT_DICE[characterClass]

  // Level 1: plný Hit Die + CON modifier
  let maxHP = hitDie + conModifier

  // Další levely: průměr Hit Die (zaokrouhleno nahoru) + CON modifier
  if (level > 1) {
    const avgHitDie = Math.floor(hitDie / 2) + 1
    maxHP += (avgHitDie + conModifier) * (level - 1)
  }

  // Minimálně 1 HP per level
  return Math.max(maxHP, level)
}

/**
 * Vypočítá Armor Class podle D&D 5e pravidel
 * Základní AC: 10 + DEX modifier
 * TODO: + armor value pokud má postava equipped armor
 */
export function calculateAC(dexterity: number, equippedArmorValue?: number): number {
  const dexModifier = calculateModifier(dexterity)
  const baseAC = 10 + dexModifier

  // Pokud má postava brnění, přičti jeho hodnotu
  // Poznámka: Heavy armor ignoruje DEX modifier, ale to zatím neřešíme
  if (equippedArmorValue) {
    return equippedArmorValue + dexModifier
  }

  return baseAC
}

/**
 * Get XP threshold for a specific level
 * @param level - Character level (1-20)
 * @returns XP required to reach that level
 */
export function getXPThresholdForLevel(level: number): number {
  if (level < 1) return 0
  if (level > 20) return XP_THRESHOLDS[20]
  return XP_THRESHOLDS[level] || 0
}

/**
 * Calculate character level based on XP
 * @param xp - Current experience points
 * @returns Character level (1-20)
 */
export function calculateLevelFromXP(xp: number): number {
  // Start from level 20 and work down to find the highest level reached
  for (let level = 20; level >= 1; level--) {
    if (xp >= XP_THRESHOLDS[level]) {
      return level
    }
  }
  return 1 // Minimum level
}

// ============================================================================
// Character Service Functions
// ============================================================================

/**
 * Vytvoří novou postavu s automatickým výpočtem derived stats
 */
export async function createCharacter(
  userId: string,
  data: CreateCharacterRequest
): Promise<Character> {
  const level = data.level || 1

  // Vypočítej maximální HP podle třídy a CON
  const maxHitPoints = calculateMaxHP(data.constitution, data.class, level)

  // Vypočítej AC podle DEX (zatím bez armor)
  const armorClass = calculateAC(data.dexterity)

  try {
    const character = await prisma.character.create({
      data: {
        userId, // Přiřaď k uživateli
        name: data.name,
        race: data.race,
        class: data.class,
        level,
        strength: data.strength,
        dexterity: data.dexterity,
        constitution: data.constitution,
        intelligence: data.intelligence,
        wisdom: data.wisdom,
        charisma: data.charisma,
        hitPoints: maxHitPoints, // Začíná s plným HP
        maxHitPoints,
        armorClass,
        background: data.background,
        avatarUrl: data.avatarUrl,
        experience: 0
      },
      include: {
        inventory: true
      }
    })

    // Inicializuj spells a spell sloty pokud je to spellcaster
    await initializeCharacterSpells(character.id, data.class, level)

    return character
  } catch (error) {
    console.error('Chyba při vytváření postavy:', error)
    throw new Error('Nepodařilo se vytvořit postavu')
  }
}

/**
 * Typ pro postavu s efektivními statistikami
 */
export interface CharacterWithEffectiveStats extends Character {
  effectiveStats: EffectiveStats
  equippedBonuses: EquippedBonuses
}

/**
 * Načte postavu podle ID včetně inventáře
 * Validuje ownership - uživatel může načíst pouze své postavy
 * Vrací i effectiveStats (základní statistiky + bonusy z vybavení)
 */
export async function getCharacter(
  userId: string,
  id: string
): Promise<CharacterWithEffectiveStats | null> {
  try {
    const character = await prisma.character.findFirst({
      where: {
        id,
        userId // Kontrola ownership
      },
      include: {
        inventory: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        knownSpells: {
          orderBy: {
            spellLevel: 'asc'
          }
        },
        spellSlots: {
          orderBy: {
            level: 'asc'
          }
        },
        classFeatures: {
          orderBy: {
            unlockLevel: 'asc'
          }
        }
      }
    })

    if (!character) return null

    // Vypočítat bonusy z vybavení
    const equippedBonuses = await itemService.calculateEquippedBonuses(id)

    // Vypočítat efektivní statistiky (základní + bonusy z vybavení)
    const effectiveStats: EffectiveStats = {
      strength: character.strength + (equippedBonuses.strength || 0),
      dexterity: character.dexterity + (equippedBonuses.dexterity || 0),
      constitution: character.constitution + (equippedBonuses.constitution || 0),
      intelligence: character.intelligence + (equippedBonuses.intelligence || 0),
      wisdom: character.wisdom + (equippedBonuses.wisdom || 0),
      charisma: character.charisma + (equippedBonuses.charisma || 0),
    }

    return {
      ...character,
      effectiveStats,
      equippedBonuses
    }
  } catch (error) {
    console.error('Chyba při načítání postavy:', error)
    throw new Error('Nepodařilo se načíst postavu')
  }
}

/**
 * Načte všechny postavy uživatele
 */
export async function getAllCharacters(userId: string): Promise<Character[]> {
  try {
    const characters = await prisma.character.findMany({
      where: {
        userId // Pouze postavy přihlášeného uživatele
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        inventory: true
      }
    })

    return characters
  } catch (error) {
    console.error('Chyba při načítání postav:', error)
    throw new Error('Nepodařilo se načíst postavy')
  }
}

/**
 * Aktualizuje postavu
 * Přepočítá HP a AC pokud se změní relevantní stats
 * Validuje ownership
 */
export async function updateCharacter(
  userId: string,
  id: string,
  data: UpdateCharacterRequest
): Promise<Character> {
  try {
    // Načti aktuální postavu pro přepočítání stats + validace ownership
    const existingCharacter = await prisma.character.findFirst({
      where: { id, userId }
    })

    if (!existingCharacter) {
      throw new Error('Postava nenalezena nebo nemáte oprávnění')
    }

    // Připrav update data
    const updateData: any = { ...data }

    // Pokud se změnil level, přepočítej max HP
    if (data.level && data.level !== existingCharacter.level) {
      const newMaxHP = calculateMaxHP(
        existingCharacter.constitution,
        existingCharacter.class as CharacterClass,
        data.level
      )
      updateData.maxHitPoints = newMaxHP

      // Pokud aktuální HP překračuje nový max, sniž je
      if (existingCharacter.hitPoints > newMaxHP) {
        updateData.hitPoints = newMaxHP
      }
    }

    const character = await prisma.character.update({
      where: { id },
      data: updateData,
      include: {
        inventory: true
      }
    })

    return character
  } catch (error) {
    console.error('Chyba při aktualizaci postavy:', error)
    throw error
  }
}

/**
 * Smaže postavu
 * Validuje ownership
 */
export async function deleteCharacter(userId: string, id: string): Promise<boolean> {
  try {
    // Validace ownership před smazáním
    const character = await prisma.character.findFirst({
      where: { id, userId }
    })

    if (!character) {
      throw new Error('Postava nenalezena nebo nemáte oprávnění')
    }

    await prisma.character.delete({
      where: { id }
    })

    return true
  } catch (error) {
    console.error('Chyba při mazání postavy:', error)
    throw new Error('Nepodařilo se smazat postavu')
  }
}

/**
 * Přidá experience a zkontroluje level-up threshold
 * Validuje ownership
 * Vrací character s příznakem shouldLevelUp
 */
export async function addExperience(
  userId: string,
  id: string,
  xpAmount: number
): Promise<Character & { shouldLevelUp?: boolean; nextLevelXP?: number }> {
  try {
    const character = await prisma.character.findFirst({
      where: { id, userId }
    })

    if (!character) {
      throw new Error('Postava nenalezena nebo nemáte oprávnění')
    }

    const newXP = character.experience + xpAmount
    const currentLevel = character.level
    const nextLevelThreshold = getXPThresholdForLevel(currentLevel + 1)

    // Check if character should level up
    const shouldLevelUp = currentLevel < 20 && newXP >= nextLevelThreshold

    console.log(`📊 XP Update: ${character.name} gained ${xpAmount} XP`)
    console.log(`   Current: ${character.experience} → ${newXP}`)
    console.log(`   Level ${currentLevel} → Next level at ${nextLevelThreshold} XP`)
    if (shouldLevelUp) {
      console.log(`   🎉 LEVEL UP READY!`)
    }

    const updatedCharacter = await prisma.character.update({
      where: { id },
      data: {
        experience: newXP
      },
      include: {
        inventory: true,
        knownSpells: true,
        spellSlots: true,
        classFeatures: true
      }
    })

    return {
      ...updatedCharacter,
      shouldLevelUp,
      nextLevelXP: nextLevelThreshold
    }
  } catch (error) {
    console.error('Chyba při přidávání XP:', error)
    throw error
  }
}

/**
 * Level up character - D&D 5e leveling system
 * - Increase level by 1
 * - Roll HP increase (average hit die + CON modifier)
 * - Update spell slots for new level
 * - Handle ability score improvement at levels 4, 8, 12, 16, 19
 * Validuje ownership
 */
export async function levelUpCharacter(
  userId: string,
  id: string
): Promise<{
  character: Character
  hpGained: number
  newSpellSlots: Record<number, number>
  abilityScoreImprovement: boolean
}> {
  try {
    const character = await prisma.character.findFirst({
      where: { id, userId },
      include: {
        spellSlots: true
      }
    })

    if (!character) {
      throw new Error('Postava nenalezena nebo nemáte oprávnění')
    }

    const currentLevel = character.level

    // Cannot level up beyond level 20
    if (currentLevel >= 20) {
      throw new Error('Postava již dosáhla maximální úrovně (20)')
    }

    const newLevel = currentLevel + 1
    const className = character.class as CharacterClass
    const hitDie = HIT_DICE[className]
    const conModifier = calculateModifier(character.constitution)

    // Calculate HP increase: average roll (rounded up) + CON modifier
    const avgHitDie = Math.floor(hitDie / 2) + 1
    const hpGained = Math.max(1, avgHitDie + conModifier) // Minimum 1 HP per level
    const newMaxHP = character.maxHitPoints + hpGained
    const newCurrentHP = character.hitPoints + hpGained // Also heal on level up

    console.log(`🎉 LEVEL UP: ${character.name} (${className})`)
    console.log(`   Level ${currentLevel} → ${newLevel}`)
    console.log(`   HP: ${character.hitPoints}/${character.maxHitPoints} → ${newCurrentHP}/${newMaxHP} (+${hpGained})`)

    // Check for ability score improvement
    const abilityScoreImprovementLevels = [4, 8, 12, 16, 19]
    const abilityScoreImprovement = abilityScoreImprovementLevels.includes(newLevel)

    if (abilityScoreImprovement) {
      console.log(`   ⭐ Ability Score Improvement available!`)
    }

    // Update character level and HP (and set pendingASI if available)
    const updatedCharacter = await prisma.character.update({
      where: { id },
      data: {
        level: newLevel,
        maxHitPoints: newMaxHP,
        hitPoints: newCurrentHP,
        // Set pendingASI to true if this level grants ASI
        pendingASI: abilityScoreImprovement ? true : undefined
      },
      include: {
        inventory: true,
        knownSpells: true,
        spellSlots: true,
        classFeatures: true
      }
    })

    // Update spell slots if spellcaster
    let newSpellSlots: Record<number, number> = {}
    if (isSpellcaster(className)) {
      const spellSlotsByLevel = getSpellSlotsForLevel(className, newLevel)
      newSpellSlots = spellSlotsByLevel

      console.log(`   🔮 Updating spell slots for ${className} level ${newLevel}`)

      // Update existing spell slots or create new ones
      for (const [spellLevel, maxSlots] of Object.entries(spellSlotsByLevel)) {
        const existingSlot = character.spellSlots.find(
          (slot) => slot.level === parseInt(spellLevel)
        )

        if (existingSlot) {
          // Update existing slot
          await prisma.spellSlot.update({
            where: { id: existingSlot.id },
            data: {
              maximum: maxSlots,
              current: maxSlots // Restore all slots on level up
            }
          })
          console.log(`      Level ${spellLevel}: ${existingSlot.maximum} → ${maxSlots} slots`)
        } else {
          // Create new slot (unlocking higher level spells)
          await prisma.spellSlot.create({
            data: {
              characterId: id,
              level: parseInt(spellLevel),
              maximum: maxSlots,
              current: maxSlots
            }
          })
          console.log(`      Level ${spellLevel}: NEW - ${maxSlots} slots`)
        }
      }
    }

    console.log(`   ✅ Level up complete!`)

    return {
      character: updatedCharacter,
      hpGained,
      newSpellSlots,
      abilityScoreImprovement
    }
  } catch (error) {
    console.error('Chyba při level upu:', error)
    throw error
  }
}

/**
 * Upraví HP postavy (healing, damage)
 * Validuje ownership
 */
export async function modifyHP(
  userId: string,
  id: string,
  amount: number
): Promise<Character> {
  try {
    const character = await prisma.character.findFirst({
      where: { id, userId }
    })

    if (!character) {
      throw new Error('Postava nenalezena nebo nemáte oprávnění')
    }

    // Vypočítaj nové HP (min 0, max maxHitPoints)
    const newHP = Math.max(
      0,
      Math.min(character.hitPoints + amount, character.maxHitPoints)
    )

    const updatedCharacter = await prisma.character.update({
      where: { id },
      data: {
        hitPoints: newHP
      },
      include: {
        inventory: true
      }
    })

    return updatedCharacter
  } catch (error) {
    console.error('Chyba při úpravě HP:', error)
    throw error
  }
}

/**
 * Inicializuje spells a spell sloty pro nově vytvořenou postavu
 * Volá se automaticky při createCharacter pro spellcaster třídy
 */
async function initializeCharacterSpells(
  characterId: string,
  className: string,
  level: number
): Promise<void> {
  console.log(`🔮 Inicializuji spells pro ${className} level ${level}`)

  // Kontrola zda je to spellcaster
  if (!isSpellcaster(className)) {
    console.log(`   ℹ️  ${className} není spellcaster - přeskakuji spell initialization`)
    return
  }

  // Získej počáteční kouzla pro třídu
  const initialSpells = getInitialSpellsForCharacter(className, level)

  console.log(`   📚 Přidávám ${initialSpells.length} počátečních kouzel`)

  // Vytvoř KnownSpell záznamy
  for (const spell of initialSpells) {
    await prisma.knownSpell.create({
      data: {
        characterId,
        spellName: spell.name,
        spellLevel: spell.level,
        school: spell.school,
        description: spell.description
      }
    })
  }

  // Získej spell sloty pro level
  const spellSlots = getSpellSlotsForLevel(className, level)
  const slotLevels = Object.keys(spellSlots).length

  console.log(`   ⚡ Přidávám spell sloty pro ${slotLevels} úrovní kouzel`)

  // Vytvoř SpellSlot záznamy
  for (const [spellLevel, maxSlots] of Object.entries(spellSlots)) {
    await prisma.spellSlot.create({
      data: {
        characterId,
        level: parseInt(spellLevel),
        maximum: maxSlots,
        current: maxSlots // Začíná s plnými sloty
      }
    })
  }

  console.log(`   ✅ Spell initialization dokončena`)
}

// ============================================================================
// ASI (Ability Score Improvement)
// ============================================================================

/**
 * Typy statistik pro ASI
 */
const ABILITY_SCORES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const
type AbilityScoreName = typeof ABILITY_SCORES[number]

/**
 * Interface pro ASI změny
 */
interface ASIImprovement {
  [key: string]: number  // e.g., { strength: 1, dexterity: 1 } or { intelligence: 2 }
}

interface ASIHistoryEntry {
  level: number
  changes: ASIImprovement
  appliedAt: string  // ISO date
}

/**
 * Aplikuje Ability Score Improvement na postavu
 * Validuje ownership a pravidla ASI
 */
export async function applyAbilityScoreImprovement(
  userId: string,
  characterId: string,
  improvements: ASIImprovement
): Promise<Character> {
  try {
    // Načíst postavu s validací ownership
    const character = await prisma.character.findFirst({
      where: { id: characterId, userId }
    })

    if (!character) {
      throw new Error('Postava nenalezena nebo nemáte oprávnění')
    }

    // Validace: má hráč pending ASI?
    if (!character.pendingASI) {
      throw new Error('Postava nemá žádné nevyužité Ability Score Improvement')
    }

    // Validace: součet změn musí být 2
    const totalIncrease = Object.values(improvements).reduce((sum, val) => sum + val, 0)
    if (totalIncrease !== 2) {
      throw new Error('Součet změn musí být přesně 2 (+2 k jedné statistice nebo +1 ke dvěma)')
    }

    // Validace: každá změna může být max 2
    for (const [stat, increase] of Object.entries(improvements)) {
      if (!ABILITY_SCORES.includes(stat as AbilityScoreName)) {
        throw new Error(`Neznámá statistika: ${stat}`)
      }
      if (increase < 1 || increase > 2) {
        throw new Error(`Neplatná hodnota pro ${stat}: ${increase} (povoleno 1 nebo 2)`)
      }
    }

    // Validace: statistika nesmí překročit 20
    const currentStats: Record<string, number> = {
      strength: character.strength,
      dexterity: character.dexterity,
      constitution: character.constitution,
      intelligence: character.intelligence,
      wisdom: character.wisdom,
      charisma: character.charisma
    }

    for (const [stat, increase] of Object.entries(improvements)) {
      const newValue = currentStats[stat] + increase
      if (newValue > 20) {
        throw new Error(`${stat} by překročila maximum 20 (aktuální: ${currentStats[stat]}, zvýšení: +${increase})`)
      }
    }

    // Připravit data pro update
    const updateData: Record<string, number | boolean | object> = {
      pendingASI: false  // Reset pending flag
    }

    // Aplikovat změny statistik
    for (const [stat, increase] of Object.entries(improvements)) {
      updateData[stat] = currentStats[stat] + increase
    }

    // Přidat do ASI historie
    const asiHistory = (character.asiHistory as ASIHistoryEntry[]) || []
    asiHistory.push({
      level: character.level,
      changes: improvements,
      appliedAt: new Date().toISOString()
    })
    updateData.asiHistory = asiHistory

    // Pokud se změnila CON, přepočítat HP
    if (improvements.constitution) {
      const oldConMod = calculateModifier(character.constitution)
      const newConMod = calculateModifier(character.constitution + improvements.constitution)
      const hpBonus = (newConMod - oldConMod) * character.level

      if (hpBonus !== 0) {
        updateData.maxHitPoints = character.maxHitPoints + hpBonus
        updateData.hitPoints = Math.min(character.hitPoints + hpBonus, character.maxHitPoints + hpBonus)
        console.log(`   ❤️ CON změna: HP ${character.maxHitPoints} → ${updateData.maxHitPoints} (+${hpBonus})`)
      }
    }

    console.log(`⭐ ASI Applied: ${character.name}`)
    console.log(`   Changes: ${JSON.stringify(improvements)}`)

    // Update postavu
    const updatedCharacter = await prisma.character.update({
      where: { id: characterId },
      data: updateData,
      include: {
        inventory: true,
        knownSpells: true,
        spellSlots: true,
        classFeatures: true
      }
    })

    console.log(`   ✅ ASI complete!`)

    return updatedCharacter
  } catch (error) {
    console.error('Chyba při aplikaci ASI:', error)
    throw error
  }
}

// ============================================================================
// Exports
// ============================================================================

export const characterService = {
  createCharacter,
  getCharacter,
  getAllCharacters,
  updateCharacter,
  deleteCharacter,
  addExperience,
  levelUpCharacter,
  modifyHP,
  applyAbilityScoreImprovement,
  calculateModifiers,
  calculateMaxHP,
  calculateAC,
  calculateLevelFromXP,
  getXPThresholdForLevel
}
