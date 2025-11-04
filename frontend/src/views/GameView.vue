<template>
  <div class="min-h-screen text-white relative">
    <!-- Atmospheric Background -->
    <AtmosphericBackground />

    <!-- Loading State -->
    <div
      v-if="loading"
      class="relative z-10 flex items-center justify-center h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900"
    >
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-4"
        />
        <p class="text-gray-400 text-lg">Načítám hru...</p>
        <p class="text-gray-600 text-sm mt-2">Připravuji herní svět</p>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="relative z-10 flex items-center justify-center h-screen bg-gradient-to-br from-dark-900 via-red-900/10 to-dark-900"
    >
      <div class="text-center max-w-md px-4">
        <div class="text-6xl mb-4">⚠️</div>
        <h2 class="text-2xl font-display text-red-500 mb-4">Chyba při načítání hry</h2>
        <p class="text-red-400 mb-6">{{ error }}</p>
        <button
          @click="router.push('/')"
          class="bg-primary-500 hover:bg-primary-600 px-6 py-3 rounded-lg font-semibold transition"
        >
          Zpět na úvod
        </button>
      </div>
    </div>

    <!-- Game Layout -->
    <div v-else class="relative z-10 h-screen flex flex-col lg:flex-row">
      <!-- Character Sheet Sidebar (Desktop) -->
      <aside
        class="hidden lg:block lg:w-80 xl:w-96 bg-dark-800 border-r border-dark-700 overflow-y-auto"
      >
        <CharacterSheet v-if="character" :character="character" :compact="true" />
      </aside>

      <!-- Mobile Character Sheet Toggle -->
      <div class="lg:hidden">
        <button
          @click="showCharacterSheet = !showCharacterSheet"
          class="w-full bg-dark-800 border-b border-dark-700 px-5 py-4 flex items-center justify-between hover:bg-dark-700 transition"
        >
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <span class="text-xl flex-shrink-0">📋</span>
            <span class="font-semibold truncate">{{ character?.name }}</span>
            <span class="text-sm text-gray-400 flex-shrink-0">Level {{ character?.level }}</span>
          </div>
          <span class="text-gray-400 flex-shrink-0 ml-3">
            {{ showCharacterSheet ? '▼' : '▶' }}
          </span>
        </button>

        <!-- Mobile Character Sheet -->
        <div
          v-if="showCharacterSheet"
          class="bg-dark-800 border-b border-dark-700 max-h-[500px] overflow-y-auto"
        >
          <CharacterSheet v-if="character" :character="character" :compact="true" />
        </div>
      </div>

      <!-- Main Chat Area -->
      <main class="flex-1 flex flex-col min-h-0">
        <!-- Header -->
        <header class="bg-dark-800 border-b border-dark-700 px-4 sm:px-6 py-5 flex-shrink-0">
          <div class="flex items-center justify-between gap-4">
            <div class="min-w-0 flex-1">
              <h1 class="text-xl sm:text-2xl font-display text-primary-500 truncate">
                {{ character?.name }}
              </h1>
              <p class="text-sm text-gray-400 flex items-center gap-2 flex-wrap mt-1">
                <span class="flex items-center gap-1">
                  📍 <span class="truncate">{{ currentLocation || 'Neznámá lokace' }}</span>
                </span>
                <span v-if="session?.isActive" class="text-green-500 flex items-center gap-1">
                  <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Online
                </span>
                <span v-else class="text-gray-500 flex items-center gap-1">
                  <span class="w-2 h-2 bg-gray-500 rounded-full"></span>
                  Offline
                </span>
              </p>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2 flex-shrink-0">
              <button
                @click="showDiceRoller = !showDiceRoller"
                class="px-3 sm:px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition
                       flex items-center gap-2 shadow-sm"
                title="Dice Roller"
              >
                <span class="text-lg">🎲</span>
                <span class="hidden sm:inline">Dice</span>
              </button>

              <button
                @click="handleSaveGame"
                :disabled="saving"
                class="px-3 sm:px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2 shadow-sm"
                title="Uložit hru"
              >
                <span class="text-lg">💾</span>
                <span class="hidden sm:inline">Uložit</span>
              </button>

              <button
                @click="handleLeaveGame"
                class="px-3 sm:px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition
                       flex items-center gap-2 shadow-sm"
                title="Opustit hru"
              >
                <span class="text-lg">🚪</span>
                <span class="hidden sm:inline">Odejít</span>
              </button>
            </div>
          </div>
        </header>

        <!-- Chat Area -->
        <div class="flex-1 overflow-hidden">
          <GameChat @dice-click="handleDiceClickFromChat" />
        </div>
      </main>
    </div>

    <!-- Save Game Modal -->
    <Teleport to="body">
      <div
        v-if="showSaveModal"
        class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        @click.self="showSaveModal = false"
      >
        <div class="bg-dark-800 rounded-lg p-6 max-w-md w-full border border-dark-700">
          <h2 class="text-2xl font-display text-primary-500 mb-4">Hra uložena!</h2>

          <p class="text-gray-300 mb-4">
            Tvoje hra byla úspěšně uložena. Použij tento token pro opětovné načtení:
          </p>

          <div class="bg-dark-900 p-4 rounded border border-dark-700 mb-4">
            <code class="text-primary-400 text-sm break-all">{{ savedToken }}</code>
          </div>

          <div class="flex gap-2">
            <button
              @click="copyToken"
              class="flex-1 bg-primary-500 hover:bg-primary-600 px-4 py-2 rounded transition"
            >
              {{ tokenCopied ? '✓ Zkopírováno' : '📋 Kopírovat token' }}
            </button>
            <button
              @click="showSaveModal = false"
              class="flex-1 bg-dark-700 hover:bg-dark-600 px-4 py-2 rounded transition"
            >
              Zavřít
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Dice Roller Modal -->
    <Teleport to="body">
      <div
        v-if="showDiceRoller"
        class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        @click.self="showDiceRoller = false"
      >
        <div class="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <DiceRoller
            :requirement="chatStore.lastDiceRequirement ?? undefined"
            @roll-result="handleDiceRollResult"
          />
          <button
            @click="showDiceRoller = false"
            class="mt-4 w-full bg-dark-700 hover:bg-dark-600 px-4 py-2 rounded transition text-white"
          >
            Zavřít
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useChatStore } from '@/stores/chatStore'
import { useDice } from '@/composables/useDice'
import type { DiceRequirement } from '@/types/game'
import GameChat from '@/components/game/GameChat.vue'
import CharacterSheet from '@/components/character/CharacterSheet.vue'
import DiceRoller from '@/components/game/DiceRoller.vue'
import AtmosphericBackground from '@/components/game/AtmosphericBackground.vue'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()
const characterStore = useCharacterStore()
const chatStore = useChatStore()
const { rollDice, isRolling: isDiceRolling } = useDice()

