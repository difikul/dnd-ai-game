<template>
  <Transition name="modal">
    <div
      v-if="isOpen && item"
      class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      @click.self="handleReject"
    >
      <div
        class="bg-dark-800 rounded-lg max-w-md w-full border border-dark-700 shadow-2xl
               transform transition-all"
      >
        <!-- Header -->
        <div class="p-6 border-b border-dark-700">
          <div class="flex items-center gap-3">
            <span class="text-4xl">{{ typeIcon }}</span>
            <div>
              <h2 class="text-xl font-display text-white">{{ item.name }}</h2>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-sm px-2 py-0.5 rounded-full" :class="rarityClass">
                  {{ rarityLabel }}
                </span>
                <span class="text-sm text-gray-400">{{ typeLabel }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6">
          <p class="text-primary-400 mb-4">
            Nalezl jsi nový předmět! Chceš si ho vzít do inventáře?
          </p>

          <!-- Description -->
          <p v-if="item.description" class="text-gray-300 mb-4">
            {{ item.description }}
          </p>

          <!-- Item Stats -->
          <div v-if="hasStats" class="bg-dark-900 rounded-lg p-4 mb-4">
            <h4 class="text-sm font-semibold text-gray-400 mb-2">Vlastnosti:</h4>
            <div class="flex flex-wrap gap-2">
              <span
                v-if="item.damage"
                class="text-sm bg-red-900/30 text-red-400 px-3 py-1 rounded"
              >
                Damage: {{ item.damage }}
              </span>
              <span
                v-if="item.armorValue"
                class="text-sm bg-blue-900/30 text-blue-400 px-3 py-1 rounded"
              >
                AC: +{{ item.armorValue }}
              </span>
              <template v-if="item.statBonuses">
                <span
                  v-for="(value, stat) in item.statBonuses"
                  :key="stat"
                  class="text-sm bg-green-900/30 text-green-400 px-3 py-1 rounded"
                >
                  {{ statLabel(stat as string) }}: {{ (value ?? 0) > 0 ? '+' : '' }}{{ value ?? 0 }}
                </span>
              </template>
            </div>
          </div>

          <!-- Attunement Warning -->
          <div
            v-if="item.requiresAttunement"
            class="flex items-center gap-2 text-sm text-purple-400 bg-purple-900/20 p-3 rounded"
          >
            <span>✨</span>
            <span>Tento předmět vyžaduje magické propojení pro aktivaci bonusů.</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="p-6 pt-0 flex gap-3">
          <button
            @click="handleConfirm"
            :disabled="loading"
            class="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold
                   py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <span class="animate-spin">⏳</span>
              Ukládám...
            </span>
            <span v-else>Vzít si předmět</span>
          </button>
          <button
            @click="handleReject"
            :disabled="loading"
            class="flex-1 bg-dark-700 hover:bg-dark-600 text-gray-300
                   py-3 rounded-lg transition disabled:opacity-50"
          >
            Nechat být
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ItemGainData } from '@/types/game'

const props = defineProps<{
  isOpen: boolean
  item: ItemGainData | null
}>()

const emit = defineEmits<{
  confirm: []
  reject: []
}>()

const loading = ref(false)

// Type icon mapping
const typeIcon = computed(() => {
  if (!props.item) return '📦'
  const icons: Record<string, string> = {
    weapon: '⚔️',
    armor: '🛡️',
    potion: '🧪',
    accessory: '💍',
    misc: '📦',
  }
  return icons[props.item.type] || '📦'
})

// Type label mapping
const typeLabel = computed(() => {
  if (!props.item) return ''
  const labels: Record<string, string> = {
    weapon: 'Zbraň',
    armor: 'Zbroj',
    potion: 'Lektvar',
    accessory: 'Doplněk',
    misc: 'Předmět',
  }
  return labels[props.item.type] || 'Předmět'
})

// Rarity styling
const rarityClass = computed(() => {
  if (!props.item) return 'bg-gray-700 text-gray-300'
  const classes: Record<string, string> = {
    common: 'bg-gray-700 text-gray-300',
    uncommon: 'bg-green-900/50 text-green-400',
    rare: 'bg-blue-900/50 text-blue-400',
    very_rare: 'bg-purple-900/50 text-purple-400',
    legendary: 'bg-orange-900/50 text-orange-400',
  }
  return classes[props.item.rarity] || classes.common
})

// Rarity label
const rarityLabel = computed(() => {
  if (!props.item) return 'Běžný'
  const labels: Record<string, string> = {
    common: 'Běžný',
    uncommon: 'Neobvyklý',
    rare: 'Vzácný',
    very_rare: 'Velmi vzácný',
    legendary: 'Legendární',
  }
  return labels[props.item.rarity] || 'Běžný'
})

// Check if item has any stats to display
const hasStats = computed(() => {
  if (!props.item) return false
  return (
    props.item.damage ||
    props.item.armorValue ||
    (props.item.statBonuses && Object.keys(props.item.statBonuses).length > 0)
  )
})

// Stat label mapping
function statLabel(stat: string): string {
  const labels: Record<string, string> = {
    strength: 'Síla',
    dexterity: 'Obratnost',
    constitution: 'Odolnost',
    intelligence: 'Inteligence',
    wisdom: 'Moudrost',
    charisma: 'Charisma',
    acBonus: 'AC',
    hpBonus: 'HP',
  }
  return labels[stat] || stat
}

// Handle confirm
async function handleConfirm() {
  loading.value = true
  try {
    emit('confirm')
  } finally {
    loading.value = false
  }
}

// Handle reject
function handleReject() {
  emit('reject')
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
}
</style>
