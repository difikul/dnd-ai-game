/**
 * Inventory Store
 * Pinia store for character inventory management
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { InventoryItem, ItemGainData, EquippedStatBonuses } from '@/types/game'
import {
  getInventory as apiGetInventory,
  addItem as apiAddItem,
  updateItem as apiUpdateItem,
  deleteItem as apiDeleteItem,
  equipItem as apiEquipItem,
  unequipItem as apiUnequipItem,
  attuneItem as apiAttuneItem,
  unattuneItem as apiUnattuneItem,
  getEquippedBonuses as apiGetEquippedBonuses,
} from '@/services/inventory.service'
import { getErrorMessage } from '@/services/api.service'

// Max attunement slots per D&D 5e rules
const MAX_ATTUNED_ITEMS = 3

export const useInventoryStore = defineStore('inventory', () => {
  // State
  const items = ref<InventoryItem[]>([])
  const equippedBonuses = ref<EquippedStatBonuses>({})
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pendingItemGain = ref<ItemGainData | null>(null) // Item waiting for player confirmation

  // Getters
  const itemCount = computed(() => items.value.length)
  const equippedItems = computed(() => items.value.filter((item) => item.equipped))
  const attunedItems = computed(() => items.value.filter((item) => item.isAttuned))
  const attunementSlotsFree = computed(() => MAX_ATTUNED_ITEMS - attunedItems.value.length)
  const canAttune = computed(() => attunementSlotsFree.value > 0)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => error.value !== null)
  const hasPendingItem = computed(() => pendingItemGain.value !== null)

  // Items by type
  const weapons = computed(() => items.value.filter((item) => item.type === 'weapon'))
  const armor = computed(() => items.value.filter((item) => item.type === 'armor'))
  const accessories = computed(() => items.value.filter((item) => item.type === 'accessory'))
  const potions = computed(() => items.value.filter((item) => item.type === 'potion'))
  const miscItems = computed(() => items.value.filter((item) => item.type === 'misc'))

  // Actions

  /**
   * Load inventory for a character
   */
  async function loadInventory(characterId: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      items.value = await apiGetInventory(characterId)
      // Also load bonuses
      equippedBonuses.value = await apiGetEquippedBonuses(characterId)
    } catch (err) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Add item to inventory
   */
  async function addItem(characterId: string, itemData: ItemGainData): Promise<InventoryItem> {
    loading.value = true
    error.value = null

    try {
      const newItem = await apiAddItem(characterId, itemData)
      items.value.push(newItem)
      return newItem
    } catch (err) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update item in inventory
   */
  async function updateItem(
    characterId: string,
    itemId: string,
    data: Partial<ItemGainData>
  ): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const updatedItem = await apiUpdateItem(characterId, itemId, data)
      const index = items.value.findIndex((item) => item.id === itemId)
      if (index !== -1) {
        items.value[index] = updatedItem
      }
    } catch (err) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Remove item from inventory
   */
  async function removeItem(characterId: string, itemId: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await apiDeleteItem(characterId, itemId)
      items.value = items.value.filter((item) => item.id !== itemId)
    } catch (err) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Equip an item
   */
  async function equipItem(characterId: string, itemId: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const updatedItem = await apiEquipItem(characterId, itemId)
      const index = items.value.findIndex((item) => item.id === itemId)
      if (index !== -1) {
        items.value[index] = updatedItem
      }
      // Reload bonuses
      equippedBonuses.value = await apiGetEquippedBonuses(characterId)
    } catch (err) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Unequip an item
   */
  async function unequipItem(characterId: string, itemId: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const updatedItem = await apiUnequipItem(characterId, itemId)
      const index = items.value.findIndex((item) => item.id === itemId)
      if (index !== -1) {
        items.value[index] = updatedItem
      }
      // Reload bonuses
      equippedBonuses.value = await apiGetEquippedBonuses(characterId)
    } catch (err) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Attune to an item (requires attunement, max 3)
   */
  async function attuneItem(characterId: string, itemId: string): Promise<void> {
    if (!canAttune.value) {
      error.value = 'Nelze se propojit s dalším předmětem. Maximum je 3 propojené předměty.'
      throw new Error(error.value)
    }

    loading.value = true
    error.value = null

    try {
      const updatedItem = await apiAttuneItem(characterId, itemId)
      const index = items.value.findIndex((item) => item.id === itemId)
      if (index !== -1) {
        items.value[index] = updatedItem
      }
      // Reload bonuses
      equippedBonuses.value = await apiGetEquippedBonuses(characterId)
    } catch (err) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Remove attunement from an item
   */
  async function unattuneItem(characterId: string, itemId: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const updatedItem = await apiUnattuneItem(characterId, itemId)
      const index = items.value.findIndex((item) => item.id === itemId)
      if (index !== -1) {
        items.value[index] = updatedItem
      }
      // Reload bonuses
      equippedBonuses.value = await apiGetEquippedBonuses(characterId)
    } catch (err) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Set pending item from AI [ITEM-GAIN] response
   * Player must confirm before item is added
   */
  function setPendingItemGain(item: ItemGainData | null): void {
    pendingItemGain.value = item
  }

  /**
   * Confirm pending item - add to inventory
   */
  async function confirmPendingItem(characterId: string): Promise<InventoryItem | null> {
    if (!pendingItemGain.value) return null

    try {
      const item = await addItem(characterId, pendingItemGain.value)
      pendingItemGain.value = null
      return item
    } catch (err) {
      throw err
    }
  }

  /**
   * Reject pending item - discard without adding
   */
  function rejectPendingItem(): void {
    pendingItemGain.value = null
  }

  /**
   * Clear all inventory state
   */
  function clearInventory(): void {
    items.value = []
    equippedBonuses.value = {}
    pendingItemGain.value = null
    error.value = null
  }

  /**
   * Clear error
   */
  function clearError(): void {
    error.value = null
  }

  return {
    // State
    items,
    equippedBonuses,
    loading,
    error,
    pendingItemGain,

    // Getters
    itemCount,
    equippedItems,
    attunedItems,
    attunementSlotsFree,
    canAttune,
    isLoading,
    hasError,
    hasPendingItem,
    weapons,
    armor,
    accessories,
    potions,
    miscItems,

    // Actions
    loadInventory,
    addItem,
    updateItem,
    removeItem,
    equipItem,
    unequipItem,
    attuneItem,
    unattuneItem,
    setPendingItemGain,
    confirmPendingItem,
    rejectPendingItem,
    clearInventory,
    clearError,
  }
})
