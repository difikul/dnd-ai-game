<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-4">
    <div class="max-w-2xl w-full">
      <!-- User Info & Logout -->
      <div class="flex justify-between items-center mb-8 px-2">
        <div class="text-gray-400 text-sm">
          <span class="text-gray-500">Přihlášen jako:</span>
          <span class="text-gold-400 font-medium ml-2">{{ authStore.user?.username }}</span>
          <span v-if="!authStore.hasGeminiKey" class="ml-3 text-yellow-400">
            ⚠️ Chybí Gemini API klíč
          </span>
        </div>
        <button
          @click="handleLogout"
          class="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 hover:text-white text-sm rounded-lg transition-colors"
        >
          Odhlásit se
        </button>
      </div>

      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-5xl sm:text-6xl font-display font-bold text-primary-500 mb-4">
          D&D AI Game
        </h1>
        <p class="text-lg sm:text-xl text-gray-300">
          Zahrajte si Dungeons & Dragons s AI vypravěčem
        </p>
      </div>

      <!-- Main Actions -->
      <div class="space-y-4 mb-8">
        <button
          @click="router.push('/create-character')"
          class="w-full px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-3"
        >
          <span class="text-2xl">🎭</span>
          <span>Nová Hra</span>
        </button>

        <button
          @click="router.push('/saves')"
          class="w-full px-8 py-4 bg-dark-700 hover:bg-dark-600 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-3"
        >
          <span class="text-2xl">💾</span>
          <span>Prohlédnout uložené hry</span>
        </button>
      </div>

      <!-- Divider -->
      <div class="flex items-center gap-4 my-8">
        <div class="flex-1 h-px bg-dark-700" />
        <span class="text-gray-500 text-sm">NEBO</span>
        <div class="flex-1 h-px bg-dark-700" />
      </div>

      <!-- Load by Token Section -->
      <div class="bg-dark-800 border border-dark-700 rounded-lg p-6">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-2xl">🔑</span>
          <h2 class="text-xl font-display text-gray-300">Načíst hru pomocí tokenu</h2>
        </div>

        <p class="text-gray-400 text-sm mb-4">
          Máte token z předchozí hry? Vložte ho zde pro rychlé načtení.
        </p>

        <div class="space-y-3">
          <div>
            <input
              v-model="loadToken"
              type="text"
              placeholder="gs_xxxxxxxxxxxx"
              class="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition"
              @keydown.enter="handleLoadByToken"
              :disabled="loading"
            />
            <p v-if="tokenError" class="text-red-400 text-sm mt-2">
              {{ tokenError }}
            </p>
          </div>

          <button
            @click="handleLoadByToken"
            :disabled="loading || !loadToken.trim()"
            class="w-full px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
          >
            {{ loading ? 'Načítám...' : 'Načíst hru' }}
          </button>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="mt-8 text-center text-gray-500 text-sm">
        <p>
          💡 Token můžete získat uložením hry během hraní
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const gameStore = useGameStore()
const authStore = useAuthStore()

// State
const loadToken = ref('')
const loading = ref(false)
const tokenError = ref('')

/**
 * Logout user and redirect to login
 */
function handleLogout() {
  authStore.logout()
  router.push('/login')
}

/**
 * Validate and load game by token
 */
async function handleLoadByToken() {
  const token = loadToken.value.trim()

  // Validation
  if (!token) {
    tokenError.value = 'Prosím, zadejte token'
    return
  }

  if (!token.startsWith('gs_')) {
    tokenError.value = 'Neplatný formát tokenu. Token by měl začínat "gs_"'
    return
  }

  // Clear previous error
  tokenError.value = ''
  loading.value = true

  try {
    await gameStore.loadGameByToken(token)
    // Navigation is handled by the store
  } catch (err: any) {
    tokenError.value = err.message || 'Nepodařilo se načíst hru. Zkontrolujte token.'
    console.error('Failed to load game by token:', err)
  } finally {
    loading.value = false
  }
}
</script>
