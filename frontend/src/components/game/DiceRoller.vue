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

    <!-- AI Requirement Info -->
    <div
      v-if="requirement"
      class="mb-6 bg-primary-900 bg-opacity-20 border border-primary-700 rounded-lg p-4"
    >
      <div class="flex items-start gap-3">
        <span class="text-2xl">🎯</span>
        <div class="flex-1">
          <h4 class="text-primary-400 font-semibold mb-1">AI požaduje hod kostkou</h4>
          <p v-if="requirement.description" class="text-gray-300 text-sm mb-2">
            {{ requirement.description }}
          </p>
          <div class="text-sm text-gray-400">
            <span v-if="requirement.skillName" class="inline-block mr-3">
              🎲 Skill: <span class="text-white">{{ requirement.skillName }}</span>
            </span>
            <span v-if="requirement.difficultyClass" class="inline-block">
              🎯 DC: <span class="text-white">{{ requirement.difficultyClass }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- FÁZE 1.1: Quick Action Button -->
      <button
        @click="handleRequirementRoll"
        :disabled="isRolling"
        class="mt-4 w-full bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg
               font-bold text-lg transition transform hover:scale-[1.02]
               disabled:opacity-50 disabled:cursor-not-allowed"
      >
        🎲 Hoď {{ requirement.notation }}
        <span v-if="requirement.skillName"> na {{ requirement.skillName }}</span>
      </button>
    </div>

    <!-- FÁZE 2.4: Vizuální separátor -->
    <div v-if="requirement" class="mb-6 text-center text-sm text-gray-500">
      ── nebo vyber kostku ručně ──
    </div>

    <!-- Quick Roll Buttons -->
    <div class="mb-6">
      <p class="text-sm text-gray-400 mb-3">📦 Běžné kostky:</p>
      <div class="grid grid-cols-4 sm:grid-cols-7 gap-2">
        <button
          v-for="die in diceTypes"
          :key="die"
          @click="handleQuickRoll(die)"
          :disabled="isRolling"
          :title="getDiceTooltip(die)"
          class="dice-button"
          :class="{ 'opacity-50 cursor-not-allowed': isRolling }"
        >
          <!-- FÁZE 2.1: Ikony a range -->
          <div class="flex flex-col items-center gap-1">
            <span class="text-2xl">{{ getDiceIcon(die) }}</span>
            <span class="font-bold">d{{ die }}</span>
            <span class="text-xs text-gray-400">1-{{ die }}</span>
          </div>
        </button>
      </div>
    </div>

    <!-- FÁZE 2.2: Collapsible Advanced Section -->
    <details class="mb-6 bg-dark-900 border border-dark-700 rounded-lg">
      <summary class="cursor-pointer px-4 py-3 text-sm text-gray-300 hover:text-white transition flex items-center gap-2">
        <span>🔧</span>
        <span class="font-semibold">Pokročilé možnosti</span>
        <span class="text-gray-500 text-xs ml-auto">(klikni pro rozbalení)</span>
      </summary>

      <div class="px-4 pb-4 space-y-4">
        <!-- Custom Roll Input -->
        <div>
          <label class="text-sm text-gray-400 mb-2 block">Vlastní zápis kostky:</label>
          <div class="flex gap-2">
            <input
              v-model="customNotation"
              type="text"
              placeholder="1d20+5"
              :disabled="isRolling"
              class="flex-1 bg-dark-800 text-white px-4 py-2 rounded
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
              {{ isRolling ? 'Rolling...' : 'Hodit' }}
            </button>
          </div>
          <!-- FÁZE 1.3: Inline help -->
          <div class="mt-2 text-xs text-gray-500">
            💡 Příklady: <code class="text-primary-400">1d20</code> (jedna 20-stěnná) •
            <code class="text-primary-400">2d6+3</code> (dvě 6-stěnné + 3) •
            <code class="text-primary-400">3d8</code> (tři 8-stěnné)
          </div>
        </div>

        <!-- Advantage/Disadvantage -->
        <div>
          <label class="text-sm text-gray-400 mb-2 block">Modifikátory hodu:</label>
          <div class="flex flex-col gap-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="advantage"
                type="checkbox"
                :disabled="disadvantage || isRolling"
                class="w-4 h-4 text-primary-500 bg-dark-800 border-dark-600 rounded
                       focus:ring-primary-500 focus:ring-2"
              />
              <span class="text-sm text-gray-300">
                Advantage 🎲🎲⬆️
                <span class="text-xs text-gray-500 ml-2">(hod 2× d20, vyber vyšší)</span>
              </span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="disadvantage"
                type="checkbox"
                :disabled="advantage || isRolling"
                class="w-4 h-4 text-primary-500 bg-dark-800 border-dark-600 rounded
                       focus:ring-primary-500 focus:ring-2"
              />
              <span class="text-sm text-gray-300">
                Disadvantage 🎲🎲⬇️
                <span class="text-xs text-gray-500 ml-2">(hod 2× d20, vyber nižší)</span>
              </span>
            </label>
          </div>
        </div>
      </div>
    </details>

    <!-- Error Display -->
    <div
      v-if="error"
      class="mb-4 bg-red-900 bg-opacity-20 border border-red-800 text-red-500 px-4 py-2 rounded"
    >
      {{ error }}
    </div>

    <!-- FÁZE 2.3: Lepší zobrazení výsledku -->
    <div
      v-if="lastRoll"
      class="mb-6 bg-dark-900 border-2 border-primary-500 rounded-lg p-6"
    >
      <!-- Kontext hodu -->
      <div v-if="requirement && requirement.skillName" class="text-center text-sm text-gray-400 mb-2">
        🎯 {{ requirement.skillName }} Roll
      </div>

      <!-- Celkový výsledek -->
      <div class="text-center">
        <div class="text-sm text-gray-400 mb-1">{{ lastRoll.notation }}</div>
        <div class="text-6xl font-bold text-primary-500 mb-3 animate-fade-in">
          {{ lastRoll.total }}
        </div>
      </div>

      <!-- Breakdown výpočtu -->
      <div class="text-center text-sm mb-3">
        <span class="text-gray-400">Hodil jsi: </span>
        <span class="text-white font-semibold">[{{ lastRoll.rolls.join(', ') }}]</span>
        <span v-if="lastRoll.modifier !== 0" class="text-gray-400">
          {{ lastRoll.modifier > 0 ? ' + ' : ' - ' }}
          <span class="text-primary-400">{{ Math.abs(lastRoll.modifier) }}</span>
        </span>
        <span class="text-gray-400"> = </span>
        <span class="text-primary-500 font-bold">{{ lastRoll.total }}</span>
      </div>

      <!-- Success/Failure feedback -->
      <div v-if="requirement && requirement.difficultyClass" class="text-center">
        <div
          v-if="lastRoll.total >= requirement.difficultyClass"
          class="inline-block bg-green-900 bg-opacity-30 border border-green-700 text-green-400 px-4 py-2 rounded-lg"
        >
          ✅ Úspěch! ({{ lastRoll.total }} ≥ DC {{ requirement.difficultyClass }})
        </div>
        <div
          v-else
          class="inline-block bg-red-900 bg-opacity-30 border border-red-700 text-red-400 px-4 py-2 rounded-lg"
        >
          ❌ Neúspěch ({{ lastRoll.total }} < DC {{ requirement.difficultyClass }})
        </div>
      </div>

      <!-- Advantage/Disadvantage indicator -->
      <div v-if="lastRoll.advantage || lastRoll.disadvantage" class="text-center text-xs text-primary-400 mt-3">
        {{ lastRoll.advantage ? '🎲🎲⬆️ s Advantage' : '🎲🎲⬇️ s Disadvantage' }}
      </div>

      <!-- Critical Hit/Miss -->
      <div v-if="isCriticalHit(lastRoll)" class="text-center text-lg text-yellow-500 mt-3 animate-pulse">
        🎯 CRITICAL HIT!
      </div>
      <div v-if="isCriticalMiss(lastRoll)" class="text-center text-lg text-red-500 mt-3 animate-pulse">
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
import { ref, computed, watch, onMounted } from 'vue'
import { useDice, type DiceRoll } from '@/composables/useDice'
import type { DiceRequirement } from '@/types/game'

// Props
interface Props {
  requirement?: DiceRequirement
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'roll-result': [roll: DiceRoll]
}>()

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

// Initialize with requirement if provided
onMounted(() => {
  if (props.requirement) {
    customNotation.value = props.requirement.notation
  }
})

// Watch for requirement changes
watch(
  () => props.requirement,
  (newReq) => {
    if (newReq) {
      customNotation.value = newReq.notation
    }
  }
)

// Dice types for quick roll
const diceTypes = [4, 6, 8, 10, 12, 20, 100]

// Computed
const recentHistory = computed(() => {
  return rollHistory.value.slice(-10).reverse()
})

/**
 * Handle quick action button (roll requirement from AI)
 */
async function handleRequirementRoll() {
  if (!props.requirement) return

  clearError()
  await rollDice(
    props.requirement.notation,
    advantage.value,
    disadvantage.value
  )

  // Emit roll result if there's a last roll
  if (lastRoll.value) {
    emit('roll-result', lastRoll.value)
  }

  // Reset after successful roll
  advantage.value = false
  disadvantage.value = false
}

/**
 * Handle quick roll button click
 */
async function handleQuickRoll(sides: number) {
  clearError()
  await quickRoll(sides)

  // Emit roll result if there's a last roll
  if (lastRoll.value) {
    emit('roll-result', lastRoll.value)
  }

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

  // Emit roll result if there's a last roll
  if (lastRoll.value) {
    emit('roll-result', lastRoll.value)
  }

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
 * Get dice icon emoji
 */
function getDiceIcon(sides: number): string {
  const icons: Record<number, string> = {
    4: '🔺',
    6: '🎲',
    8: '💎',
    10: '🔟',
    12: '⬢',
    20: '🌟',
    100: '💯'
  }
  return icons[sides] || '🎲'
}

/**
 * Get dice tooltip text
 */
function getDiceTooltip(sides: number): string {
  const tooltips: Record<number, string> = {
    4: '🔺 Čtyřstěnná (1-4)\nPoužití: Malé poškození, dýka',
    6: '🎲 Šestistěnná (1-6)\nPoužití: Standardní kostka, poškození',
    8: '💎 Osmistěnná (1-8)\nPoužití: Střední poškození, dlouhý meč',
    10: '🔟 Desetistěnná (1-10)\nPoužití: Velké poškození, těžké zbraně',
    12: '⬢ Dvanáctistěnná (1-12)\nPoužití: Masivní poškození, sekyra',
    20: '🌟 Dvacetistěnná (1-20)\nPoužití: Hlavní kostka - testy, útoky, záchranné hody',
    100: '💯 Procenta (1-100)\nPoužití: Náhodné tabulky, speciální efekty'
  }
  return tooltips[sides] || 'Kostka pro hod'
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
  @apply bg-dark-700 hover:bg-dark-600 text-white px-3 py-4 rounded-lg
         transition transform hover:scale-105
         focus:outline-none focus:ring-2 focus:ring-primary-500;
  min-height: 90px;
}

.dice-button:hover {
  @apply bg-primary-900 bg-opacity-40 border-primary-600;
  border-width: 1px;
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
