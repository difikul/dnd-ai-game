/**
 * Item Service - Business logic pro inventory management
 */

import { PrismaClient, Item, Character } from '@prisma/client'

const prisma = new PrismaClient()

// Types
export interface CreateItemDto {
  name: string
  type: string // weapon, armor, potion, accessory, misc
  description?: string
  quantity?: number
  damage?: string // "1d8+2"
  armorValue?: number
  properties?: Record<string, any>
  statBonuses?: StatBonuses // { strength: 2, acBonus: 1, hpBonus: 5 }
  rarity?: string // common, uncommon, rare, very_rare, legendary
  requiresAttunement?: boolean
}

export interface UpdateItemDto {
  name?: string
  type?: string
  description?: string
  quantity?: number
  damage?: string
  armorValue?: number
  properties?: Record<string, any>
  statBonuses?: StatBonuses
  rarity?: string
}

export interface StatBonuses {
  strength?: number
  dexterity?: number
  constitution?: number
  intelligence?: number
  wisdom?: number
  charisma?: number
  acBonus?: number
  hpBonus?: number
}

// Maximum attuned items per character (D&D 5e rule)
const MAX_ATTUNED_ITEMS = 3

/**
 * Get character's inventory
 */
export async function getInventory(userId: string, characterId: string): Promise<Item[]> {
  // Verify character belongs to user
  const character = await prisma.character.findFirst({
    where: { id: characterId, userId },
  })

  if (!character) {
    throw new Error('Postava nenalezena')
  }

  return prisma.item.findMany({
    where: { characterId },
    orderBy: [
      { equipped: 'desc' },
      { isAttuned: 'desc' },
      { type: 'asc' },
      { name: 'asc' },
    ],
  })
}

/**
 * Get single item
 */
export async function getItem(userId: string, characterId: string, itemId: string): Promise<Item | null> {
  // Verify character belongs to user
  const character = await prisma.character.findFirst({
    where: { id: characterId, userId },
  })

  if (!character) {
    throw new Error('Postava nenalezena')
  }

  return prisma.item.findFirst({
    where: { id: itemId, characterId },
  })
}

/**
 * Add item to inventory
 */
export async function addItem(userId: string, characterId: string, data: CreateItemDto): Promise<Item> {
  // Verify character belongs to user
  const character = await prisma.character.findFirst({
    where: { id: characterId, userId },
  })

  if (!character) {
    throw new Error('Postava nenalezena')
  }

  return prisma.item.create({
    data: {
      characterId,
      name: data.name,
      type: data.type,
      description: data.description,
      quantity: data.quantity ?? 1,
      damage: data.damage,
      armorValue: data.armorValue,
      properties: data.properties,
      statBonuses: data.statBonuses,
      rarity: data.rarity ?? 'common',
      requiresAttunement: data.requiresAttunement ?? false,
      equipped: false,
      isAttuned: false,
    },
  })
}

/**
 * Update item
 */
export async function updateItem(
  userId: string,
  characterId: string,
  itemId: string,
  data: UpdateItemDto
): Promise<Item> {
  // Verify character belongs to user
  const character = await prisma.character.findFirst({
    where: { id: characterId, userId },
  })

  if (!character) {
    throw new Error('Postava nenalezena')
  }

  // Verify item belongs to character
  const item = await prisma.item.findFirst({
    where: { id: itemId, characterId },
  })

  if (!item) {
    throw new Error('Predmet nenalezen')
  }

  return prisma.item.update({
    where: { id: itemId },
    data,
  })
}

/**
 * Delete item
 */
export async function deleteItem(userId: string, characterId: string, itemId: string): Promise<void> {
  // Verify character belongs to user
  const character = await prisma.character.findFirst({
    where: { id: characterId, userId },
  })

  if (!character) {
    throw new Error('Postava nenalezena')
  }

  // Verify item belongs to character
  const item = await prisma.item.findFirst({
    where: { id: itemId, characterId },
  })

  if (!item) {
    throw new Error('Predmet nenalezen')
  }

  await prisma.item.delete({
    where: { id: itemId },
  })
}

/**
 * Equip item
 */
export async function equipItem(userId: string, characterId: string, itemId: string): Promise<Item> {
  // Verify character belongs to user
  const character = await prisma.character.findFirst({
    where: { id: characterId, userId },
  })

  if (!character) {
    throw new Error('Postava nenalezena')
  }

  // Verify item belongs to character
  const item = await prisma.item.findFirst({
    where: { id: itemId, characterId },
  })

  if (!item) {
    throw new Error('Predmet nenalezen')
  }

  if (item.equipped) {
    throw new Error('Predmet je jiz nasazen')
  }

  return prisma.item.update({
    where: { id: itemId },
    data: { equipped: true },
  })
}

/**
 * Unequip item
 */
