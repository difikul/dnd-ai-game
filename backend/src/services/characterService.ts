/**
 * Character Service - Business logika pro správu postav
 * Implementuje D&D 5e pravidla pro výpočet statistik
 */

import { Character } from '@prisma/client'
import { CharacterStats, CharacterModifiers, CharacterClass } from '../types/dnd.types'
import { CreateCharacterRequest, UpdateCharacterRequest } from '../types/api.types'
import { prisma } from '../config/database'
import {
  isSpellcaster,
  getInitialSpellsForCharacter,
  getSpellSlotsForLevel
} from '../constants/spells'

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
 * Načte postavu podle ID včetně inventáře
 * Validuje ownership - uživatel může načíst pouze své postavy
 */
export async function getCharacter(
  userId: string,
  id: string
): Promise<Character | null> {
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

    return character
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
 * Přidá experience a případně zvýší level
 * TODO: Implementovat leveling system podle D&D 5e XP tabulky
 * Validuje ownership
 */
export async function addExperience(
  userId: string,
  id: string,
  xpAmount: number
): Promise<Character> {
  try {
    const character = await prisma.character.findFirst({
      where: { id, userId }
    })

    if (!character) {
      throw new Error('Postava nenalezena nebo nemáte oprávnění')
    }

    const newXP = character.experience + xpAmount

    // TODO: Zkontroluj XP threshold pro level up
    // Zatím jen přidej XP bez level upu

    const updatedCharacter = await prisma.character.update({
      where: { id },
      data: {
        experience: newXP
      },
      include: {
        inventory: true
      }
    })

    return updatedCharacter
  } catch (error) {
    console.error('Chyba při přidávání XP:', error)
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
// Exports
// ============================================================================

export const characterService = {
  createCharacter,
  getCharacter,
  getAllCharacters,
  updateCharacter,
  deleteCharacter,
  addExperience,
  modifyHP,
  calculateModifiers,
  calculateMaxHP,
  calculateAC
}
