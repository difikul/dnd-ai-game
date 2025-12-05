<script setup lang="ts">
import { computed } from 'vue'
import type { AbilityScoreName } from '@/types/character'
import { calculateModifier, formatModifier, getAbilityLabel } from '@/utils/dndCalculations'

interface Props {
  ability: AbilityScoreName
  score: number
  highlighted?: boolean
  equipmentBonus?: number  // Bonus z vybavení pro vizuální indikaci
}

const props = withDefaults(defineProps<Props>(), {
  highlighted: false,
  equipmentBonus: 0,
})

const modifier = computed(() => calculateModifier(props.score))
const modifierDisplay = computed(() => formatModifier(modifier.value))
const abilityLabel = computed(() => getAbilityLabel(props.ability))
const hasBonus = computed(() => props.equipmentBonus > 0)
</script>

<template>
  <div
    class="stat-block relative flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-300"
    :class="{
      'bg-dark-800 hover:bg-dark-700': !highlighted && !hasBonus,
      'bg-primary-600 hover:bg-primary-500': highlighted && !hasBonus,
      'ring-2 ring-fantasy-gold': highlighted && !hasBonus,
      'ring-2 ring-fantasy-emerald bg-dark-800/90': hasBonus,
    }"
    :title="hasBonus ? `Zahrnuje +${equipmentBonus} z vybavení` : undefined"
  >
    <!-- Equipment Bonus Badge -->
    <div
      v-if="hasBonus"
      class="absolute -top-2 -right-2 px-2 py-0.5 bg-fantasy-emerald text-white text-xs font-bold rounded-full shadow-lg"
    >
      +{{ equipmentBonus }}
    </div>

    <!-- Ability Label -->
    <div class="text-xs font-semibold uppercase tracking-wider mb-2"
      :class="hasBonus ? 'text-fantasy-emerald' : 'text-gray-400'"
    >
      {{ abilityLabel }}
    </div>

    <!-- Score -->
    <div class="text-4xl font-bold mb-2"
      :class="hasBonus ? 'text-fantasy-emerald' : 'text-white'"
    >
      {{ score }}
    </div>

    <!-- Modifier -->
    <div
      class="absolute bottom-2 px-3 py-1 rounded-full text-sm font-semibold"
      :class="{
        'bg-dark-900 text-gray-300': !highlighted && !hasBonus,
        'bg-primary-700 text-white': highlighted && !hasBonus,
        'bg-fantasy-emerald/20 text-fantasy-emerald': hasBonus,
      }"
    >
      {{ modifierDisplay }}
    </div>
  </div>
</template>

<style scoped>
.stat-block {
  min-width: 100px;
  min-height: 120px;
}
</style>
