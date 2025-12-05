<template>
  <div class="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
    <!-- Header with Tabs -->
    <div class="border-b border-dark-700">
      <div class="flex">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="flex-1 px-4 py-3 text-sm font-medium transition-colors"
          :class="{
            'bg-dark-700 text-white border-b-2 border-primary-500': activeTab === tab.id,
            'text-gray-400 hover:text-white hover:bg-dark-700/50': activeTab !== tab.id,
          }"
        >
          <span class="mr-2">{{ tab.icon }}</span>
          {{ tab.label }}
          <span
            v-if="tab.count > 0"
            class="ml-2 text-xs bg-dark-600 px-1.5 py-0.5 rounded-full"
          >
            {{ tab.count }}
          </span>
        </button>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="p-4 max-h-[500px] overflow-y-auto">
      <!-- Loading State -->
      <div v-if="inventoryStore.isLoading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="inventoryStore.hasError"
        class="text-center py-8 text-red-400"
      >
        <p>{{ inventoryStore.error }}</p>
        <button
          @click="loadInventory"
          class="mt-2 text-sm text-primary-400 hover:text-primary-300"
        >
          Zkusit znovu
        </button>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="currentItems.length === 0"
        class="text-center py-8 text-gray-400"
      >
        <span class="text-4xl mb-2 block">{{ emptyIcon }}</span>
        <p>{{ emptyMessage }}</p>
      </div>

      <!-- Items List -->
      <div v-else class="space-y-3">
        <InventoryItem
          v-for="item in currentItems"
          :key="item.id"
          :item="item"
          :loading="inventoryStore.isLoading"
          :can-attune="inventoryStore.canAttune"
          @equip="handleEquip"
          @unequip="handleUnequip"
          @attune="handleAttune"
          @unattune="handleUnattune"
          @delete="handleDelete"
        />
      </div>
    </div>

    <!-- Footer Stats -->
    <div class="border-t border-dark-700 px-4 py-3 bg-dark-900/50">
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-4">
          <span class="text-gray-400">
            Předměty: <span class="text-white">{{ inventoryStore.itemCount }}</span>
          </span>
          <span class="text-gray-400">
            Propojené:
            <span
              :class="{
                'text-white': inventoryStore.attunedItems.length < 3,
                'text-yellow-400': inventoryStore.attunedItems.length >= 3,
              }"
            >
              {{ inventoryStore.attunedItems.length }}/3
            </span>
          </span>
        </div>

        <!-- Bonuses Summary -->
        <div v-if="hasBonuses" class="flex items-center gap-2">
          <span class="text-gray-400 text-xs">Bonusy:</span>
          <span
            v-for="(value, stat) in inventoryStore.equippedBonuses"
            :key="stat"
            class="text-xs bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded"
          >
            {{ statLabel(stat as string) }} {{ (value ?? 0) > 0 ? '+' : '' }}{{ value ?? 0 }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useInventoryStore } from '@/stores/inventoryStore'
import InventoryItem from './InventoryItem.vue'

const props = defineProps<{
  characterId: string
}>()

const inventoryStore = useInventoryStore()

// Active tab
const activeTab = ref<'all' | 'equipped' | 'weapons' | 'armor' | 'misc'>('all')

// Tabs configuration
const tabs = computed(() => [
  {
    id: 'all' as const,
    label: 'Vše',
    icon: '📦',
    count: inventoryStore.itemCount,
  },
  {
    id: 'equipped' as const,
    label: 'Nasazené',
    icon: '⚔️',
    count: inventoryStore.equippedItems.length,
  },
  {
    id: 'weapons' as const,
    label: 'Zbraně',
    icon: '🗡️',
    count: inventoryStore.weapons.length,
  },
  {
    id: 'armor' as const,
    label: 'Zbroj',
    icon: '🛡️',
    count: inventoryStore.armor.length,
  },
  {
    id: 'misc' as const,
    label: 'Ostatní',
    icon: '💎',
    count: inventoryStore.accessories.length + inventoryStore.potions.length + inventoryStore.miscItems.length,
  },
])

// Current items based on active tab
const currentItems = computed(() => {
  switch (activeTab.value) {
    case 'equipped':
      return inventoryStore.equippedItems
    case 'weapons':
      return inventoryStore.weapons
    case 'armor':
      return inventoryStore.armor
    case 'misc':
      return [
        ...inventoryStore.accessories,
        ...inventoryStore.potions,
        ...inventoryStore.miscItems,
      ]
    default:
      return inventoryStore.items
  }
})

// Empty state messages
const emptyIcon = computed(() => {
  const icons: Record<string, string> = {
    all: '📦',
    equipped: '🎒',
    weapons: '🗡️',
    armor: '🛡️',
    misc: '💎',
  }
  return icons[activeTab.value] || '📦'
})

const emptyMessage = computed(() => {
  const messages: Record<string, string> = {
    all: 'Inventář je prázdný',
    equipped: 'Žádné nasazené předměty',
    weapons: 'Žádné zbraně',
    armor: 'Žádná zbroj',
    misc: 'Žádné ostatní předměty',
  }
  return messages[activeTab.value] || 'Žádné předměty'
})

// Check if there are any bonuses
const hasBonuses = computed(() => {
  return Object.keys(inventoryStore.equippedBonuses).length > 0
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

// Load inventory on mount
async function loadInventory() {
  if (props.characterId) {
    await inventoryStore.loadInventory(props.characterId)
  }
}

onMounted(loadInventory)

// Reload when characterId changes
watch(
  () => props.characterId,
  (newId) => {
    if (newId) {
      loadInventory()
    }
  }
)

// Action handlers
async function handleEquip(itemId: string) {
  await inventoryStore.equipItem(props.characterId, itemId)
}

async function handleUnequip(itemId: string) {
  await inventoryStore.unequipItem(props.characterId, itemId)
}

async function handleAttune(itemId: string) {
  await inventoryStore.attuneItem(props.characterId, itemId)
}

async function handleUnattune(itemId: string) {
  await inventoryStore.unattuneItem(props.characterId, itemId)
}

async function handleDelete(itemId: string) {
  await inventoryStore.removeItem(props.characterId, itemId)
}
</script>

<style scoped>
/* Custom scrollbar */
div::-webkit-scrollbar {
  width: 6px;
}

div::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

div::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

div::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
