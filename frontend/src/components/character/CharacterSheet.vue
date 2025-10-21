<script setup lang="ts">
import { computed } from 'vue'
import type { Character, AbilityScoreName } from '@/types/character'
import { ABILITY_SCORES } from '@/types/character'
import StatBlock from './StatBlock.vue'
import { getClassInfo } from '@/constants/classes'
import { getRaceInfo } from '@/constants/races'
import {
  calculateProficiencyBonus,
  experienceForLevel,
  getClassPrimaryAbilities,
} from '@/utils/dndCalculations'

interface Props {
  character: Character
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false
})

const raceInfo = computed(() => getRaceInfo(props.character.race))
const classInfo = computed(() => getClassInfo(props.character.class))
const proficiencyBonus = computed(() => calculateProficiencyBonus(props.character.level))
const experienceNeeded = computed(() => experienceForLevel(props.character.level + 1))
const experienceProgress = computed(() => {
  const currentLevelXP = experienceForLevel(props.character.level)
  const nextLevelXP = experienceNeeded.value
  const progress = ((props.character.experience - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
  return Math.max(0, Math.min(100, progress))
})

const hpPercentage = computed(() => {
  return (props.character.hitPoints / props.character.maxHitPoints) * 100
})

const hpColor = computed(() => {
  if (hpPercentage.value > 50) return 'bg-fantasy-emerald'
  if (hpPercentage.value > 25) return 'bg-primary-500'
  return 'bg-fantasy-ruby'
})

const primaryAbilities = computed(() => {
  return getClassPrimaryAbilities(props.character.class)
})

function isHighlighted(ability: AbilityScoreName): boolean {
  return primaryAbilities.value.includes(ability)
}

function getAbilityScore(ability: AbilityScoreName): number {
  return props.character[ability]
}
</script>

<template>
  <div
    class="character-sheet space-y-4"
    :class="compact ? 'p-3' : 'max-w-6xl mx-auto p-6 space-y-6'"
  >
    <!-- Header -->
    <header
      class="bg-dark-800 rounded-lg border-2 border-dark-600"
      :class="compact ? 'p-3' : 'p-6'"
    >
      <div class="flex items-start justify-between">
        <div class="flex items-center" :class="compact ? 'gap-3' : 'gap-6'">
          <!-- Avatar -->
          <div
            class="rounded-full bg-dark-700 flex items-center justify-center border-2 border-primary-500 flex-shrink-0"
            :class="compact ? 'w-12 h-12 text-2xl' : 'w-24 h-24 text-4xl'"
          >
            <img
              v-if="character.avatarUrl"
              :src="character.avatarUrl"
              :alt="character.name"
              class="w-full h-full rounded-full object-cover"
            />
            <span v-else>{{ raceInfo.icon }}</span>
          </div>

          <!-- Basic Info -->
          <div class="min-w-0 flex-1">
            <h1
              class="font-display font-bold text-white break-words"
              :class="compact ? 'text-xl mb-1' : 'text-4xl mb-2'"
            >
              {{ character.name }}
            </h1>
            <p
              class="text-gray-300 break-words"
              :class="compact ? 'text-sm mb-1' : 'text-xl mb-1'"
            >
              <span class="text-primary-400">{{ character.race }}</span>
              {{ character.class }} - Úroveň {{ character.level }}
            </p>
            <div
              class="flex gap-2 text-gray-400 flex-wrap"
              :class="compact ? 'text-xs' : 'text-sm gap-4'"
            >
              <span>{{ classInfo.icon }} {{ classInfo.hitDice }}</span>
              <span>⚔️ +{{ proficiencyBonus }}</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Combat Stats -->
    <section class="grid gap-3" :class="compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3 gap-4'">
      <!-- HP -->
      <div
        class="bg-dark-800 rounded-lg border-2 border-dark-600"
        :class="compact ? 'p-3' : 'p-6'"
      >
        <h3 class="text-xs font-semibold text-gray-400 uppercase mb-2">Body života</h3>
        <div class="flex items-center justify-center gap-2 mb-2">
          <span
            class="font-bold text-fantasy-ruby"
            :class="compact ? 'text-3xl' : 'text-5xl'"
          >
            {{ character.hitPoints }}
          </span>
          <span class="text-gray-500" :class="compact ? 'text-lg' : 'text-2xl'">/</span>
          <span
            class="text-gray-400"
            :class="compact ? 'text-2xl' : 'text-3xl'"
          >
            {{ character.maxHitPoints }}
          </span>
        </div>
        <div class="h-2 bg-dark-700 rounded-full overflow-hidden">
          <div
            class="h-full transition-all duration-300"
            :class="hpColor"
            :style="{ width: `${hpPercentage}%` }"
          />
        </div>
      </div>

      <!-- AC -->
      <div
        class="bg-dark-800 rounded-lg border-2 border-dark-600"
        :class="compact ? 'p-3' : 'p-6'"
      >
        <h3 class="text-xs font-semibold text-gray-400 uppercase mb-2">Obranné číslo</h3>
        <div class="flex items-center justify-center">
          <div class="relative">
            <svg
              class="text-dark-700"
              :class="compact ? 'w-20 h-20' : 'w-32 h-32'"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                stroke-width="8"
              />
            </svg>
            <div
              class="absolute inset-0 flex items-center justify-center font-bold text-fantasy-sapphire"
              :class="compact ? 'text-3xl' : 'text-5xl'"
            >
              {{ character.armorClass }}
            </div>
          </div>
        </div>
      </div>

      <!-- XP -->
      <div
        class="bg-dark-800 rounded-lg border-2 border-dark-600"
        :class="compact ? 'p-3' : 'p-6'"
      >
        <h3 class="text-xs font-semibold text-gray-400 uppercase mb-2">Zkušenosti</h3>
        <div class="text-center mb-2">
          <span
            class="font-bold text-fantasy-gold"
            :class="compact ? 'text-xl' : 'text-3xl'"
          >
            {{ character.experience }}
          </span>
          <span class="text-gray-500 text-sm"> / {{ experienceNeeded }}</span>
        </div>
        <div class="h-2 bg-dark-700 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-primary-500 to-fantasy-gold transition-all duration-300"
            :style="{ width: `${experienceProgress}%` }"
          />
        </div>
        <p class="text-xs text-gray-500 text-center mt-1">Do další úrovně</p>
      </div>
    </section>

    <!-- Ability Scores -->
    <section
      class="bg-dark-800 rounded-lg border-2 border-dark-600"
      :class="compact ? 'p-3' : 'p-6'"
    >
      <h2
        class="font-display font-bold text-white mb-4"
        :class="compact ? 'text-lg' : 'text-2xl mb-6'"
      >
        Vlastnosti
      </h2>
      <div
        class="grid gap-3"
        :class="compact ? 'grid-cols-2 gap-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4'"
      >
        <StatBlock
          v-for="ability in ABILITY_SCORES"
          :key="ability"
          :ability="ability"
          :score="getAbilityScore(ability)"
          :highlighted="isHighlighted(ability)"
        />
      </div>
    </section>

    <!-- Background -->
    <section
      v-if="character.background && !compact"
      class="bg-dark-800 rounded-lg p-6 border-2 border-dark-600"
    >
      <h2 class="text-2xl font-display font-bold text-white mb-4">Příběh</h2>
      <p class="text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
        {{ character.background }}
      </p>
    </section>

    <!-- Race & Class Info -->
    <section v-if="!compact" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Race Info -->
      <div class="bg-dark-800 rounded-lg p-6 border-2 border-dark-600">
        <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span class="text-3xl">{{ raceInfo.icon }}</span>
          {{ raceInfo.name }}
        </h3>
        <p class="text-gray-300 mb-4">{{ raceInfo.description }}</p>
        <div>
          <h4 class="text-sm font-semibold text-gray-400 uppercase mb-2">Rasové vlastnosti:</h4>
          <ul class="space-y-1">
            <li v-for="trait in raceInfo.traits" :key="trait" class="text-sm text-gray-300">
              <span class="text-fantasy-emerald">•</span> {{ trait }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Class Info -->
      <div class="bg-dark-800 rounded-lg p-6 border-2 border-dark-600">
        <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span class="text-3xl">{{ classInfo.icon }}</span>
          {{ classInfo.name }}
        </h3>
        <p class="text-gray-300 mb-4">{{ classInfo.description }}</p>
        <div class="space-y-3">
          <div>
            <h4 class="text-sm font-semibold text-gray-400 uppercase mb-1">Hit Dice:</h4>
            <span class="text-fantasy-ruby font-bold">{{ classInfo.hitDice }}</span>
          </div>
          <div>
            <h4 class="text-sm font-semibold text-gray-400 uppercase mb-1">
              Primární vlastnosti:
            </h4>
            <div class="flex gap-2">
              <span
                v-for="ability in classInfo.primaryAbilities"
                :key="ability"
                class="px-2 py-1 bg-primary-700 text-white text-xs font-semibold rounded"
              >
                {{ ability.toUpperCase().slice(0, 3) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.character-sheet {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
