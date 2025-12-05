<template>
  <div
    class="bg-dark-700 rounded-lg p-3 border transition-all"
    :class="{
      'border-yellow-500/50 bg-yellow-900/20': item.equipped && item.isAttuned,
      'border-primary-500/50': item.equipped && !item.isAttuned,
      'border-dark-600': !item.equipped,
    }"
  >
    <!-- Item Header -->
    <div class="flex items-start justify-between gap-2 mb-2">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-lg">{{ typeIcon }}</span>
          <h4 class="font-semibold text-white truncate">{{ item.name }}</h4>
        </div>
        <div class="flex items-center gap-2 mt-1">
          <span
            class="text-xs px-2 py-0.5 rounded-full"
            :class="rarityClass"
          >
            {{ rarityLabel }}
          </span>
          <span v-if="item.requiresAttunement" class="text-xs text-purple-400">
            Vyžaduje propojení
          </span>
        </div>
      </div>
      <span class="text-gray-400 text-sm">x{{ item.quantity }}</span>
    </div>

    <!-- Item Description -->
    <p v-if="item.description" class="text-sm text-gray-400 mb-2">
      {{ item.description }}
    </p>

    <!-- Item Stats -->
    <div v-if="hasStats" class="flex flex-wrap gap-2 mb-2 text-xs">
      <span v-if="item.damage" class="bg-red-900/30 text-red-400 px-2 py-1 rounded">
        Damage: {{ item.damage }}
      </span>
      <span v-if="item.armorValue" class="bg-blue-900/30 text-blue-400 px-2 py-1 rounded">
        AC: +{{ item.armorValue }}
      </span>
      <template v-if="item.statBonuses">
        <span
          v-for="(value, stat) in item.statBonuses"
          :key="stat"
          class="bg-green-900/30 text-green-400 px-2 py-1 rounded"
        >
          {{ statLabel(stat as string) }}: {{ (value ?? 0) > 0 ? '+' : '' }}{{ value ?? 0 }}
        </span>
      </template>
    </div>

    <!-- Status Badges -->
    <div class="flex items-center gap-2 mb-3">
      <span
        v-if="item.equipped"
        class="text-xs bg-primary-900/50 text-primary-400 px-2 py-1 rounded"
      >
        Nasazeno
      </span>
      <span
        v-if="item.isAttuned"
        class="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-1 rounded"
      >
        Propojeno
      </span>
    </div>

    <!-- Actions -->
    <div class="flex flex-wrap gap-2">
      <!-- Equip/Unequip -->
      <button
        v-if="!item.equipped"
        @click="$emit('equip', item.id)"
        :disabled="loading"
        class="flex-1 text-xs bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded
               transition disabled:opacity-50"
      >
        Nasadit
      </button>
      <button
        v-else
        @click="$emit('unequip', item.id)"
        :disabled="loading"
        class="flex-1 text-xs bg-dark-600 hover:bg-dark-500 px-3 py-1.5 rounded
               transition disabled:opacity-50"
      >
        Sundat
      </button>

      <!-- Attune/Unattune (only for items requiring attunement) -->
      <template v-if="item.requiresAttunement">
        <button
          v-if="!item.isAttuned"
          @click="$emit('attune', item.id)"
          :disabled="loading || !canAttune"
          class="flex-1 text-xs bg-yellow-600 hover:bg-yellow-700 px-3 py-1.5 rounded
                 transition disabled:opacity-50"
          :title="!canAttune ? 'Maximum 3 propojene predmety' : ''"
        >
          Propojit
        </button>
        <button
          v-else
          @click="$emit('unattune', item.id)"
          :disabled="loading"
          class="flex-1 text-xs bg-yellow-900 hover:bg-yellow-800 px-3 py-1.5 rounded
                 transition disabled:opacity-50"
        >
          Odpojit
        </button>
      </template>

      <!-- Delete -->
      <button
        @click="handleDelete"
        :disabled="loading"
        class="text-xs bg-red-900/50 hover:bg-red-900 text-red-400 px-3 py-1.5 rounded
               transition disabled:opacity-50"
        title="Zahodit"
      >
        🗑️
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { InventoryItem } from '@/types/game'

const props = defineProps<{
  item: InventoryItem
  loading?: boolean
  canAttune?: boolean
}>()

const emit = defineEmits<{
  equip: [itemId: string]
  unequip: [itemId: string]
  attune: [itemId: string]
  unattune: [itemId: string]
  delete: [itemId: string]
}>()

// Type icon mapping
const typeIcon = computed(() => {
  const icons: Record<string, string> = {
    weapon: '⚔️',
    armor: '🛡️',
    potion: '🧪',
    accessory: '💍',
    misc: '📦',
  }
  return icons[props.item.type] || '📦'
})

// Rarity styling
const rarityClass = computed(() => {
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
  return (
    props.item.damage ||
    props.item.armorValue ||
    (props.item.statBonuses && Object.keys(props.item.statBonuses).length > 0)
  )
})

// Stat label mapping
function statLabel(stat: string): string {
  const labels: Record<string, string> = {
    strength: 'SÍL',
    dexterity: 'OBR',
    constitution: 'ODO',
    intelligence: 'INT',
    wisdom: 'MOU',
    charisma: 'CHA',
    acBonus: 'AC',
    hpBonus: 'HP',
  }
  return labels[stat] || stat.toUpperCase()
}

// Handle delete with confirmation
function handleDelete() {
  if (confirm(`Opravdu chceš zahodit "${props.item.name}"?`)) {
    emit('delete', props.item.id)
  }
}
</script>
