<template>
  <div class="admin-bug-reports">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-3xl font-bold text-white">Bug Reports</h1>
      <button
        @click="refreshReports"
        :disabled="bugReportStore.isLoading"
        class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
      >
        <svg class="w-4 h-4" :class="{ 'animate-spin': bugReportStore.isLoading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Obnovit
      </button>
    </div>

    <!-- Stats Cards -->
    <div v-if="bugReportStore.stats" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-dark-800 border border-dark-700 rounded-lg p-4">
        <p class="text-gray-400 text-sm">Celkem</p>
        <p class="text-3xl font-bold text-white mt-1">{{ bugReportStore.stats.total }}</p>
      </div>
      <div class="bg-dark-800 border border-dark-700 rounded-lg p-4">
        <p class="text-gray-400 text-sm">Otevřené</p>
        <p class="text-3xl font-bold text-yellow-400 mt-1">{{ bugReportStore.stats.open }}</p>
      </div>
      <div class="bg-dark-800 border border-dark-700 rounded-lg p-4">
        <p class="text-gray-400 text-sm">Řeší se</p>
        <p class="text-3xl font-bold text-blue-400 mt-1">{{ bugReportStore.stats.inProgress }}</p>
      </div>
      <div class="bg-dark-800 border border-dark-700 rounded-lg p-4">
        <p class="text-gray-400 text-sm">Vyřešené</p>
        <p class="text-3xl font-bold text-green-400 mt-1">{{ bugReportStore.stats.resolved }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-dark-800 border border-dark-700 rounded-lg p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Status</label>
          <select
            v-model="filters.status"
            @change="applyFilters"
            class="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm"
          >
            <option value="">Všechny</option>
            <option value="open">Otevřené</option>
            <option value="in_progress">Řeší se</option>
            <option value="resolved">Vyřešené</option>
            <option value="closed">Uzavřené</option>
            <option value="wont_fix">Nebude opraveno</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Kategorie</label>
          <select
            v-model="filters.category"
            @change="applyFilters"
            class="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm"
          >
            <option value="">Všechny</option>
            <option value="bug">Chyba</option>
            <option value="enhancement">Vylepšení</option>
            <option value="other">Ostatní</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Závažnost</label>
          <select
            v-model="filters.severity"
            @change="applyFilters"
            class="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm"
          >
            <option value="">Všechny</option>
            <option value="low">Nízká</option>
            <option value="medium">Střední</option>
            <option value="high">Vysoká</option>
            <option value="critical">Kritická</option>
          </select>
        </div>

        <div class="flex items-end">
          <button
            @click="resetFilters"
            class="w-full px-3 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors text-sm"
          >
            Resetovat filtry
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-dark-800 border border-dark-700 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-dark-900 border-b border-dark-700">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID / Název</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Kategorie</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Závažnost</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Uživatel</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Vytvořeno</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Akce</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-dark-700">
            <tr v-if="bugReportStore.isLoading">
              <td colspan="7" class="px-4 py-8 text-center text-gray-400">
                <div class="flex items-center justify-center gap-2">
                  <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Načítání...
                </div>
              </td>
            </tr>

            <tr v-else-if="bugReportStore.reports.length === 0">
              <td colspan="7" class="px-4 py-8 text-center text-gray-400">
                Žádné bug reporty nenalezeny
              </td>
            </tr>

            <tr
              v-else
              v-for="report in bugReportStore.reports"
              :key="report.id"
              class="hover:bg-dark-700 transition-colors"
            >
              <td class="px-4 py-4">
                <div>
                  <p class="text-xs text-gray-500 font-mono">{{ report.id.slice(0, 8) }}</p>
                  <p class="text-sm font-medium text-white mt-1">{{ report.title }}</p>
                </div>
              </td>
              <td class="px-4 py-4">
                <span class="text-sm text-gray-300">{{ getCategoryLabel(report.category as any) }}</span>
              </td>
              <td class="px-4 py-4">
                <span
                  class="text-sm font-medium"
                  :class="getSeverityColor(report.severity as any)"
                >
                  {{ getSeverityLabel(report.severity as any) }}
                </span>
              </td>
              <td class="px-4 py-4">
                <span
                  class="text-xs px-2 py-1 rounded-full font-medium"
                  :class="getStatusBadgeClass(report.status as any)"
                >
                  {{ getStatusLabel(report.status as any) }}
                </span>
              </td>
              <td class="px-4 py-4">
                <span class="text-sm text-gray-300">{{ report.userEmail || 'Neznámý' }}</span>
              </td>
              <td class="px-4 py-4">
                <span class="text-sm text-gray-300">{{ formatDate(report.createdAt) }}</span>
              </td>
              <td class="px-4 py-4">
                <div class="flex items-center gap-2">
                  <button
                    @click="viewReport(report)"
                    class="text-primary-400 hover:text-primary-300 text-sm font-medium"
                  >
                    Detail
                  </button>
                  <button
                    @click="deleteReport(report.id)"
                    class="text-red-400 hover:text-red-300 text-sm font-medium"
                  >
                    Smazat
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="bugReportStore.totalPages > 1"
        class="bg-dark-900 px-4 py-3 border-t border-dark-700 flex items-center justify-between"
      >
        <div class="text-sm text-gray-400">
          Stránka {{ bugReportStore.currentPage }} z {{ bugReportStore.totalPages }}
          (celkem {{ bugReportStore.totalReports }} reportů)
        </div>
        <div class="flex gap-2">
          <button
            @click="previousPage"
            :disabled="bugReportStore.currentPage === 1"
            class="px-3 py-1 bg-dark-700 hover:bg-dark-600 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Předchozí
          </button>
          <button
            @click="nextPage"
            :disabled="bugReportStore.currentPage === bugReportStore.totalPages"
            class="px-3 py-1 bg-dark-700 hover:bg-dark-600 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Další
          </button>
        </div>
      </div>
    </div>

    <!-- Detail Modal (placeholder - můžeme rozšířit) -->
    <div v-if="selectedReport" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" @click.self="closeDetailModal">
      <div class="bg-dark-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-dark-700">
        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <h2 class="text-2xl font-bold text-white">{{ selectedReport.title }}</h2>
            <button @click="closeDetailModal" class="text-gray-400 hover:text-white">✕</button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="text-sm text-gray-400">Popis:</label>
              <p class="text-white mt-1">{{ selectedReport.description }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm text-gray-400">Status:</label>
                <select
                  v-model="selectedReport.status"
                  @change="updateReportStatus"
                  class="w-full mt-1 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                >
                  <option value="open">Otevřený</option>
                  <option value="in_progress">Řeší se</option>
                  <option value="resolved">Vyřešený</option>
                  <option value="closed">Uzavřený</option>
                  <option value="wont_fix">Nebude opraveno</option>
                </select>
              </div>

              <div>
                <label class="text-sm text-gray-400">Priorita:</label>
                <select
                  v-model="selectedReport.priority"
                  @change="updateReportPriority"
                  class="w-full mt-1 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                >
                  <option :value="0">0 - Žádná</option>
                  <option :value="1">1 - Nízká</option>
                  <option :value="2">2 - Střední</option>
                  <option :value="3">3 - Vysoká</option>
                  <option :value="4">4 - Kritická</option>
                </select>
              </div>
            </div>

            <div>
              <label class="text-sm text-gray-400">Admin poznámky:</label>
              <textarea
                v-model="selectedReport.adminNotes"
                @blur="updateAdminNotes"
                rows="4"
                class="w-full mt-1 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                placeholder="Interní poznámky..."
              ></textarea>
            </div>

            <div v-if="selectedReport.url">
              <label class="text-sm text-gray-400">URL:</label>
              <a :href="selectedReport.url" target="_blank" class="text-primary-400 hover:text-primary-300 block mt-1 break-all">
                {{ selectedReport.url }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBugReportStore } from '@/stores/bugReportStore'
import {
  getCategoryLabel,
  getSeverityLabel,
  getSeverityColor,
  getStatusLabel,
  getStatusColor,
  type BugReport,
  type BugReportStatus,
  type BugReportCategory,
  type BugReportSeverity
} from '@/types/bugReport'

const bugReportStore = useBugReportStore()

const filters = ref({
  status: '',
  category: '',
  severity: ''
})

const selectedReport = ref<BugReport | null>(null)

function getStatusBadgeClass(status: BugReportStatus): string {
  const baseClasses = 'inline-block'
  const colorClasses: Record<BugReportStatus, string> = {
    open: 'bg-yellow-500/20 text-yellow-400',
    in_progress: 'bg-blue-500/20 text-blue-400',
    resolved: 'bg-green-500/20 text-green-400',
    closed: 'bg-gray-500/20 text-gray-400',
    wont_fix: 'bg-red-500/20 text-red-400'
  }
  return `${baseClasses} ${colorClasses[status]}`
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function applyFilters() {
  await bugReportStore.fetchBugReports({
    status: filters.value.status as any || undefined,
    category: filters.value.category as any || undefined,
    severity: filters.value.severity as any || undefined,
    page: 1
  })
}

function resetFilters() {
  filters.value = {
    status: '',
    category: '',
    severity: ''
  }
  applyFilters()
}

async function refreshReports() {
  await Promise.all([
    bugReportStore.fetchBugReports(filters.value),
    bugReportStore.fetchBugReportStats()
  ])
}

async function previousPage() {
  if (bugReportStore.currentPage > 1) {
    await bugReportStore.fetchBugReports({
      ...filters.value,
      page: bugReportStore.currentPage - 1
    })
  }
}

async function nextPage() {
  if (bugReportStore.currentPage < bugReportStore.totalPages) {
    await bugReportStore.fetchBugReports({
      ...filters.value,
      page: bugReportStore.currentPage + 1
    })
  }
}

function viewReport(report: BugReport) {
  selectedReport.value = { ...report }
}

function closeDetailModal() {
  selectedReport.value = null
}

async function updateReportStatus() {
  if (!selectedReport.value) return

  try {
    await bugReportStore.updateBugReport(selectedReport.value.id, {
      status: selectedReport.value.status as any
    })
  } catch (error) {
    console.error('Chyba při aktualizaci statusu:', error)
  }
}

async function updateReportPriority() {
  if (!selectedReport.value) return

  try {
    await bugReportStore.updateBugReport(selectedReport.value.id, {
      priority: selectedReport.value.priority
    })
  } catch (error) {
    console.error('Chyba při aktualizaci priority:', error)
  }
}

async function updateAdminNotes() {
  if (!selectedReport.value) return

  try {
    await bugReportStore.updateBugReport(selectedReport.value.id, {
      adminNotes: selectedReport.value.adminNotes || undefined
    })
  } catch (error) {
    console.error('Chyba při aktualizaci poznámek:', error)
  }
}

async function deleteReport(id: string) {
  if (!confirm('Opravdu chcete smazat tento bug report?')) return

  try {
    await bugReportStore.deleteBugReport(id)
    await refreshReports()
  } catch (error) {
    console.error('Chyba při mazání bug reportu:', error)
  }
}

onMounted(async () => {
  await refreshReports()
})
</script>