export async function unequipItem(userId: string, characterId: string, itemId: string): Promise<Item> {
  // Verify character belongs to user
  const character = await prisma.character.findFirst({
    where: { id: characterId, userId },
  })

  if (!character) {
    throw new Error('Postava nenalezena')
  }

  // Verify item belongs to character
  const item = await prisma.item.findFirst({
    where: { id: itemId, characterId },
  })

  if (!item) {
    throw new Error('Predmet nenalezen')
  }

  if (!item.equipped) {
    throw new Error('Predmet neni nasazen')
  }

  // If item is attuned, it must be unattuned first
  if (item.isAttuned) {
    throw new Error('Predmet musi byt nejdrive odpojen (unattune) pred sundanim')
  }

  return prisma.item.update({
    where: { id: itemId },
    data: { equipped: false },
  })
}

/**
 * Get count of attuned items for a character
 */
export async function getAttunedCount(characterId: string): Promise<number> {
  return prisma.item.count({
    where: { characterId, isAttuned: true },
  })
}

/**
 * Attune item (max 3 attuned items)
 */
export async function attuneItem(userId: string, characterId: string, itemId: string): Promise<Item> {
  // Verify character belongs to user
  const character = await prisma.character.findFirst({
    where: { id: characterId, userId },
  })

  if (!character) {
    throw new Error('Postava nenalezena')
  }

  // Verify item belongs to character
  const item = await prisma.item.findFirst({
    where: { id: itemId, characterId },
  })

  if (!item) {
    throw new Error('Predmet nenalezen')
  }

  if (!item.requiresAttunement) {
    throw new Error('Tento predmet nevyzaduje attunement')
  }

  if (!item.equipped) {
    throw new Error('Predmet musi byt nejdrive nasazen pred attunementem')
  }

  if (item.isAttuned) {
    throw new Error('Predmet je jiz attuned')
  }

  // Check attunement limit
  const attunedCount = await getAttunedCount(characterId)
  if (attunedCount >= MAX_ATTUNED_ITEMS) {
    throw new Error(`Muzes mit maximalne ${MAX_ATTUNED_ITEMS} attuned predmety. Nejdrive jeden odpoj.`)
  }

  return prisma.item.update({
    where: { id: itemId },
    data: { isAttuned: true },
  })
}

/**
 * Unattune item
 */
export async function unattuneItem(userId: string, characterId: string, itemId: string): Promise<Item> {
  // Verify character belongs to user
  const character = await prisma.character.findFirst({
    where: { id: characterId, userId },
  })

  if (!character) {
    throw new Error('Postava nenalezena')
  }

  // Verify item belongs to character
  const item = await prisma.item.findFirst({
    where: { id: itemId, characterId },
  })

  if (!item) {
    throw new Error('Predmet nenalezen')
  }

  if (!item.isAttuned) {
    throw new Error('Predmet neni attuned')
  }

  return prisma.item.update({
    where: { id: itemId },
    data: { isAttuned: false },
  })
}

/**
 * Calculate total stat bonuses from all equipped items
 * Only includes bonuses from items that:
 * 1. Are equipped
 * 2. If requiresAttunement=true, must also be attuned
 */
export async function calculateEquippedBonuses(characterId: string): Promise<StatBonuses> {
  const items = await prisma.item.findMany({
    where: {
      characterId,
      equipped: true,
    },
  })

  const bonuses: StatBonuses = {}

  for (const item of items) {
    // Skip items that require attunement but aren't attuned
    if (item.requiresAttunement && !item.isAttuned) {
      continue
    }

    const itemBonuses = item.statBonuses as StatBonuses | null
    if (!itemBonuses) continue

    // Aggregate bonuses
    if (itemBonuses.strength) bonuses.strength = (bonuses.strength ?? 0) + itemBonuses.strength
    if (itemBonuses.dexterity) bonuses.dexterity = (bonuses.dexterity ?? 0) + itemBonuses.dexterity
    if (itemBonuses.constitution) bonuses.constitution = (bonuses.constitution ?? 0) + itemBonuses.constitution
    if (itemBonuses.intelligence) bonuses.intelligence = (bonuses.intelligence ?? 0) + itemBonuses.intelligence
    if (itemBonuses.wisdom) bonuses.wisdom = (bonuses.wisdom ?? 0) + itemBonuses.wisdom
    if (itemBonuses.charisma) bonuses.charisma = (bonuses.charisma ?? 0) + itemBonuses.charisma
    if (itemBonuses.acBonus) bonuses.acBonus = (bonuses.acBonus ?? 0) + itemBonuses.acBonus
    if (itemBonuses.hpBonus) bonuses.hpBonus = (bonuses.hpBonus ?? 0) + itemBonuses.hpBonus
  }

  return bonuses
}

// Export all functions
export const itemService = {
  getInventory,
  getItem,
  addItem,
  updateItem,
  deleteItem,
  equipItem,
  unequipItem,
  attuneItem,
  unattuneItem,
  getAttunedCount,
  calculateEquippedBonuses,
}
