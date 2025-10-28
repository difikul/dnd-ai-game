<template>
  <div class="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-4 sm:p-6 lg:p-8">
    <!-- Header -->
    <header class="mb-8">
      <div class="max-w-7xl mx-auto">
        <button
          @click="router.push('/')"
          class="mb-4 text-gray-400 hover:text-white transition flex items-center gap-2"
        >
          <span>←</span>
          <span>Zpět na úvod</span>
        </button>

        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl sm:text-4xl font-display text-primary-500 mb-2">
              Uložené Hry
            </h1>
            <p class="text-gray-400">
              {{ savedGames.length }}
              {{ savedGames.length === 1 ? 'uložená hra' : savedGames.length < 5 ? 'uložené hry' : 'uložených her' }}
            </p>
          </div>

          <button
            v-if="!loading && savedGames.length > 0"
            @click="loadSavedGamesWrapper"
            class="px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition flex items-center gap-2"
            title="Obnovit seznam"
          >
            <span>🔄</span>
            <span class="hidden sm:inline">Obnovit</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="max-w-7xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="i in 3"
          :key="i"
          class="bg-dark-800 border border-dark-700 rounded-lg p-6 animate-pulse"
        >
          <div class="h-6 bg-dark-700 rounded w-3/4 mb-4" />
          <div class="h-4 bg-dark-700 rounded w-1/2 mb-3" />
          <div class="h-4 bg-dark-700 rounded w-2/3 mb-3" />
          <div class="h-4 bg-dark-700 rounded w-1/2" />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="max-w-2xl mx-auto bg-dark-800 border border-red-900 rounded-lg p-8 text-center"
    >
      <div class="text-6xl mb-4">⚠️</div>
      <h2 class="text-2xl font-display text-red-500 mb-4">Chyba při načítání her</h2>
      <p class="text-red-400 mb-6">{{ error }}</p>
      <div class="flex gap-4 justify-center">
        <button
          @click="loadSavedGamesWrapper"
          class="px-6 py-3 bg-primary-500 hover:bg-primary-600 rounded-lg transition"
        >
          Zkusit znovu
        </button>
        <button
          @click="router.push('/')"
          class="px-6 py-3 bg-dark-700 hover:bg-dark-600 rounded-lg transition"
        >
          Zpět
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="savedGames.length === 0"
      class="max-w-2xl mx-auto bg-dark-800 border border-dark-700 rounded-lg p-12 text-center"
    >
      <div class="text-6xl mb-6">📭</div>
      <h2 class="text-2xl font-display text-gray-300 mb-4">Žádné uložené hry</h2>
      <p class="text-gray-400 mb-8">
        Začni nové dobrodružství a ulož si svůj postup pro pozdější pokračování.
      </p>
      <button
        @click="router.push('/create-character')"
        class="px-8 py-3 bg-primary-500 hover:bg-primary-600 rounded-lg font-semibold transition inline-flex items-center gap-2"
      >
        <span>🎭</span>
        <span>Začít novou hru</span>
      </button>
    </div>

    <!-- Saved Games Grid -->
    <div v-else class="max-w-7xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div
          v-for="game in savedGames"
          :key="game.sessionId"
          class="bg-dark-800 border border-dark-700 rounded-lg p-6 hover:border-primary-500/50 transition-all duration-300 group"
        >
          <!-- Character Info -->
          <div class="mb-4">
            <h3 class="text-xl font-display text-primary-400 group-hover:text-primary-300 transition mb-2">
              {{ game.characterName }}
            </h3>
            <div class="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <span>Level {{ game.characterLevel }}</span>
            </div>
          </div>

          <!-- Location & Time -->
          <div class="mb-4 space-y-1">
            <div class="flex items-start gap-2 text-sm">
              <span class="text-gray-500">📍</span>
              <span class="text-gray-300 flex-1">{{ game.currentLocation || 'Neznámá lokace' }}</span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <span class="text-gray-500">🕐</span>
              <span class="text-gray-400">{{ formatDate(game.lastPlayedAt) }}</span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <span class="text-gray-500">💬</span>
              <span class="text-gray-400">{{ game.messageCount }} zpráv</span>
            </div>
          </div>

          <!-- Status Badge -->
          <div class="mb-4">
            <span
              v-if="game.isActive"
              class="inline-flex items-center gap-1 px-2 py-1 bg-green-900/30 border border-green-700 text-green-400 text-xs rounded"
            >
              <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Aktivní
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1 px-2 py-1 bg-gray-900/30 border border-gray-700 text-gray-400 text-xs rounded"
            >
              <span class="w-2 h-2 bg-gray-500 rounded-full" />
              Ukončená
            </span>
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <button
              @click="handleLoadGame(game.sessionToken)"
              class="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg font-semibold transition"
            >
              Načíst
            </button>
            <button
              @click="handleCopyToken(game.sessionToken)"
              class="px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition"
              :title="copiedToken === game.sessionToken ? 'Zkopírováno!' : 'Kopírovat token'"
            >
              {{ copiedToken === game.sessionToken ? '✓' : '📋' }}
            </button>
            <button
              @click="handleDeleteGame(game)"
              class="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition"
              title="Smazat hru"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="deleteConfirmGame"
        class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        @click.self="deleteConfirmGame = null"
      >
        <div class="bg-dark-800 rounded-lg p-6 max-w-md w-full border border-red-900">
          <h2 class="text-2xl font-display text-red-500 mb-4">Smazat hru?</h2>

          <p class="text-gray-300 mb-2">
            Opravdu chceš smazat hru s postavou:
          </p>
          <p class="text-primary-400 font-semibold mb-4">
            {{ deleteConfirmGame.characterName }}
          </p>
          <p class="text-gray-400 text-sm mb-6">
            Tuto akci nelze vrátit zpět.
          </p>

          <div class="flex gap-3">
            <button
              @click="confirmDelete"
              :disabled="deleting"
              class="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {{ deleting ? 'Mažu...' : 'Ano, smazat' }}
            </button>
            <button
              @click="deleteConfirmGame = null"
              :disabled="deleting"
              class="flex-1 px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition disabled:opacity-50"
            >
              Zrušit
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia'
import type { SavedGameListItem } from '@/types/game'

