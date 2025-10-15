<script setup lang="ts">
import { computed } from 'vue'
import type { CharacterClass } from '@/types/character'
import { getAllClasses } from '@/constants/classes'
import { getAbilityLabel } from '@/utils/dndCalculations'

interface Props {
  modelValue: CharacterClass | null
}

interface Emits {
  (e: 'update:modelValue', value: CharacterClass): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const classes = computed(() => getAllClasses())

function selectClass(characterClass: CharacterClass) {
  emit('update:modelValue', characterClass)
}

function isSelected(characterClass: CharacterClass): boolean {
  return props.modelValue === characterClass
}
</script>

<template>
  <div class="class-selector">
    <h3 class="text-2xl font-display font-bold text-white mb-6">Vyber povolání</h3>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <button
        v-for="classInfo in classes"
        :key="classInfo.name"
        type="button"
        class="class-card group relative p-6 rounded-lg border-2 transition-all duration-300 text-left"
        :class="{
          'border-dark-600 bg-dark-800 hover:bg-dark-700 hover:border-dark-500': !isSelected(
            classInfo.name
          ),
          'border-fantasy-gold bg-primary-600 hover:bg-primary-500': isSelected(classInfo.name),
        }"
        @click="selectClass(classInfo.name)"
      >
        <!-- Icon -->
        <div class="text-5xl mb-4 text-center">{{ classInfo.icon }}</div>

        <!-- Name -->
        <h4 class="text-xl font-bold text-white mb-2 text-center">{{ classInfo.name }}</h4>

        <!-- Description -->
        <p class="text-sm text-gray-300 mb-4 text-center">{{ classInfo.description }}</p>

        <!-- Hit Dice -->
        <div class="mb-3">
          <p class="text-xs font-semibold text-gray-400 uppercase mb-1">Hit Dice:</p>
          <span
            class="inline-block px-3 py-1 rounded text-sm font-bold"
            :class="{
              'bg-dark-700 text-fantasy-ruby': !isSelected(classInfo.name),
              'bg-primary-700 text-white': isSelected(classInfo.name),
            }"
          >
            {{ classInfo.hitDice }}
          </span>
        </div>

        <!-- Primary Abilities -->
        <div>
          <p class="text-xs font-semibold text-gray-400 uppercase mb-1">Primární:</p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="ability in classInfo.primaryAbilities"
              :key="ability"
              class="px-2 py-1 rounded text-xs font-semibold"
              :class="{
                'bg-dark-700 text-fantasy-emerald': !isSelected(classInfo.name),
                'bg-primary-700 text-white': isSelected(classInfo.name),
              }"
            >
              {{ getAbilityLabel(ability) }}
            </span>
          </div>
        </div>

        <!-- Selection indicator -->
        <div
          v-if="isSelected(classInfo.name)"
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
.class-card {
  cursor: pointer;
  min-height: 320px;
}

.class-card:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.3);
}
</style>
