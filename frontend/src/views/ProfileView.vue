<template>
  <div class="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 px-4 py-8">
    <div class="max-w-2xl mx-auto">
      <!-- Header s navigací zpět -->
      <div class="mb-8">
        <button
          @click="router.push('/')"
          class="flex items-center gap-2 text-gray-400 hover:text-gold-400 transition-colors"
        >
          <span class="text-xl">←</span>
          <span>Zpět na domovskou stránku</span>
        </button>
      </div>

      <!-- Page Title -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gold-400 mb-2">Uživatelský profil</h1>
        <p class="text-gray-400">Správa vašeho účtu a nastavení</p>
      </div>

      <!-- Section 1: Informace o profilu (read-only) -->
      <section class="bg-dark-800 border border-gold-600/30 rounded-lg p-6 mb-6 shadow-2xl">
        <h2 class="text-2xl font-bold text-gold-400 mb-4 flex items-center gap-2">
          <span>👤</span>
          <span>Informace o profilu</span>
        </h2>

        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <span class="text-gray-500 w-32 flex-shrink-0">Email:</span>
            <span class="text-gray-300">{{ authStore.user?.email }}</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-gray-500 w-32 flex-shrink-0">Uživatelské jméno:</span>
            <span class="text-gray-300 font-medium">{{ authStore.user?.username }}</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-gray-500 w-32 flex-shrink-0">Role:</span>
            <span class="text-gray-300">{{ roleLabel }}</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-gray-500 w-32 flex-shrink-0">Datum registrace:</span>
            <span class="text-gray-300">{{ formattedCreatedDate }}</span>
          </div>
          <div v-if="authStore.user?.lastLoginAt" class="flex items-start gap-3">
            <span class="text-gray-500 w-32 flex-shrink-0">Poslední přihlášení:</span>
            <span class="text-gray-300">{{ formattedLastLogin }}</span>
          </div>
        </div>
      </section>

      <!-- Section 2: Gemini API klíč (editovatelné) -->
      <section class="bg-dark-800 border border-gold-600/30 rounded-lg p-6 shadow-2xl">
        <h2 class="text-2xl font-bold text-gold-400 mb-4 flex items-center gap-2">
          <span>🔑</span>
          <span>Gemini API klíč</span>
        </h2>

        <p class="text-gray-400 text-sm mb-6">
          API klíč je potřeba pro generování příběhů a interakci s AI vypravěčem.
          Váš klíč je bezpečně šifrovaný v databázi.
        </p>

        <!-- Stav API klíče -->
        <div v-if="!showChangeForm" class="mb-6">
          <div class="flex items-center gap-3 mb-4">
            <span class="text-sm text-gray-500">Status:</span>
            <span v-if="authStore.hasGeminiKey" class="text-green-400 font-medium">
              ✓ API klíč je nastaven
            </span>
            <span v-else class="text-yellow-400 font-medium">
              ⚠️ API klíč není nastaven
            </span>
          </div>

          <!-- Zobrazení maskovaného klíče pokud existuje -->
          <div v-if="authStore.hasGeminiKey" class="flex items-center gap-3">
            <input
              type="text"
              value="••••••••••••••••••••••••••••••••"
              readonly
              class="flex-1 px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-gray-500 cursor-not-allowed"
            />
            <button
              @click="showChangeForm = true"
              class="px-6 py-3 bg-gold-600 hover:bg-gold-700 text-dark-900 font-semibold rounded-lg transition-colors"
            >
              Změnit klíč
            </button>
          </div>

          <!-- Pokud nemá API klíč, zobrazit button pro přidání -->
          <div v-else>
            <button
              @click="showChangeForm = true"
              class="w-full px-6 py-3 bg-gold-600 hover:bg-gold-700 text-dark-900 font-bold rounded-lg transition-colors"
            >
              Přidat API klíč
            </button>
          </div>
        </div>

        <!-- Formulář pro změnu/přidání API klíče -->
        <form v-if="showChangeForm" @submit.prevent="handleUpdateKey" class="space-y-4">
          <div>
            <label for="geminiApiKey" class="block text-sm font-medium text-gray-300 mb-2">
              {{ authStore.hasGeminiKey ? 'Nový Gemini API klíč' : 'Gemini API klíč' }}
            </label>
            <input
              id="geminiApiKey"
              v-model="formData.geminiApiKey"
              type="password"
              required
              autocomplete="off"
              placeholder="AIzaSy..."
              class="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white
                     placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-1
                     focus:ring-gold-500 transition"
              :disabled="authStore.isLoading"
            />
            <p class="text-gray-500 text-xs mt-2">
              API klíč musí začínat "AIzaSy"
            </p>
          </div>

          <!-- Error message -->
          <div v-if="authStore.error || validationError" class="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
            <p class="text-red-400 text-sm">{{ authStore.error || validationError }}</p>
          </div>

          <!-- Success message -->
          <div v-if="successMessage" class="bg-green-900/30 border border-green-500/50 rounded-lg p-4">
            <p class="text-green-400 text-sm">{{ successMessage }}</p>
          </div>

          <!-- Buttons -->
          <div class="flex gap-3">
            <button
              type="submit"
              :disabled="authStore.isLoading"
              class="flex-1 bg-gold-600 hover:bg-gold-700 disabled:bg-gray-600 disabled:cursor-not-allowed
                     text-dark-900 font-bold py-3 px-6 rounded-lg transition-colors"
            >
              <span v-if="!authStore.isLoading">
                {{ authStore.hasGeminiKey ? 'Uložit nový klíč' : 'Uložit klíč' }}
              </span>
              <span v-else class="flex items-center justify-center">
                <svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Ukládám...
              </span>
            </button>

            <button
              v-if="authStore.hasGeminiKey"
              type="button"
              @click="cancelEdit"
              :disabled="authStore.isLoading"
              class="px-6 py-3 bg-dark-700 hover:bg-dark-600 disabled:bg-gray-700 disabled:cursor-not-allowed
                     text-gray-300 font-semibold rounded-lg transition-colors"
            >
              Zrušit
            </button>
          </div>
        </form>

        <!-- Návod na získání API klíče -->
        <div class="mt-6 bg-dark-800/50 border border-gold-600/20 rounded-lg p-4">
          <p class="text-gray-400 text-xs text-center mb-2">
            <strong class="text-gold-400">Jak získat Gemini API klíč?</strong>
          </p>
          <ol class="text-gray-400 text-xs space-y-1 list-decimal list-inside">
            <li>Navštivte <a href="https://makersuite.google.com/app/apikey" target="_blank" class="text-gold-400 hover:underline">Google AI Studio</a></li>
            <li>Vytvořte nový API klíč (zdarma)</li>
            <li>Zkopírujte klíč a vložte ho sem</li>
          </ol>
        </div>

        <!-- Informace o bezpečnosti -->
        <div class="mt-6 bg-dark-900/50 border border-gold-600/20 rounded-lg p-4">
          <p class="text-gray-400 text-xs">
            <strong class="text-gold-400">🔒 Bezpečnost:</strong>
            Váš API klíč je šifrovaný pomocí AES-256-CBC před uložením do databáze.
            Nikdy ho nesdílíme ani nezobrazujeme v plném znění.
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

