/**
 * Inventory API Service
 * API calls for character inventory management
 */

import api from './api.service'
import type { InventoryItem, ItemGainData, EquippedStatBonuses } from '@/types/game'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Get all items in character's inventory
 */
export async function getInventory(characterId: string): Promise<InventoryItem[]> {
  const response = await api.get<ApiResponse<InventoryItem[]>>(
    `/api/characters/${characterId}/inventory`
  )

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Nepodařilo se načíst inventář')
  }

  return response.data.data
}

/**
 * Get single item from inventory
 */
export async function getItem(characterId: string, itemId: string): Promise<InventoryItem> {
  const response = await api.get<ApiResponse<InventoryItem>>(
    `/api/characters/${characterId}/inventory/${itemId}`
  )

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Předmět nenalezen')
  }

  return response.data.data
}

/**
 * Add new item to inventory
 */
export async function addItem(characterId: string, item: ItemGainData): Promise<InventoryItem> {
  const response = await api.post<ApiResponse<InventoryItem>>(
    `/api/characters/${characterId}/inventory`,
    item
  )

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Nepodařilo se přidat předmět')
  }

  return response.data.data
}

/**
 * Update item in inventory
 */
export async function updateItem(
  characterId: string,
  itemId: string,
  data: Partial<ItemGainData>
): Promise<InventoryItem> {
  const response = await api.put<ApiResponse<InventoryItem>>(
    `/api/characters/${characterId}/inventory/${itemId}`,
    data
  )

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Nepodařilo se aktualizovat předmět')
  }

  return response.data.data
}

/**
 * Remove item from inventory
 */
export async function deleteItem(characterId: string, itemId: string): Promise<void> {
  const response = await api.delete<ApiResponse<void>>(
    `/api/characters/${characterId}/inventory/${itemId}`
  )

  if (!response.data.success) {
    throw new Error(response.data.error || 'Nepodařilo se smazat předmět')
  }
}

/**
 * Equip an item
 */
export async function equipItem(characterId: string, itemId: string): Promise<InventoryItem> {
  const response = await api.post<ApiResponse<InventoryItem>>(
    `/api/characters/${characterId}/inventory/${itemId}/equip`
  )

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Nepodařilo se nasadit předmět')
  }

  return response.data.data
}

/**
 * Unequip an item
 */
export async function unequipItem(characterId: string, itemId: string): Promise<InventoryItem> {
  const response = await api.post<ApiResponse<InventoryItem>>(
    `/api/characters/${characterId}/inventory/${itemId}/unequip`
  )

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Nepodařilo se sundat předmět')
  }

  return response.data.data
}

/**
 * Attune to a magical item (max 3 attuned items)
 */
export async function attuneItem(characterId: string, itemId: string): Promise<InventoryItem> {
  const response = await api.post<ApiResponse<InventoryItem>>(
    `/api/characters/${characterId}/inventory/${itemId}/attune`
  )

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Nepodařilo se propojit s předmětem')
  }

  return response.data.data
}

/**
 * Remove attunement from an item
 */
export async function unattuneItem(characterId: string, itemId: string): Promise<InventoryItem> {
  const response = await api.post<ApiResponse<InventoryItem>>(
    `/api/characters/${characterId}/inventory/${itemId}/unattune`
  )

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Nepodařilo se odpojit od předmětu')
  }

  return response.data.data
}

/**
 * Get calculated stat bonuses from equipped items
 */
export async function getEquippedBonuses(characterId: string): Promise<EquippedStatBonuses> {
  const response = await api.get<ApiResponse<EquippedStatBonuses>>(
    `/api/characters/${characterId}/inventory/bonuses`
  )

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Nepodařilo se načíst bonusy')
  }

  return response.data.data
}

export const inventoryService = {
  getInventory,
  getItem,
  addItem,
  updateItem,
  deleteItem,
  equipItem,
  unequipItem,
  attuneItem,
  unattuneItem,
  getEquippedBonuses,
}
