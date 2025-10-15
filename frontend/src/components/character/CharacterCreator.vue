<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCharacterStore } from '@/stores/characterStore'
import type {
  CharacterRace,
  CharacterClass,
  AbilityScores,
  CreateCharacterDto,
  AbilityScoreName,
} from '@/types/character'
import { CreationStep, AbilityScoreMethod } from '@/types/character'
import { ABILITY_SCORES } from '@/types/character'
import {
  calculateModifier,
  calculateMaxHP,
  calculateBaseAC,
  getDefaultAbilityScores,
  getStandardArray,
  calculatePointBuyCost,
  getAbilityFullName,
} from '@/utils/dndCalculations'
import RaceSelector from './RaceSelector.vue'
import ClassSelector from './ClassSelector.vue'

const router = useRouter()
const characterStore = useCharacterStore()

// Creation state
const currentStep = ref<CreationStep>(CreationStep.NameAndRace)
const characterName = ref('')
const selectedRace = ref<CharacterRace | null>(null)
const selectedClass = ref<CharacterClass | null>(null)
const abilityScores = ref<AbilityScores>(getDefaultAbilityScores())
const abilityScoreMethod = ref<AbilityScoreMethod>(AbilityScoreMethod.StandardArray)
const background = ref('')
const avatarUrl = ref('')

// Standard Array assignment
const standardArray = ref<number[]>(getStandardArray())
const assignedScores = ref<Partial<Record<AbilityScoreName, number>>>({})

// Validation
const nameError = ref('')
const isCreating = ref(false)

// Computed
const canProceedStep1 = computed(() => {
  return characterName.value.trim().length >= 3 && selectedRace.value !== null
})

const canProceedStep2 = computed(() => {
  return selectedClass.value !== null
})

const canProceedStep3 = computed(() => {
  if (abilityScoreMethod.value === AbilityScoreMethod.StandardArray) {
    return Object.keys(assignedScores.value).length === 6
  }
  return true
})

const canCreate = computed(() => {
  return canProceedStep1.value && canProceedStep2.value && canProceedStep3.value
})

const totalSteps = 4

const progressPercentage = computed(() => {
  return (currentStep.value / totalSteps) * 100
})

// Point Buy calculations
const pointBuyCost = computed(() => {
  if (abilityScoreMethod.value === AbilityScoreMethod.PointBuy) {
    return calculatePointBuyCost(abilityScores.value)
  }
  return 0
})

const pointBuyRemaining = computed(() => {
  return 27 - pointBuyCost.value
})

// Preview stats
const constitutionModifier = computed(() => {
  const finalScores = getFinalAbilityScores()
  return calculateModifier(finalScores.constitution)
})

const dexterityModifier = computed(() => {
  const finalScores = getFinalAbilityScores()
  return calculateModifier(finalScores.dexterity)
})

const previewMaxHP = computed(() => {
  if (!selectedClass.value) return 0
  return calculateMaxHP(selectedClass.value, constitutionModifier.value)
})

const previewAC = computed(() => {
  return calculateBaseAC(dexterityModifier.value)
})

// Methods
function getFinalAbilityScores(): AbilityScores {
  if (abilityScoreMethod.value === AbilityScoreMethod.StandardArray) {
    return {
      strength: assignedScores.value.strength || 10,
      dexterity: assignedScores.value.dexterity || 10,
      constitution: assignedScores.value.constitution || 10,
      intelligence: assignedScores.value.intelligence || 10,
      wisdom: assignedScores.value.wisdom || 10,
      charisma: assignedScores.value.charisma || 10,
    }
  }
  return abilityScores.value
}

