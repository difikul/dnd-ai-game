<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import CharacterCreator from '@/components/character/CharacterCreator.vue'
import { useCharacterStore } from '@/stores/characterStore'

const router = useRouter()
const characterStore = useCharacterStore()

onMounted(() => {
  // Clear any previous errors when entering the view
  characterStore.clearError()
})
</script>

<template>
  <div class="min-h-screen bg-dark-900 py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="text-5xl font-display font-bold text-white mb-3">Vytvoření Postavy</h1>
        <p class="text-xl text-gray-400">
          Vytvoř svou legendární postavu a vydej se na epické dobrodružství
        </p>
      </div>

      <!-- Error Display -->
      <div
        v-if="characterStore.hasError"
        class="max-w-2xl mx-auto mb-6 bg-fantasy-ruby bg-opacity-10 border-2 border-fantasy-ruby rounded-lg p-4"
      >
        <div class="flex items-center gap-3">
          <svg
            class="w-6 h-6 text-fantasy-ruby flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
          <p class="text-fantasy-ruby font-semibold">{{ characterStore.error }}</p>
          <button
            class="ml-auto text-fantasy-ruby hover:text-red-400 transition-colors"
            @click="characterStore.clearError"
          >
            <svg
              class="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Character Creator Component -->
      <div class="bg-dark-800 rounded-xl shadow-2xl border border-dark-700 overflow-hidden">
        <CharacterCreator />
      </div>

      <!-- Back to Home Link -->
      <div class="text-center mt-8">
        <button
          type="button"
          class="text-gray-400 hover:text-white transition-colors font-semibold"
          @click="router.push('/')"
        >
          ← Zpět na hlavní stránku
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Additional styling if needed */
</style>
