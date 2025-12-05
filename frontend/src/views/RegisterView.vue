<template>
  <div class="min-h-screen flex items-center justify-center bg-dark-900 px-4 py-8">
    <div class="max-w-md w-full">
      <!-- Logo a nadpis -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gold-400 mb-2">D&D AI Game</h1>
        <p class="text-gray-400">Vytvoření nového účtu</p>
      </div>

      <!-- Formulář -->
      <div class="bg-dark-800 border border-gold-600/30 rounded-lg p-8 shadow-2xl">
        <form @submit.prevent="handleRegister" class="space-y-5">
          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              autocomplete="email"
              data-testid="register-email-input"
              class="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white
                     placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-1
                     focus:ring-gold-500 transition"
              placeholder="vas@email.cz"
              :disabled="authStore.isLoading"
            />
          </div>

          <!-- Uživatelské jméno -->
          <div>
            <label for="username" class="block text-sm font-medium text-gray-300 mb-2">
              Uživatelské jméno
            </label>
            <input
              id="username"
              v-model="formData.username"
              type="text"
              required
              autocomplete="username"
              minlength="3"
              maxlength="20"
              data-testid="register-username-input"
              class="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white
                     placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-1
                     focus:ring-gold-500 transition"
              placeholder="vasejmeno"
              :disabled="authStore.isLoading"
            />
            <p class="text-gray-500 text-xs mt-1">3-20 znaků</p>
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
              autocomplete="new-password"
              minlength="6"
              data-testid="register-password-input"
              class="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white
                     placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-1
                     focus:ring-gold-500 transition"
              placeholder="Minimálně 6 znaků"
              :disabled="authStore.isLoading"
            />
          </div>

          <!-- Potvrzení hesla -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-300 mb-2">
              Potvrzení hesla
            </label>
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              type="password"
              required
              autocomplete="new-password"
              data-testid="register-confirm-password-input"
              class="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white
                     placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-1
                     focus:ring-gold-500 transition"
              placeholder="Zadejte heslo znovu"
              :disabled="authStore.isLoading"
            />
            <p v-if="passwordMismatch" class="text-red-400 text-xs mt-1">
              Hesla se neshodují
            </p>
          </div>

          <!-- Gemini API Key (volitelné) -->
          <div>
            <label for="geminiApiKey" class="block text-sm font-medium text-gray-300 mb-2">
              Gemini API klíč (volitelné)
            </label>
            <input
              id="geminiApiKey"
              v-model="formData.geminiApiKey"
              type="password"
              autocomplete="off"
              data-testid="register-gemini-api-key-input"
              class="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white
                     placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-1
                     focus:ring-gold-500 transition"
              placeholder="Můžete přidat později v nastavení"
              :disabled="authStore.isLoading"
            />
            <p class="text-gray-500 text-xs mt-1">
              Potřebujete vlastní API klíč pro hraní (lze přidat později)
            </p>
          </div>

          <!-- Error message -->
          <div v-if="authStore.error" class="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
            <p class="text-red-400 text-sm">{{ authStore.error }}</p>
          </div>

          <!-- Validation error -->
          <div v-if="validationError" class="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
            <p class="text-red-400 text-sm">{{ validationError }}</p>
          </div>

          <!-- Submit button -->
          <button
            type="submit"
            :disabled="authStore.isLoading || passwordMismatch"
            data-testid="submit-registration-button"
            class="w-full bg-gold-600 hover:bg-gold-700 disabled:bg-gray-600 disabled:cursor-not-allowed
                   text-dark-900 font-bold py-3 px-6 rounded-lg transition-colors duration-200
                   shadow-lg hover:shadow-gold-500/50"
          >
            <span v-if="!authStore.isLoading">Zaregistrovat se</span>
            <span v-else class="flex items-center justify-center">
              <svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Registruji...
            </span>
          </button>
        </form>

        <!-- Link na login -->
        <div class="mt-6 text-center">
          <p class="text-gray-400 text-sm">
            Už máte účet?
            <router-link
              to="/login"
              class="text-gold-400 hover:text-gold-300 font-medium transition"
            >
              Přihlaste se
            </router-link>
          </p>
        </div>
      </div>

      <!-- Info o Gemini API -->
      <div class="mt-6 bg-dark-800/50 border border-gold-600/20 rounded-lg p-4">
        <p class="text-gray-400 text-xs text-center mb-2">
          <strong class="text-gold-400">Jak získat Gemini API klíč?</strong>
        </p>
        <ol class="text-gray-400 text-xs space-y-1 list-decimal list-inside">
          <li>Navštivte <a href="https://makersuite.google.com/app/apikey" target="_blank" class="text-gold-400 hover:underline">Google AI Studio</a></li>
          <li>Vytvořte nový API klíč (zdarma)</li>
          <li>Zkopírujte klíč a vložte ho sem nebo do nastavení profilu</li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const formData = reactive({
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  geminiApiKey: ''
})

const validationError = ref<string | null>(null)

const passwordMismatch = computed(() => {
  return formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword
})

// Pokud je už přihlášený, přesměruj na home
onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push('/')
  }
})

async function handleRegister() {
  authStore.clearError()
  validationError.value = null

  // Validace
  if (formData.password !== formData.confirmPassword) {
    validationError.value = 'Hesla se neshodují'
    return
  }

  if (formData.password.length < 6) {
    validationError.value = 'Heslo musí mít alespoň 6 znaků'
    return
  }

  if (formData.username.length < 3 || formData.username.length > 20) {
    validationError.value = 'Uživatelské jméno musí mít 3-20 znaků'
    return
  }

  try {
    await authStore.register({
      email: formData.email,
      username: formData.username,
      password: formData.password,
      geminiApiKey: formData.geminiApiKey || undefined
    })

    // Úspěšná registrace → redirect na home
    router.push('/')
  } catch (error) {
    // Error už je nastavený v authStore
    console.error('Registration failed:', error)
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
