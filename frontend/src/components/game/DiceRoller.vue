<template>
  <div class="dice-roller bg-dark-800 rounded-lg border border-dark-700 p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-xl font-display text-primary-500">🎲 Dice Roller</h3>
      <button
        v-if="hasHistory"
        @click="clearHistory"
        class="text-sm text-gray-400 hover:text-white transition"
        title="Clear history"
      >
        Clear History
      </button>
    </div>

    <!-- Quick Roll Buttons -->
    <div class="mb-6">
      <p class="text-sm text-gray-400 mb-3">Quick Roll:</p>
      <div class="grid grid-cols-4 sm:grid-cols-7 gap-2">
        <button
          v-for="die in diceTypes"
          :key="die"
          @click="handleQuickRoll(die)"
          :disabled="isRolling"
          class="dice-button"
          :class="{ 'opacity-50 cursor-not-allowed': isRolling }"
        >
          d{{ die }}
        </button>
      </div>
    </div>

    <!-- Custom Roll Input -->
    <div class="mb-6">
      <label class="text-sm text-gray-400 mb-2 block">Custom Notation:</label>
      <div class="flex gap-2">
        <input
          v-model="customNotation"
          type="text"
          placeholder="1d20+5"
          :disabled="isRolling"
          class="flex-1 bg-dark-900 text-white px-4 py-2 rounded
                 focus:outline-none focus:ring-2 focus:ring-primary-500
                 disabled:opacity-50"
          @keydown.enter="handleCustomRoll"
        />
        <button
          @click="handleCustomRoll"
          :disabled="isRolling || !customNotation.trim()"
          class="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded
                 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isRolling ? 'Rolling...' : 'Roll' }}
        </button>
      </div>
    </div>

    <!-- Advantage/Disadvantage -->
    <div class="mb-6 flex gap-4">
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          v-model="advantage"
          type="checkbox"
          :disabled="disadvantage || isRolling"
          class="w-4 h-4 text-primary-500 bg-dark-900 border-dark-600 rounded
                 focus:ring-primary-500 focus:ring-2"
        />
        <span class="text-sm text-gray-300">Advantage</span>
      </label>

      <label class="flex items-center gap-2 cursor-pointer">
        <input
          v-model="disadvantage"
          type="checkbox"
          :disabled="advantage || isRolling"
          class="w-4 h-4 text-primary-500 bg-dark-900 border-dark-600 rounded
                 focus:ring-primary-500 focus:ring-2"
        />
        <span class="text-sm text-gray-300">Disadvantage</span>
      </label>
    </div>

    <!-- Error Display -->
    <div
      v-if="error"
      class="mb-4 bg-red-900 bg-opacity-20 border border-red-800 text-red-500 px-4 py-2 rounded"
    >
      {{ error }}
    </div>

    <!-- Last Roll Result (Big Display) -->
    <div
      v-if="lastRoll"
      class="mb-6 bg-dark-900 border-2 border-primary-500 rounded-lg p-6 text-center"
    >
      <div class="text-sm text-gray-400 mb-2">{{ lastRoll.notation }}</div>
      <div class="text-5xl font-bold text-primary-500 mb-2 animate-fade-in">
        {{ lastRoll.total }}
      </div>
      <div class="text-sm text-gray-500">
        Rolled: [{{ lastRoll.rolls.join(', ') }}]
        <span v-if="lastRoll.modifier !== 0">
          {{ lastRoll.modifier > 0 ? '+' : '' }}{{ lastRoll.modifier }}
        </span>
      </div>
      <div v-if="lastRoll.advantage || lastRoll.disadvantage" class="text-xs text-primary-400 mt-2">
        {{ lastRoll.advantage ? 'with Advantage' : 'with Disadvantage' }}
      </div>
      <!-- Critical Hit/Miss -->
      <div v-if="isCriticalHit(lastRoll)" class="text-lg text-yellow-500 mt-2 animate-pulse">
        🎯 CRITICAL HIT!
      </div>
      <div v-if="isCriticalMiss(lastRoll)" class="text-lg text-red-500 mt-2 animate-pulse">
        💀 CRITICAL MISS!
      </div>
    </div>

    <!-- Roll History -->
    <div v-if="hasHistory" class="border-t border-dark-700 pt-4">
      <p class="text-sm text-gray-400 mb-3">Roll History (last 10):</p>
      <div class="space-y-2 max-h-64 overflow-y-auto">
        <div
          v-for="(roll, index) in recentHistory"
          :key="index"
          class="bg-dark-900 px-4 py-2 rounded text-sm flex items-center justify-between"
        >
          <div class="flex-1">
            <span class="text-gray-400">{{ roll.notation }}</span>
            <span class="mx-2">→</span>
            <span class="text-white font-semibold">{{ roll.total }}</span>
            <span v-if="roll.advantage" class="text-primary-400 text-xs ml-2">(Adv)</span>
            <span v-if="roll.disadvantage" class="text-primary-400 text-xs ml-2">(Dis)</span>
          </div>
          <div class="text-xs text-gray-600">
            {{ formatTime(roll.timestamp!) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!hasHistory && !lastRoll"
      class="text-center py-8 text-gray-500"
    >
      <div class="text-4xl mb-2">🎲</div>
      <p>Roll some dice to get started!</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDice, type DiceRoll } from '@/composables/useDice'

const {
  rollHistory,
  isRolling,
  error,
  hasHistory,
  lastRoll,
  rollDice,
  quickRoll,
  clearHistory,
  clearError
} = useDice()

// Local state
const customNotation = ref('')
const advantage = ref(false)
const disadvantage = ref(false)

// Dice types for quick roll
const diceTypes = [4, 6, 8, 10, 12, 20, 100]

// Computed
const recentHistory = computed(() => {
  return rollHistory.value.slice(-10).reverse()
})

/**
 * Handle quick roll button click
 */
async function handleQuickRoll(sides: number) {
  clearError()
  await quickRoll(sides)

  // Reset advantage/disadvantage after roll
  advantage.value = false
  disadvantage.value = false
}

/**
 * Handle custom notation roll
 */
async function handleCustomRoll() {
  if (!customNotation.value.trim()) return

  clearError()
  await rollDice(
    customNotation.value.trim(),
    advantage.value,
    disadvantage.value
  )

  // Reset after successful roll
  customNotation.value = ''
  advantage.value = false
  disadvantage.value = false
}

/**
 * Check if roll is critical hit
 */
function isCriticalHit(roll: DiceRoll): boolean {
  if (roll.sides !== 20) return false
  return roll.rolls.some(r => r === 20)
}

/**
 * Check if roll is critical miss
 */
function isCriticalMiss(roll: DiceRoll): boolean {
  if (roll.sides !== 20) return false
  if (roll.advantage || roll.disadvantage) {
    return roll.rolls.every(r => r === 1)
  }
  return roll.rolls[0] === 1
}

/**
 * Format timestamp for display
 */
function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return `${Math.floor(seconds / 3600)}h ago`
}
</script>

<style scoped>
.dice-button {
  @apply bg-dark-700 hover:bg-dark-600 text-white px-4 py-3 rounded-lg
         font-bold transition transform hover:scale-105
         focus:outline-none focus:ring-2 focus:ring-primary-500;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Custom scrollbar for history */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
