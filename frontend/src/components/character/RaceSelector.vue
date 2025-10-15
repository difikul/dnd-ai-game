<script setup lang="ts">
import { computed } from 'vue'
import type { CharacterRace } from '@/types/character'
import { getAllRaces } from '@/constants/races'

interface Props {
  modelValue: CharacterRace | null
}

interface Emits {
  (e: 'update:modelValue', value: CharacterRace): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const races = computed(() => getAllRaces())

function selectRace(race: CharacterRace) {
  emit('update:modelValue', race)
}

function isSelected(race: CharacterRace): boolean {
  return props.modelValue === race
}
</script>

<template>
  <div class="race-selector">
    <h3 class="text-2xl font-display font-bold text-white mb-6">Vyber rasu</h3>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <button
        v-for="race in races"
        :key="race.name"
        type="button"
        class="race-card group relative p-6 rounded-lg border-2 transition-all duration-300 text-left"
        :class="{
          'border-dark-600 bg-dark-800 hover:bg-dark-700 hover:border-dark-500': !isSelected(
            race.name
          ),
          'border-fantasy-gold bg-primary-600 hover:bg-primary-500': isSelected(race.name),
        }"
        @click="selectRace(race.name)"
      >
        <!-- Icon -->
        <div class="text-5xl mb-4 text-center">{{ race.icon }}</div>

        <!-- Name -->
        <h4 class="text-xl font-bold text-white mb-2 text-center">{{ race.name }}</h4>

        <!-- Description -->
        <p class="text-sm text-gray-300 mb-4 text-center">{{ race.description }}</p>

        <!-- Ability Bonuses -->
        <div class="space-y-1">
          <p class="text-xs font-semibold text-gray-400 uppercase">Bonusy:</p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(bonus, ability) in race.abilityBonuses"
              :key="ability"
              class="px-2 py-1 rounded text-xs font-semibold"
              :class="{
                'bg-dark-700 text-fantasy-gold': !isSelected(race.name),
                'bg-primary-700 text-white': isSelected(race.name),
              }"
            >
              {{ ability.toString().toUpperCase().slice(0, 3) }} +{{ bonus }}
            </span>
          </div>
        </div>

        <!-- Selection indicator -->
        <div
          v-if="isSelected(race.name)"
          class="absolute top-2 right-2 bg-fantasy-gold text-dark-900 rounded-full p-1"
        >
          <svg
            class="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.race-card {
  cursor: pointer;
}

.race-card:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.3);
}
</style>
