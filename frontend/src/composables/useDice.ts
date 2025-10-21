/**
 * useDice Composable
 * Vue composable for dice rolling logic
 */

import { ref, computed } from 'vue'
import api from '@/services/api.service'

export interface DiceRoll {
  notation: string
  count: number
  sides: number
  modifier: number
  rolls: number[]
  total: number
  type?: string
  advantage?: boolean
  disadvantage?: boolean
  timestamp?: Date
}

export function useDice() {
  // State
  const rollHistory = ref<DiceRoll[]>([])
  const isRolling = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const hasHistory = computed(() => rollHistory.value.length > 0)
  const lastRoll = computed(() => rollHistory.value[rollHistory.value.length - 1])

  /**
   * Roll dice via API
   * @param notation - Dice notation (e.g., "1d20+5")
   * @param advantage - Roll with advantage
   * @param disadvantage - Roll with disadvantage
   * @param type - Roll type (attack, saving_throw, etc.)
   */
  async function rollDice(
    notation: string,
    advantage: boolean = false,
    disadvantage: boolean = false,
    type?: string
  ): Promise<DiceRoll | null> {
    isRolling.value = true
    error.value = null

    try {
      const response = await api.post<{ success: boolean; data: DiceRoll }>('/api/dice/roll', {
        notation,
        advantage,
        disadvantage,
        type
      })

      const roll = {
        ...response.data.data,
        timestamp: new Date()
      }

      // Add to history
      rollHistory.value.push(roll)

      // Keep only last 50 rolls
      if (rollHistory.value.length > 50) {
        rollHistory.value = rollHistory.value.slice(-50)
      }

      return roll

    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to roll dice'
      console.error('Dice roll error:', err)
      return null
    } finally {
      isRolling.value = false
    }
  }

  /**
   * Quick roll (d4, d6, d8, d10, d12, d20, d100)
   * @param sides - Number of sides
   * @param modifier - Optional modifier
   */
  async function quickRoll(sides: number, modifier: number = 0): Promise<DiceRoll | null> {
    const notation = modifier !== 0
      ? `1d${sides}${modifier > 0 ? '+' : ''}${modifier}`
      : `1d${sides}`

    return await rollDice(notation)
  }

  /**
   * Parse dice notation from text (e.g., from narrator messages)
   * @param text - Text containing dice notation
   * @returns Array of dice notations found
   */
  function parseDiceFromText(text: string): string[] {
    // Regex to match dice notation: [DICE: 1d20+5] or just 1d20+5
    const regex = /(?:\[DICE:\s*)?(\d*d\d+(?:[+\-]\d+)?)(?:\])?/gi
    const matches = text.match(regex)

    if (!matches) return []

    return matches.map(match => {
      // Extract just the notation part
      const notation = match.replace(/\[DICE:\s*|\]/g, '')
      return notation.trim()
    })
  }

  /**
   * Format dice roll for display
   * @param roll - Dice roll result
   * @returns Formatted string
   */
  function formatRoll(roll: DiceRoll): string {
    const rollsStr = roll.rolls.join(', ')
    const modifierStr = roll.modifier !== 0
      ? ` ${roll.modifier > 0 ? '+' : ''}${roll.modifier}`
      : ''

    let result = `${roll.notation} → [${rollsStr}]${modifierStr} = **${roll.total}**`

    if (roll.advantage) {
      result += ' (Advantage)'
    }

    if (roll.disadvantage) {
      result += ' (Disadvantage)'
    }

    // Check for critical hit/miss (d20 only)
    if (roll.sides === 20) {
      if (roll.rolls.some(r => r === 20)) {
        result += ' 🎯 **CRITICAL HIT!**'
      } else if (roll.rolls.every(r => r === 1)) {
        result += ' 💀 **CRITICAL MISS!**'
      }
    }

    return result
  }

  /**
   * Clear roll history
   */
  function clearHistory() {
    rollHistory.value = []
  }

  /**
   * Clear error
   */
  function clearError() {
    error.value = null
  }

  return {
    // State
    rollHistory,
    isRolling,
    error,

    // Getters
    hasHistory,
    lastRoll,

    // Actions
    rollDice,
    quickRoll,
    parseDiceFromText,
    formatRoll,
    clearHistory,
    clearError
  }
}
