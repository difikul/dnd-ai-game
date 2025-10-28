<template>
  <div class="min-h-screen flex items-center justify-center bg-dark-900 px-4">
    <div class="max-w-md w-full">
      <!-- Logo a nadpis -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gold-400 mb-2">D&D AI Game</h1>
        <p class="text-gray-400">Přihlášení do hry</p>
      </div>

      <!-- Formulář -->
      <div class="bg-dark-800 border border-gold-600/30 rounded-lg p-8 shadow-2xl">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Email nebo username -->
          <div>
            <label for="emailOrUsername" class="block text-sm font-medium text-gray-300 mb-2">
              Email nebo uživatelské jméno
            </label>
            <input
              id="emailOrUsername"
              v-model="formData.emailOrUsername"
              type="text"
              required
              autocomplete="username"
              class="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white
                     placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-1
                     focus:ring-gold-500 transition"
              placeholder="Zadejte email nebo username"
              :disabled="authStore.isLoading"
            />
          </div>

          <!-- Heslo -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-300 mb-2">
              Heslo
            </label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              required
              autocomplete="current-password"
              class="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white
                     placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-1
                     focus:ring-gold-500 transition"
              placeholder="Zadejte heslo"
              :disabled="authStore.isLoading"
            />
          </div>

          <!-- Error message -->
          <div v-if="authStore.error" class="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
            <p class="text-red-400 text-sm">{{ authStore.error }}</p>
          </div>

          <!-- Submit button -->
          <button
            type="submit"
            :disabled="authStore.isLoading"
            class="w-full bg-gold-600 hover:bg-gold-700 disabled:bg-gray-600 disabled:cursor-not-allowed
                   text-dark-900 font-bold py-3 px-6 rounded-lg transition-colors duration-200
                   shadow-lg hover:shadow-gold-500/50"
          >
            <span v-if="!authStore.isLoading">Přihlásit se</span>
            <span v-else class="flex items-center justify-center">
              <svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Přihlašuji...
            </span>
          </button>
        </form>

        <!-- Link na registraci -->
        <div class="mt-6 text-center">
          <p class="text-gray-400 text-sm">
            Nemáte účet?
            <router-link
              to="/register"
              class="text-gold-400 hover:text-gold-300 font-medium transition"
            >
              Zaregistrujte se
            </router-link>
          </p>
        </div>
      </div>

      <!-- Info o API klíči -->
      <div class="mt-6 bg-dark-800/50 border border-gold-600/20 rounded-lg p-4">
        <p class="text-gray-400 text-xs text-center">
          💡 Po přihlášení si nezapomeňte nastavit svůj Gemini API klíč v nastavení profilu
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const formData = reactive({
  emailOrUsername: '',
  password: ''
})

// Pokud je už přihlášený, přesměruj na home
onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push('/')
  }
})

async function handleLogin() {
  authStore.clearError()

  try {
    await authStore.login({
      emailOrUsername: formData.emailOrUsername,
      password: formData.password
    })

    // Úspěšné přihlášení → redirect na home
    router.push('/')
  } catch (error) {
    // Error už je nastavený v authStore
    console.error('Login failed:', error)
  }
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
