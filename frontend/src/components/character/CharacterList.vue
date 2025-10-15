<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCharacterStore } from '@/stores/characterStore'
import { getRaceInfo } from '@/constants/races'
import { getClassInfo } from '@/constants/classes'

const router = useRouter()
const characterStore = useCharacterStore()

const characters = computed(() => characterStore.characters)
const isLoading = computed(() => characterStore.isLoading)
const hasError = computed(() => characterStore.hasError)

onMounted(async () => {
  try {
    await characterStore.loadAllCharacters()
  } catch (error) {
    console.error('Failed to load characters:', error)
  }
})

function selectCharacter(id: string) {
  router.push({ name: 'game', params: { id } })
}

function createNewCharacter() {
  router.push({ name: 'create-character' })
}
</script>

<template>
  <div class="character-list">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-3xl font-display font-bold text-white">Tvé postavy</h2>
      <button
        type="button"
        class="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
        @click="createNewCharacter"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Nová postava
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-20">
      <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-primary-500" />
    </div>

    <!-- Error State -->
    <div
      v-else-if="hasError"
      class="bg-fantasy-ruby bg-opacity-10 border-2 border-fantasy-ruby rounded-lg p-6 text-center"
    >
      <p class="text-fantasy-ruby font-semibold mb-4">{{ characterStore.error }}</p>
      <button
        type="button"
        class="px-4 py-2 bg-fantasy-ruby hover:bg-red-600 text-white font-semibold rounded transition-colors"
        @click="characterStore.loadAllCharacters()"
      >
        Zkusit znovu
      </button>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="characters.length === 0"
      class="text-center py-20 bg-dark-800 rounded-lg border-2 border-dark-700"
    >
      <div class="text-6xl mb-4">🎭</div>
      <h3 class="text-2xl font-bold text-white mb-3">Žádné postavy</h3>
      <p class="text-gray-400 mb-6">Vytvoř svou první postavu a začni dobrodružství!</p>
      <button
        type="button"
        class="px-8 py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-lg transition-colors"
        @click="createNewCharacter"
      >
        Vytvořit postavu
      </button>
    </div>

    <!-- Character Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <button
        v-for="character in characters"
        :key="character.id"
        type="button"
        class="character-card group bg-dark-800 hover:bg-dark-700 border-2 border-dark-600 hover:border-primary-500 rounded-lg p-6 transition-all duration-300 text-left"
        @click="selectCharacter(character.id)"
      >
        <!-- Avatar & Name -->
        <div class="flex items-center gap-4 mb-4">
          <div
            class="w-16 h-16 rounded-full bg-dark-700 flex items-center justify-center text-3xl border-2 border-primary-500"
          >
            <img
              v-if="character.avatarUrl"
              :src="character.avatarUrl"
              :alt="character.name"
              class="w-full h-full rounded-full object-cover"
            />
            <span v-else>{{ getRaceInfo(character.race).icon }}</span>
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-bold text-white group-hover:text-primary-400 transition-colors">
              {{ character.name }}
            </h3>
            <p class="text-sm text-gray-400">
              {{ character.race }} {{ character.class }}
            </p>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-4 mb-4">
          <div class="text-center">
            <p class="text-xs text-gray-500 uppercase mb-1">Level</p>
            <p class="text-lg font-bold text-fantasy-gold">{{ character.level }}</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-gray-500 uppercase mb-1">HP</p>
            <p class="text-lg font-bold text-fantasy-ruby">
              {{ character.hitPoints }}/{{ character.maxHitPoints }}
            </p>
          </div>
          <div class="text-center">
            <p class="text-xs text-gray-500 uppercase mb-1">AC</p>
            <p class="text-lg font-bold text-fantasy-sapphire">{{ character.armorClass }}</p>
          </div>
        </div>

        <!-- Class Icon -->
        <div class="flex items-center justify-between">
          <span class="text-3xl">{{ getClassInfo(character.class).icon }}</span>
          <span class="text-sm text-gray-500">
            {{ new Date(character.updatedAt).toLocaleDateString('cs-CZ') }}
          </span>
        </div>

        <!-- Hover Effect -->
        <div
          class="absolute inset-0 bg-gradient-to-br from-primary-600 to-transparent opacity-0 group-hover:opacity-10 transition-opacity rounded-lg pointer-events-none"
        />
      </button>
    </div>
  </div>
</template>

<style scoped>
.character-card {
  position: relative;
  cursor: pointer;
}

.character-card:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.5);
}
</style>
