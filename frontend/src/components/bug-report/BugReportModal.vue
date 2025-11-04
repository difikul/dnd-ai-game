<template>
  <Transition name="modal">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      @click.self="close"
    >
      <div
        class="bg-dark-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-dark-700"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 class="text-2xl font-bold text-white flex items-center gap-2">
            🐛 Nahlásit chybu
          </h2>
          <button
            @click="close"
            class="text-gray-400 hover:text-white transition-colors"
            aria-label="Zavřít"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
          <!-- Error Message -->
          <div
            v-if="bugReportStore.error"
            class="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3"
          >
            <span class="text-red-500 text-xl">⚠️</span>
            <div class="flex-1">
              <p class="text-red-400 font-semibold">Chyba</p>
              <p class="text-red-300 text-sm mt-1">{{ bugReportStore.error }}</p>
            </div>
            <button
              @click="bugReportStore.clearError()"
              class="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>

          <!-- Email (auto-filled, read-only) -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              :value="authStore.user?.email"
              readonly
              class="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-gray-400 cursor-not-allowed"
            />
          </div>

          <!-- Název -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Název <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.title"
              type="text"
              required
              maxlength="200"
              placeholder="Stručný popis problému"
              class="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
            />
            <p class="text-xs text-gray-500 mt-1">
              {{ form.title.length }}/200 znaků
            </p>
          </div>

          <!-- Kategorie -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Kategorie <span class="text-red-500">*</span>
            </label>
            <div class="grid grid-cols-3 gap-3">
              <label
                v-for="category in categories"
                :key="category.value"
                class="relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all"
                :class="
                  form.category === category.value
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-600 hover:border-dark-500'
                "
              >
                <input
                  v-model="form.category"
                  type="radio"
                  :value="category.value"
                  class="sr-only"
                />
                <div class="text-center">
                  <span class="text-2xl">{{ category.icon }}</span>
                  <p class="text-sm font-medium text-white mt-2">
                    {{ category.label }}
                  </p>
                </div>
              </label>
            </div>
          </div>

          <!-- Závažnost -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Závažnost <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.severity"
              required
              class="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
            >
              <option value="low">Nízká - Kosmetický problém</option>
              <option value="medium">Střední - Ovlivňuje použitelnost</option>
              <option value="high">Vysoká - Blokuje funkci</option>
              <option value="critical">Kritická - Aplikace nefunguje</option>
            </select>
          </div>

          <!-- Popis -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Popis <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="form.description"
              required
              rows="6"
              maxlength="5000"
              placeholder="Detailní popis problému, kroky k reprodukci, očekávané chování..."
              class="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors resize-none"
            ></textarea>
            <p class="text-xs text-gray-500 mt-1">
              {{ form.description.length }}/5000 znaků
            </p>
          </div>

          <!-- Include Current Page -->
          <div class="flex items-start gap-3">
            <input
              v-model="form.includeCurrentPage"
              type="checkbox"
              id="includeCurrentPage"
              class="mt-1 w-4 h-4 text-primary-500 bg-dark-700 border-dark-600 rounded focus:ring-primary-500 focus:ring-offset-0"
            />
            <label for="includeCurrentPage" class="text-sm text-gray-300 cursor-pointer">
              Jedná se o aktuální stránku na které jsem
              <span class="text-gray-500 block text-xs mt-1">
                Zahrne URL aktuální stránky pro lepší debugging
              </span>
            </label>
          </div>

          <!-- Screenshots Upload -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Screenshoty (volitelné)
            </label>
            <div
              class="border-2 border-dashed border-dark-600 rounded-lg p-6 text-center hover:border-dark-500 transition-colors"
            >
              <input
                ref="fileInput"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                multiple
                @change="handleFileSelect"
                class="hidden"
              />
              <button
                type="button"
                @click="$refs.fileInput.click()"
                class="text-primary-400 hover:text-primary-300 font-medium"
              >
                📁 Vybrat soubory
              </button>
              <p class="text-xs text-gray-500 mt-2">
                PNG, JPG nebo JPEG (max 5MB každý, až 5 souborů)
              </p>
            </div>

            <!-- Selected Files Preview -->
            <div v-if="selectedFiles.length > 0" class="mt-4 space-y-2">
              <div
                v-for="(file, index) in selectedFiles"
                :key="index"
                class="flex items-center justify-between p-3 bg-dark-700 rounded-lg"
              >
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <img
                    v-if="file.preview"
                    :src="file.preview"
                    alt="Preview"
                    class="w-12 h-12 object-cover rounded"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-white truncate">{{ file.file.name }}</p>
                    <p class="text-xs text-gray-500">
                      {{ formatFileSize(file.file.size) }}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  @click="removeFile(index)"
                  class="text-red-400 hover:text-red-300 ml-2"
                  aria-label="Odstranit"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-4 border-t border-dark-700">
            <button
              type="button"
              @click="close"
              class="px-6 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
              :disabled="bugReportStore.isSubmitting"
            >
              Zrušit
            </button>
            <button
              type="submit"
              class="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              :disabled="bugReportStore.isSubmitting || !isFormValid"
            >
              <span
                v-if="bugReportStore.isSubmitting"
                class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
              ></span>
              {{ bugReportStore.isSubmitting ? 'Odesílám...' : 'Odeslat' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBugReportStore } from '@/stores/bugReportStore'
import { useAuthStore } from '@/stores/authStore'
import type { BugReportCategory, BugReportSeverity } from '@/types/bugReport'

// ═══════════════════════════════════════════════
// PROPS & EMITS
// ═══════════════════════════════════════════════

interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submitted'): void
}>()