// State
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)
const showSaveModal = ref(false)
const savedToken = ref('')
const tokenCopied = ref(false)
const showCharacterSheet = ref(false)
const showDiceRoller = ref(false)

// Computed
const session = computed(() => gameStore.currentSession)
const character = computed(() => characterStore.currentCharacter)
const currentLocation = computed(() => gameStore.currentLocation)

/**
 * Initialize game on mount
 */
onMounted(async () => {
  try {
    const sessionId = route.params.id as string

    if (!sessionId) {
      throw new Error('Chybí ID herní session')
    }

    await gameStore.loadGame(sessionId)

  } catch (err: any) {
    error.value = err.message || 'Nepodařilo se načíst hru'
    console.error('Failed to load game:', err)
  } finally {
    loading.value = false
  }
})

/**
 * Handle save game
 */
async function handleSaveGame() {
  saving.value = true
  tokenCopied.value = false

  try {
    const token = await gameStore.saveGame()
    savedToken.value = token
    showSaveModal.value = true
  } catch (err: any) {
    alert(`Chyba při ukládání hry: ${err.message}`)
  } finally {
    saving.value = false
  }
}

/**
 * Copy token to clipboard
 */
async function copyToken() {
  try {
    await navigator.clipboard.writeText(savedToken.value)
    tokenCopied.value = true

    setTimeout(() => {
      tokenCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy token:', err)
    alert('Nepodařilo se zkopírovat token')
  }
}

/**
 * Handle dice click from chat message (inline dice requirement)
 * Performs immediate dice roll and submits result to chat
 */
async function handleDiceClickFromChat(requirement: DiceRequirement) {
  try {
    console.log('🎲 Hráč klikl na dice requirement:', requirement)

    // Perform dice roll via API
    const roll = await rollDice(requirement.notation, false, false)

    if (!roll) {
      throw new Error('Hod kostkou selhal')
    }

    console.log('🎲 Výsledek hodu:', roll)

    // Submit result to chat with requirement context
    await chatStore.submitDiceResult({
      ...roll,
      // Add requirement context for better formatting
      skillName: requirement.skillName,
      difficultyClass: requirement.difficultyClass,
      description: requirement.description
    } as any)

    console.log('✅ Výsledek hodu byl úspěšně odeslán')
  } catch (err: any) {
    console.error('❌ Chyba při automatickém hodu kostkou:', err)
    alert(`Chyba při hodu kostkou: ${err.message}`)
  }
}

/**
 * Handle dice roll result from DiceRoller component
 * Submits the roll result to the chat and closes the modal
 */
async function handleDiceRollResult(roll: any) {
  try {
    console.log('🎲 Hod kostkou dokončen, odesílám výsledek do konverzace:', roll)

    // Submit dice roll result to chat
    await chatStore.submitDiceResult(roll)

    // Close the dice roller modal
    showDiceRoller.value = false

    console.log('✅ Výsledek hodu byl úspěšně odeslán')
  } catch (err: any) {
    console.error('❌ Chyba při odesílání výsledku hodu:', err)
    alert(`Chyba při odesílání výsledku hodu: ${err.message}`)
  }
}

/**
 * Handle leave game
 */
function handleLeaveGame() {
  if (confirm('Opravdu chceš opustit hru? Nezapomeň uložit!')) {
    chatStore.clearMessages()
    gameStore.clearSession()
    router.push('/')
  }
}
</script>

<style scoped>
/* Custom scrollbar for sidebar */
aside::-webkit-scrollbar {
  width: 8px;
}

aside::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

aside::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

aside::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
