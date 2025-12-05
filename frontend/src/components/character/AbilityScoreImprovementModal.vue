<template>
  <Transition name="modal">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      @click.self="$emit('close')"
    >
      <div
        class="bg-dark-800 rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-dark-700"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 class="text-2xl font-bold text-white flex items-center gap-2">
            Ability Score Improvement
          </h2>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-white transition-colors"
            aria-label="Zavrit"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-6">
          <!-- Info Banner -->
          <div class="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
            <p class="text-primary-300 font-medium">
              Level {{ character?.level }} - Vyber zvyseni statistik
            </p>
            <p class="text-gray-400 text-sm mt-1">
              Muzes zvysit jednu statistiku o +2 nebo dve ruzne statistiky o +1 kazda.
            </p>
          </div>

          <!-- Mode Selection -->
          <div class="grid grid-cols-2 gap-4">
            <button
              @click="mode = 'single'"
              class="p-4 border-2 rounded-lg transition-all text-center"
              :class="mode === 'single'
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-dark-600 hover:border-dark-500'"
            >
              <div class="text-2xl mb-2">+2</div>
              <div class="text-sm text-gray-300">K jedne statistice</div>
            </button>
            <button
              @click="mode = 'dual'"
              class="p-4 border-2 rounded-lg transition-all text-center"
              :class="mode === 'dual'
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-dark-600 hover:border-dark-500'"
            >
              <div class="text-2xl mb-2">+1/+1</div>
              <div class="text-sm text-gray-300">Ke dvema statistikam</div>
            </button>
          </div>

          <!-- Stat Selection - Single Mode -->
          <div v-if="mode === 'single'" class="space-y-3">
            <p class="text-gray-300 font-medium">Vyber statistiku pro +2:</p>
            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="stat in STATS"
                :key="stat.key"
                @click="selectSingleStat(stat.key)"
                :disabled="!canIncreaseStat(stat.key, 2)"
                class="p-3 border-2 rounded-lg transition-all flex items-center justify-between"
                :class="getStatButtonClass(stat.key, 'single')"
              >
                <div class="flex items-center gap-2">
                  <span class="text-xl">{{ stat.icon }}</span>
                  <span class="text-white font-medium">{{ stat.name }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-gray-400">{{ getCurrentStat(stat.key) }}</span>
                  <span v-if="singleStat === stat.key" class="text-green-400">+2</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Stat Selection - Dual Mode -->
          <div v-else class="space-y-3">
            <p class="text-gray-300 font-medium">Vyber dve statistiky pro +1 kazda:</p>
            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="stat in STATS"
                :key="stat.key"
                @click="toggleDualStat(stat.key)"
                :disabled="!canIncreaseStat(stat.key, 1) && !dualStats.includes(stat.key)"
                class="p-3 border-2 rounded-lg transition-all flex items-center justify-between"
                :class="getStatButtonClass(stat.key, 'dual')"
              >
                <div class="flex items-center gap-2">
                  <span class="text-xl">{{ stat.icon }}</span>
                  <span class="text-white font-medium">{{ stat.name }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-gray-400">{{ getCurrentStat(stat.key) }}</span>
                  <span v-if="dualStats.includes(stat.key)" class="text-green-400">+1</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Preview -->
          <div v-if="hasSelection" class="bg-dark-700 rounded-lg p-4">
            <p class="text-gray-300 font-medium mb-3">Nahled zmen:</p>
            <div class="space-y-2">
              <div v-for="change in previewChanges" :key="change.stat" class="flex justify-between">
                <span class="text-gray-400">{{ getStatLabel(change.stat) }}:</span>
                <span>
                  <span class="text-gray-400">{{ change.from }}</span>
                  <span class="text-white mx-2">-></span>
                  <span class="text-green-400 font-bold">{{ change.to }}</span>
                  <span class="text-gray-500 ml-2">({{ getModifier(change.to) }})</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
            <p class="text-red-400">{{ error }}</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-3 p-6 border-t border-dark-700">
          <button
            @click="$emit('close')"
            class="px-6 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
            :disabled="loading"
          >
            Zrusit
          </button>
          <button
            @click="applyImprovement"
            class="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            :disabled="!canApply || loading"
          >
            <span
              v-if="loading"
              class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
            ></span>
            {{ loading ? 'Aplikuji...' : 'Aplikovat' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import type { Character, AbilityScoreName } from '@/types/character'

// Props & Emits
interface Props {
  isOpen: boolean
  character: Character | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'applied'): void
}>()

// Store
const characterStore = useCharacterStore()

// State
const mode = ref<'single' | 'dual'>('single')
const singleStat = ref<AbilityScoreName | null>(null)
const dualStats = ref<AbilityScoreName[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Stats configuration
const STATS: { key: AbilityScoreName; name: string; icon: string }[] = [
  { key: 'strength', name: 'Sila', icon: '💪' },
  { key: 'dexterity', name: 'Obratnost', icon: '🏃' },
  { key: 'constitution', name: 'Vytrvalost', icon: '❤️' },
  { key: 'intelligence', name: 'Inteligence', icon: '🧠' },
  { key: 'wisdom', name: 'Moudrost', icon: '🦉' },
  { key: 'charisma', name: 'Charisma', icon: '✨' },
]

// Computed
const hasSelection = computed(() => {
  if (mode.value === 'single') {
    return singleStat.value !== null
  } else {
    return dualStats.value.length === 2
  }
})

const canApply = computed(() => {
  if (mode.value === 'single') {
    return singleStat.value !== null
  } else {
    return dualStats.value.length === 2
  }
})

const previewChanges = computed(() => {
  const changes: { stat: AbilityScoreName; from: number; to: number }[] = []

  if (mode.value === 'single' && singleStat.value) {
    const from = getCurrentStat(singleStat.value)
    changes.push({ stat: singleStat.value, from, to: from + 2 })
  } else if (mode.value === 'dual') {
    for (const stat of dualStats.value) {
      const from = getCurrentStat(stat)
      changes.push({ stat, from, to: from + 1 })
    }
  }

  return changes
})

// Methods
function getCurrentStat(stat: AbilityScoreName): number {
  if (!props.character) return 0
  return props.character[stat]
}

function canIncreaseStat(stat: AbilityScoreName, amount: number): boolean {
  const current = getCurrentStat(stat)
  return current + amount <= 20
}

function selectSingleStat(stat: AbilityScoreName) {
  if (canIncreaseStat(stat, 2)) {
    singleStat.value = stat
  }
}

function toggleDualStat(stat: AbilityScoreName) {
  const index = dualStats.value.indexOf(stat)
  if (index > -1) {
    dualStats.value.splice(index, 1)
  } else if (dualStats.value.length < 2 && canIncreaseStat(stat, 1)) {
    dualStats.value.push(stat)
  }
}

function getStatButtonClass(stat: AbilityScoreName, currentMode: 'single' | 'dual'): string {
  const canIncrease = currentMode === 'single'
    ? canIncreaseStat(stat, 2)
    : canIncreaseStat(stat, 1) || dualStats.value.includes(stat)

  if (!canIncrease) {
    return 'border-dark-600 bg-dark-700 opacity-50 cursor-not-allowed'
  }

  const isSelected = currentMode === 'single'
    ? singleStat.value === stat
    : dualStats.value.includes(stat)

  if (isSelected) {
    return 'border-green-500 bg-green-500/10'
  }

  return 'border-dark-600 hover:border-dark-500 cursor-pointer'
}

function getStatLabel(stat: AbilityScoreName): string {
  const found = STATS.find(s => s.key === stat)
  return found ? found.name : stat
}

function getModifier(value: number): string {
  const mod = Math.floor((value - 10) / 2)
  return mod >= 0 ? `+${mod}` : `${mod}`
}

async function applyImprovement() {
  if (!canApply.value) return

  loading.value = true
  error.value = null

  try {
    const improvements: Record<string, number> = {}

    if (mode.value === 'single' && singleStat.value) {
      improvements[singleStat.value] = 2
    } else if (mode.value === 'dual') {
      for (const stat of dualStats.value) {
        improvements[stat] = 1
      }
    }

    await characterStore.applyASI(improvements)

    emit('applied')
    emit('close')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Nepodarilo se aplikovat ASI'
  } finally {
    loading.value = false
  }
}

// Reset on close/open
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    mode.value = 'single'
    singleStat.value = null
    dualStats.value = []
    error.value = null
  }
})
</script>

<style scoped>
/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.3s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
}
</style>