function nextStep() {
  if (currentStep.value === CreationStep.NameAndRace && !canProceedStep1.value) {
    if (characterName.value.trim().length < 3) {
      nameError.value = 'Jméno musí mít alespoň 3 znaky'
    }
    return
  }

  if (currentStep.value === CreationStep.Class && !canProceedStep2.value) {
    return
  }

  if (currentStep.value === CreationStep.AbilityScores && !canProceedStep3.value) {
    return
  }

  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

function previousStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

function assignScore(ability: AbilityScoreName, score: number) {
  // Check if score is already assigned to another ability
  const existingAbility = Object.entries(assignedScores.value).find(
    ([key, value]) => value === score && key !== ability
  )

  if (existingAbility) {
    // Swap scores
    const [existingKey] = existingAbility
    assignedScores.value[existingKey as AbilityScoreName] =
      assignedScores.value[ability]
  }

  assignedScores.value[ability] = score
}

function isScoreAssigned(score: number): boolean {
  return Object.values(assignedScores.value).includes(score)
}

async function createCharacter() {
  if (!canCreate.value) return

  isCreating.value = true
  nameError.value = ''

  try {
    const finalScores = getFinalAbilityScores()

    const characterData: CreateCharacterDto = {
      name: characterName.value.trim(),
      race: selectedRace.value!,
      class: selectedClass.value!,
      ...finalScores,
      background: background.value.trim() || undefined,
      avatarUrl: avatarUrl.value.trim() || undefined,
    }

    const newCharacter = await characterStore.createCharacter(characterData)

    // Navigate to game with new character
    router.push({ name: 'game', params: { id: newCharacter.id } })
  } catch (error) {
    console.error('Failed to create character:', error)
    nameError.value = 'Nepodařilo se vytvořit postavu. Zkuste to znovu.'
  } finally {
    isCreating.value = false
  }
}

// Watch for name changes to clear error
watch(characterName, () => {
  nameError.value = ''
})
</script>

<template>
  <div class="character-creator max-w-6xl mx-auto p-6">
    <!-- Progress Bar -->
    <div class="mb-8">
      <div class="flex justify-between mb-2">
        <span class="text-sm font-semibold text-gray-400">Krok {{ currentStep }} z {{ totalSteps }}</span>
        <span class="text-sm font-semibold text-gray-400">{{ progressPercentage.toFixed(0) }}%</span>
      </div>
      <div class="h-2 bg-dark-700 rounded-full overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-primary-500 to-fantasy-gold transition-all duration-300"
          :style="{ width: `${progressPercentage}%` }"
        />
      </div>
    </div>

    <!-- Step 1: Name and Race -->
    <div v-if="currentStep === CreationStep.NameAndRace" class="animate-fade-in">
      <h2 class="text-3xl font-display font-bold text-white mb-6">Vytvoření postavy</h2>

      <!-- Name Input -->
      <div class="mb-8">
        <label for="characterName" class="block text-sm font-semibold text-gray-300 mb-2">
          Jméno postavy
        </label>
        <input
          id="characterName"
          v-model="characterName"
          type="text"
          class="w-full px-4 py-3 bg-dark-800 border-2 border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
          placeholder="Zadej jméno tvé postavy..."
          maxlength="50"
        />
        <p v-if="nameError" class="mt-2 text-sm text-fantasy-ruby">{{ nameError }}</p>
      </div>

      <!-- Race Selector -->
      <RaceSelector v-model="selectedRace" />
    </div>

    <!-- Step 2: Class -->
    <div v-if="currentStep === CreationStep.Class" class="animate-fade-in">
      <ClassSelector v-model="selectedClass" />
    </div>

    <!-- Step 3: Ability Scores -->
    <div v-if="currentStep === CreationStep.AbilityScores" class="animate-fade-in">
      <h2 class="text-3xl font-display font-bold text-white mb-6">Statistiky</h2>

      <!-- Method Selection -->
      <div class="mb-8">
        <label class="block text-sm font-semibold text-gray-300 mb-3">Metoda přidělení:</label>
        <div class="flex gap-4">
          <button
            type="button"
            class="px-6 py-3 rounded-lg font-semibold transition-all"
            :class="{
              'bg-primary-600 text-white': abilityScoreMethod === AbilityScoreMethod.StandardArray,
              'bg-dark-800 text-gray-300 hover:bg-dark-700':
                abilityScoreMethod !== AbilityScoreMethod.StandardArray,
            }"
            @click="abilityScoreMethod = AbilityScoreMethod.StandardArray"
          >
            Standard Array
          </button>
          <button
            type="button"
            class="px-6 py-3 rounded-lg font-semibold transition-all"
            :class="{
              'bg-primary-600 text-white': abilityScoreMethod === AbilityScoreMethod.PointBuy,
              'bg-dark-800 text-gray-300 hover:bg-dark-700':
                abilityScoreMethod !== AbilityScoreMethod.PointBuy,
            }"
            @click="abilityScoreMethod = AbilityScoreMethod.PointBuy"
          >
            Point Buy
          </button>
        </div>
      </div>

      <!-- Standard Array Assignment -->
      <div v-if="abilityScoreMethod === AbilityScoreMethod.StandardArray">
        <div class="bg-dark-800 rounded-lg p-6 mb-6">
          <h3 class="text-lg font-semibold text-white mb-4">Dostupné hodnoty:</h3>
          <div class="flex flex-wrap gap-3">
            <button
              v-for="score in standardArray"
              :key="score"
              type="button"
              class="px-4 py-2 rounded-lg font-bold transition-all"
              :class="{
                'bg-dark-700 text-gray-400': isScoreAssigned(score),
                'bg-primary-600 text-white hover:bg-primary-500': !isScoreAssigned(score),
              }"
              :disabled="isScoreAssigned(score)"
            >
              {{ score }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div v-for="ability in ABILITY_SCORES" :key="ability" class="bg-dark-800 rounded-lg p-4">
            <label class="block text-sm font-semibold text-gray-300 mb-2">
              {{ getAbilityFullName(ability) }}
            </label>
            <select
              v-model="assignedScores[ability]"
              class="w-full px-3 py-2 bg-dark-700 border-2 border-dark-600 rounded text-white focus:outline-none focus:border-primary-500"
              @change="(e) => assignScore(ability, Number((e.target as HTMLSelectElement).value))"
            >
              <option :value="undefined">Vyber...</option>
              <option v-for="score in standardArray" :key="score" :value="score">
                {{ score }} ({{ calculateModifier(score) >= 0 ? '+' : ''
                }}{{ calculateModifier(score) }})
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Point Buy (simplified for now) -->
      <div v-if="abilityScoreMethod === AbilityScoreMethod.PointBuy">
        <div class="bg-dark-800 rounded-lg p-6 mb-6">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-white">Zbývající body:</h3>
            <span
              class="text-3xl font-bold"
              :class="{
                'text-fantasy-gold': pointBuyRemaining >= 0,
                'text-fantasy-ruby': pointBuyRemaining < 0,
              }"
            >
              {{ pointBuyRemaining }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div v-for="ability in ABILITY_SCORES" :key="ability" class="bg-dark-800 rounded-lg p-4">
            <label class="block text-sm font-semibold text-gray-300 mb-2">
              {{ getAbilityFullName(ability) }}
            </label>
            <input
              v-model.number="abilityScores[ability]"
              type="number"
              min="8"
              max="15"
              class="w-full px-3 py-2 bg-dark-700 border-2 border-dark-600 rounded text-white focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      <!-- Stats Preview -->
      <div class="mt-8 bg-dark-800 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Náhled statistik:</h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="text-gray-400">Max HP:</span>
            <span class="ml-2 text-2xl font-bold text-fantasy-ruby">{{ previewMaxHP }}</span>
          </div>
          <div>
            <span class="text-gray-400">AC:</span>
            <span class="ml-2 text-2xl font-bold text-fantasy-sapphire">{{ previewAC }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 4: Background -->
    <div v-if="currentStep === CreationStep.Background" class="animate-fade-in">
      <h2 class="text-3xl font-display font-bold text-white mb-6">Pozadí postavy</h2>

      <div class="space-y-6">
        <!-- Avatar URL -->
        <div>
          <label for="avatarUrl" class="block text-sm font-semibold text-gray-300 mb-2">
            Avatar URL (volitelné)
          </label>
          <input
            id="avatarUrl"
            v-model="avatarUrl"
            type="text"
            class="w-full px-4 py-3 bg-dark-800 border-2 border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
            placeholder="https://..."
          />
        </div>

        <!-- Background Story -->
        <div>
          <label for="background" class="block text-sm font-semibold text-gray-300 mb-2">
            Příběh postavy (volitelné)
          </label>
          <textarea
            id="background"
            v-model="background"
            rows="8"
            class="w-full px-4 py-3 bg-dark-800 border-2 border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors resize-none"
            placeholder="Napiš příběh své postavy..."
            maxlength="1000"
          />
          <p class="mt-2 text-sm text-gray-400">{{ background.length }} / 1000</p>
        </div>

        <!-- Character Summary -->
        <div class="bg-dark-800 rounded-lg p-6">
          <h3 class="text-xl font-bold text-white mb-4">Shrnutí:</h3>
          <div class="space-y-2 text-gray-300">
            <p><span class="font-semibold">Jméno:</span> {{ characterName }}</p>
            <p><span class="font-semibold">Rasa:</span> {{ selectedRace }}</p>
            <p><span class="font-semibold">Povolání:</span> {{ selectedClass }}</p>
            <p><span class="font-semibold">HP:</span> {{ previewMaxHP }}</p>
            <p><span class="font-semibold">AC:</span> {{ previewAC }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Buttons -->
    <div class="flex justify-between mt-8">
      <button
        type="button"
        class="px-6 py-3 bg-dark-700 hover:bg-dark-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="currentStep === 1"
        @click="previousStep"
      >
        Zpět
      </button>

      <button
        v-if="currentStep < totalSteps"
        type="button"
        class="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="
          (currentStep === CreationStep.NameAndRace && !canProceedStep1) ||
          (currentStep === CreationStep.Class && !canProceedStep2) ||
          (currentStep === CreationStep.AbilityScores && !canProceedStep3)
        "
        @click="nextStep"
      >
        Další
      </button>

      <button
        v-else
        type="button"
        class="px-8 py-3 bg-fantasy-gold hover:bg-yellow-500 text-dark-900 font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="!canCreate || isCreating"
        @click="createCharacter"
      >
        {{ isCreating ? 'Vytváření...' : 'Vytvořit postavu' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.character-creator {
  min-height: 600px;
}
</style>
