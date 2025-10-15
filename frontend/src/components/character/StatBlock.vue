<script setup lang="ts">
import { computed } from 'vue'
import type { AbilityScoreName } from '@/types/character'
import { calculateModifier, formatModifier, getAbilityLabel } from '@/utils/dndCalculations'

interface Props {
  ability: AbilityScoreName
  score: number
  highlighted?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  highlighted: false,
})

const modifier = computed(() => calculateModifier(props.score))
const modifierDisplay = computed(() => formatModifier(modifier.value))
const abilityLabel = computed(() => getAbilityLabel(props.ability))
</script>

<template>
  <div
    class="stat-block relative flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-300"
    :class="{
      'bg-dark-800 hover:bg-dark-700': !highlighted,
      'bg-primary-600 hover:bg-primary-500': highlighted,
      'ring-2 ring-fantasy-gold': highlighted,
    }"
  >
    <!-- Ability Label -->
    <div class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
      {{ abilityLabel }}
    </div>

    <!-- Score -->
    <div class="text-4xl font-bold mb-2 text-white">
      {{ score }}
    </div>

    <!-- Modifier -->
    <div
      class="absolute bottom-2 px-3 py-1 rounded-full text-sm font-semibold"
      :class="{
        'bg-dark-900 text-gray-300': !highlighted,
        'bg-primary-700 text-white': highlighted,
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