const router = useRouter()
const gameStore = useGameStore()
const { savedGames, loading, error } = storeToRefs(gameStore)

// Local state
const copiedToken = ref<string | null>(null)
const deleteConfirmGame = ref<SavedGameListItem | null>(null)
const deleting = ref(false)

/**
 * Format date to Czech readable format
 */
function formatDate(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Právě teď'
  if (diffMins < 60) return `Před ${diffMins} min`
  if (diffHours < 24) return `Před ${diffHours} h`
  if (diffDays < 7) return `Před ${diffDays} dny`

  return d.toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

/**
 * Load game by token
 */
async function handleLoadGame(token: string) {
  try {
    await gameStore.loadGameByToken(token)
    // Navigation handled by store
  } catch (err: any) {
    alert(`Chyba při načítání hry: ${err.message}`)
  }
}

/**
 * Copy token to clipboard
 */
async function handleCopyToken(token: string) {
  try {
    await navigator.clipboard.writeText(token)
    copiedToken.value = token

    setTimeout(() => {
      copiedToken.value = null
    }, 2000)
  } catch (err) {
    console.error('Failed to copy token:', err)
    alert('Nepodařilo se zkopírovat token')
  }
}

/**
 * Show delete confirmation
 */
function handleDeleteGame(game: SavedGameListItem) {
  deleteConfirmGame.value = game
}

/**
 * Confirm and delete game
 */
async function confirmDelete() {
  if (!deleteConfirmGame.value) return

  deleting.value = true
  try {
    await gameStore.deleteGame(deleteConfirmGame.value.sessionId)
    deleteConfirmGame.value = null
  } catch (err: any) {
    alert(`Chyba při mazání hry: ${err.message}`)
  } finally {
    deleting.value = false
  }
}

/**
 * Load saved games on mount
 */
onMounted(async () => {
  await loadSavedGamesWrapper()
})

/**
 * Wrapper for loadSavedGames with error handling
 */
async function loadSavedGamesWrapper() {
  try {
    await gameStore.loadSavedGames()
  } catch (err) {
    console.error('Failed to load saved games:', err)
  }
}
</script>

<style scoped>
/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
