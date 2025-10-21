/**
 * Character Service - Business logika pro správu postav
 * Implementuje D&D 5e pravidla pro výpočet statistik
 */

import { Character } from '@prisma/client'
import { prisma } from '../config/database'
import { CharacterStats, CharacterModifiers, CharacterClass } from '../types/dnd.types'
import { CreateCharacterRequest, UpdateCharacterRequest } from '../types/api.types'

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
 *
 * @param stat - Hodnota ability score (obvykle 3-20)
 * @returns Vypočítaný modifier (-4 až +5 pro běžné hodnoty)
 * @example
 * calculateModifier(10) // returns 0
 * calculateModifier(16) // returns +3
 * calculateModifier(8)  // returns -1
 */
export function calculateModifier(stat: number): number {
  return Math.floor((stat - 10) / 2)
}

/**
 * Vypočítá všechny modifikátory pro postavu
 *
 * @param stats - Objekt se všemi ability scores postavy
 * @returns Objekt se všemi vypočítanými modifikátory
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
 * Další levely: průměr Hit Dice (zaokrouhleno nahoru) + CON modifier per level
 *
 * @param constitution - Constitution score postavy (ne modifier!)
 * @param characterClass - Třída postavy (určuje Hit Dice)
 * @param level - Úroveň postavy (default 1)
 * @returns Maximální hit points
 * @example
 * calculateMaxHP(14, 'Fighter', 1) // returns 12 (10 + 2)
 * calculateMaxHP(16, 'Wizard', 3)  // returns 18 (6+3 + 2*(4+3))
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

  // Další levely: průměr Hit Die (zaokrouhleno nahoru podle D&D 5e pravidel) + CON modifier
  // Vzorec: (hitDie / 2) + 1, zaokrouhleno nahoru
  if (level > 1) {
    const avgHitDie = Math.ceil(hitDie / 2) + 1
    maxHP += (avgHitDie + conModifier) * (level - 1)
  }

  // Minimálně 1 HP per level
  return Math.max(maxHP, level)
}

/**
 * Vypočítá Armor Class podle D&D 5e pravidel
 * Základní AC: 10 + DEX modifier
 * S brněním: armor value + DEX modifier (s omezením pro heavy armor)
 *
 * @param dexterity - Dexterity score postavy (ne modifier!)
 * @param equippedArmorValue - Hodnota equipped armor (volitelné)
 * @returns Vypočítaný Armor Class
 * @todo Implementovat omezení DEX bonusu pro heavy armor
 * @example
 * calculateAC(14) // returns 12 (10 + 2)
 * calculateAC(16, 14) // returns 16 (14 + 3, light armor)
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
 * Vytvoří novou postavu s automatickým výpočtem derived stats (HP, AC)
 * Postava začíná s plným HP a level 1 (pokud není specifikováno jinak)
 *
 * @param data - Data pro vytvoření postavy (jméno, rasa, třída, ability scores, atd.)
 * @returns Promise s vytvořenou postavou včetně inventáře
 * @throws Error pokud se nepodaří vytvořit postavu v databázi
 */
export async function createCharacter(data: CreateCharacterRequest): Promise<Character> {
  const level = data.level || 1

  // Vypočítej maximální HP podle třídy a CON
  const maxHitPoints = calculateMaxHP(data.constitution, data.class, level)

  // Vypočítej AC podle DEX (zatím bez armor)
  const armorClass = calculateAC(data.dexterity)

  try {
    const character = await prisma.character.create({
      data: {
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

    return character
  } catch (error) {
    console.error('Chyba při vytváření postavy:', error)
    throw new Error('Nepodařilo se vytvořit postavu')
  }
}

/**
 * Načte postavu podle ID včetně inventáře
 *
 * @param id - UUID postavy
 * @returns Promise s postavou nebo null pokud nebyla nalezena
 * @throws Error pokud nastane chyba při komunikaci s databází
 */
export async function getCharacter(id: string): Promise<Character | null> {
  try {
    const character = await prisma.character.findUnique({
      where: { id },
      include: {
        inventory: {
          orderBy: {
            createdAt: 'desc'
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
 * Načte všechny postavy (pro budoucí list endpoint)
 */
export async function getAllCharacters(): Promise<Character[]> {
  try {
    const characters = await prisma.character.findMany({
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
 */
export async function updateCharacter(
  id: string,
  data: UpdateCharacterRequest
): Promise<Character> {
  try {
    // Načti aktuální postavu pro přepočítání stats
    const existingCharacter = await prisma.character.findUnique({
      where: { id }
    })

    if (!existingCharacter) {
      throw new Error('Postava nenalezena')
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
 */
export async function deleteCharacter(id: string): Promise<boolean> {
  try {
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
 */
export async function addExperience(
  id: string,
  xpAmount: number
): Promise<Character> {
  try {
    const character = await prisma.character.findUnique({
      where: { id }
    })

    if (!character) {
      throw new Error('Postava nenalezena')
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
 * Upraví HP postavy (healing nebo damage)
 * HP jsou automaticky limitovány mezi 0 a maxHitPoints
 *
 * @param id - UUID postavy
 * @param amount - Změna HP (kladná = healing, záporná = damage)
 * @returns Promise s aktualizovanou postavou
 * @throws Error pokud postava není nalezena nebo nastane chyba
 * @example
 * modifyHP('uuid-123', 5)  // Uzdraví o 5 HP
 * modifyHP('uuid-123', -8) // Utrpí 8 damage
 */
export async function modifyHP(
  id: string,
  amount: number
): Promise<Character> {
  try {
    const character = await prisma.character.findUnique({
      where: { id }
    })

    if (!character) {
      throw new Error('Postava nenalezena')
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