// State
const formData = ref({
  geminiApiKey: ''
})
const showChangeForm = ref(false)
const validationError = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Computed properties
const roleLabel = computed(() => {
  return authStore.user?.role === 'admin' ? 'Administrátor' : 'Uživatel'
})

const formattedCreatedDate = computed(() => {
  if (!authStore.user?.createdAt) return '-'
  return new Date(authStore.user.createdAt).toLocaleDateString('cs-CZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const formattedLastLogin = computed(() => {
  if (!authStore.user?.lastLoginAt) return 'Poprvé'
  return new Date(authStore.user.lastLoginAt).toLocaleDateString('cs-CZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

// Methods
async function handleUpdateKey() {
  // Clear previous messages
  validationError.value = null
  successMessage.value = null
  authStore.clearError()

  // Client-side validace
  const apiKey = formData.value.geminiApiKey.trim()

  if (!apiKey) {
    validationError.value = 'API klíč je povinný'
    return
  }

  if (!apiKey.startsWith('AIzaSy')) {
    validationError.value = 'API klíč musí začínat "AIzaSy"'
    return
  }

  if (apiKey.length < 39) {
    validationError.value = 'API klíč je příliš krátký (minimálně 39 znaků)'
    return
  }

  try {
    await authStore.updateGeminiKey(apiKey)

    // Success!
    successMessage.value = '✓ API klíč byl úspěšně uložen'
    formData.value.geminiApiKey = ''

    // Po 2 sekundách skrýt formulář a success message
    setTimeout(() => {
      showChangeForm.value = false
      successMessage.value = null
    }, 2000)
  } catch (error) {
    // Error je už nastavený v authStore.error
    console.error('Failed to update API key:', error)
  }
}

function cancelEdit() {
  showChangeForm.value = false
  formData.value.geminiApiKey = ''
  validationError.value = null
  authStore.clearError()
}
</script>

<style scoped>
/* Dark fantasy theme */
.bg-dark-900 {
  background-color: #0a0a0a;
}

.bg-dark-800 {
  background-color: #1a1a1a;
}

.bg-dark-700 {
  background-color: #2a2a2a;
}

.bg-dark-600 {
  background-color: #3a3a3a;
}

.border-dark-600 {
  border-color: #3a3a3a;
}

.text-gold-400 {
  color: #fbbf24;
}

.text-gold-300 {
  color: #fcd34d;
}

.bg-gold-600 {
  background-color: #d97706;
}

.hover\:bg-gold-700:hover {
  background-color: #b45309;
}

.hover\:text-gold-400:hover {
  color: #fbbf24;
}

.hover\:text-gold-300:hover {
  color: #fcd34d;
}

.border-gold-600\/30 {
  border-color: rgba(217, 119, 6, 0.3);
}

.border-gold-600\/20 {
  border-color: rgba(217, 119, 6, 0.2);
}

.focus\:border-gold-500:focus {
  border-color: #f59e0b;
}

.focus\:ring-gold-500:focus {
  --tw-ring-color: #f59e0b;
}
</style>