// ═══════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════

const bugReportStore = useBugReportStore()
const authStore = useAuthStore()
const router = useRouter()

const form = ref({
  title: '',
  description: '',
  category: 'bug' as BugReportCategory,
  severity: 'medium' as BugReportSeverity,
  includeCurrentPage: true
})

interface FileWithPreview {
  file: File
  preview: string | null
}

const selectedFiles = ref<FileWithPreview[]>([])
const fileInput = ref<HTMLInputElement | null>(null)

const categories = [
  { value: 'bug', label: 'Chyba', icon: '🐛' },
  { value: 'enhancement', label: 'Vylepšení', icon: '✨' },
  { value: 'other', label: 'Ostatní', icon: '💬' }
]

// ═══════════════════════════════════════════════
// COMPUTED
// ═══════════════════════════════════════════════

const isFormValid = computed(() => {
  return (
    form.value.title.trim().length >= 3 &&
    form.value.description.trim().length >= 10 &&
    form.value.category &&
    form.value.severity
  )
})

// ═══════════════════════════════════════════════
// METHODS
// ═══════════════════════════════════════════════

function close() {
  emit('close')
}

function resetForm() {
  form.value = {
    title: '',
    description: '',
    category: 'bug',
    severity: 'medium',
    includeCurrentPage: true
  }
  selectedFiles.value = []
  bugReportStore.clearError()
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files

  if (!files) return

  // Validace počtu souborů
  if (selectedFiles.value.length + files.length > 5) {
    alert('Můžete nahrát maximálně 5 souborů')
    return
  }

  Array.from(files).forEach(file => {
    // Validace velikosti (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(`Soubor ${file.name} je příliš velký (max 5MB)`)
      return
    }

    // Validace typu
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      alert(`Soubor ${file.name} není podporovaný formát (povoleny PNG, JPG, JPEG)`)
      return
    }

    // Vytvoření preview
    const reader = new FileReader()
    reader.onload = e => {
      selectedFiles.value.push({
        file,
        preview: e.target?.result as string
      })
    }
    reader.readAsDataURL(file)
  })

  // Reset input
  input.value = ''
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1)
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

async function handleSubmit() {
  if (!isFormValid.value) return

  try {
    // Přidáme URL pokud je zaškrtnuto
    const input = {
      ...form.value,
      url: form.value.includeCurrentPage ? window.location.href : undefined
    }

    // Vytvoříme bug report
    const bugReport = await bugReportStore.createBugReport(input)

    // Nahrajeme screenshoty
    if (selectedFiles.value.length > 0) {
      for (const { file } of selectedFiles.value) {
        try {
          await bugReportStore.uploadScreenshot(bugReport.id, file)
        } catch (error) {
          console.error('Chyba při uploadu screenshotu:', error)
          // Pokračujeme dál i když screenshot selže
        }
      }
    }

    // Úspěch
    emit('submitted')
    resetForm()
    close()

    // Zobrazíme success message (můžete použít toast notifikaci)
    alert('Bug report byl úspěšně odeslán. Děkujeme!')
  } catch (error) {
    console.error('Chyba při odesílání bug reportu:', error)
    // Error je už nastaven v store
  }
}

// Reset form při otevření modalu
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    resetForm()
  }
})
</script>

<style scoped>
/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.3s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
}

/* Scrollbar styling */
div::-webkit-scrollbar {
  width: 8px;
}

div::-webkit-scrollbar-track {
  background: #1a1a1a;
  border-radius: 4px;
}

div::-webkit-scrollbar-thumb {
  background: #4a4a4a;
  border-radius: 4px;
}

div::-webkit-scrollbar-thumb:hover {
  background: #5a5a5a;
}
</style>
