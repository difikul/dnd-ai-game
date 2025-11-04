<template>
  <div
    v-if="quotaStore.hasStats"
    class="api-quota-top-bar bg-dark-800 border-b border-dark-700 shadow-lg"
    :class="barBorderClass"
  >
    <div class="container mx-auto px-4 py-2 flex items-center justify-between gap-6">
      <!-- Left: Title and Icon -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <span class="text-lg">📊</span>
        <span class="text-sm font-semibold text-white">Gemini API</span>
        <span
          v-if="quotaStore.isExceeded"
          class="text-xs px-2 py-0.5 bg-red-600 text-white rounded-full font-medium"
        >
          Vyčerpáno
        </span>
        <span
          v-else-if="quotaStore.isCritical"
          class="text-xs px-2 py-0.5 bg-orange-600 text-white rounded-full font-medium animate-pulse"
        >
          Kritické
        </span>
      </div>

      <!-- Center: Progress Bars -->
      <div class="flex-1 flex items-center gap-6 max-w-4xl">
        <!-- Per Minute -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-gray-400 font-medium">Per Minute</span>
            <span class="text-xs font-semibold text-white tabular-nums">
              {{ quotaStore.stats!.requestsLastMinute }}/{{ quotaStore.stats!.limitPerMinute }}
            </span>
          </div>
          <div class="w-full bg-dark-700 rounded-full h-1.5 overflow-hidden">
            <div
              :class="getProgressColor(quotaStore.stats!.percentUsedMinute)"
              :style="{ width: Math.min(quotaStore.stats!.percentUsedMinute, 100) + '%' }"
              class="h-full transition-all duration-300"
            />
          </div>
        </div>

        <!-- Per Day -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-gray-400 font-medium">Per Day</span>
            <span class="text-xs font-semibold text-white tabular-nums">
              {{ quotaStore.stats!.requestsLastDay }}/{{ quotaStore.stats!.limitPerDay }}
            </span>
          </div>
          <div class="w-full bg-dark-700 rounded-full h-1.5 overflow-hidden">
            <div
              :class="getProgressColor(quotaStore.stats!.percentUsedDay)"
              :style="{ width: Math.min(quotaStore.stats!.percentUsedDay, 100) + '%' }"
              class="h-full transition-all duration-300"
            />
          </div>
        </div>
      </div>

      <!-- Right: Reset Timer, Bug Report & Refresh -->
      <div class="flex items-center gap-3 flex-shrink-0">
        <div
          v-if="quotaStore.timeUntilResetMinute !== null"
          class="text-xs text-gray-400 tabular-nums"
        >
          Reset: <span class="text-white font-semibold">{{ formatTimeUntilReset(quotaStore.timeUntilResetMinute) }}</span>
        </div>

        <!-- Bug Report Button -->
        <button
          @click="openBugReportModal"
          class="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded transition-colors"
          title="Nahlásit chybu"
        >
          <span>🐛</span>
          <span class="hidden sm:inline">Nahlásit chybu</span>
        </button>

        <button
          @click="quotaStore.fetchQuota()"
          :disabled="quotaStore.loading"
          class="text-gray-400 hover:text-white transition-colors p-1 rounded"
          :class="{ 'animate-spin': quotaStore.loading }"
          title="Obnovit"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  </div>

  <!-- Loading/Error States (Compact) -->
  <div
    v-else-if="quotaStore.loading || quotaStore.error"
    class="bg-dark-800 border-b border-dark-700 py-1.5"
  >
    <div class="container mx-auto px-4 flex items-center justify-center gap-2 text-xs text-gray-400">
      <svg v-if="quotaStore.loading" class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span v-if="quotaStore.loading">Načítání API statistik...</span>
      <span v-else-if="quotaStore.error" class="text-red-400">{{ quotaStore.error }}</span>
    </div>
  </div>

  <!-- Bug Report Modal -->
  <BugReportModal :is-open="isBugReportModalOpen" @close="closeBugReportModal" />
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useQuotaStore } from '@/stores/quotaStore'
import BugReportModal from '@/components/bug-report/BugReportModal.vue'

const quotaStore = useQuotaStore()

// Bug Report Modal State
const isBugReportModalOpen = ref(false)

function openBugReportModal() {
  isBugReportModalOpen.value = true
}

function closeBugReportModal() {
  isBugReportModalOpen.value = false
}

// Computed border class based on quota status
const barBorderClass = computed(() => {
  if (quotaStore.isExceeded) {
    return 'border-b-red-500'
  } else if (quotaStore.isCritical) {
    return 'border-b-orange-500'
  } else if (quotaStore.isWarning) {
    return 'border-b-yellow-500'
  }
  return ''
})

/**
 * Get progress bar color based on percentage
 */
function getProgressColor(percent: number): string {
  if (percent >= 90) return 'bg-red-500'
  if (percent >= 80) return 'bg-orange-500'
  if (percent >= 70) return 'bg-yellow-500'
  return 'bg-green-500'
}

/**
 * Format time until reset
 */
function formatTimeUntilReset(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

// Lifecycle hooks
onMounted(() => {
  // Start auto-refresh with 10 second interval
  quotaStore.startAutoRefresh(10000)
})

onUnmounted(() => {
  // Clean up auto-refresh on unmount
  quotaStore.stopAutoRefresh()
})
</script>

<style scoped>
.api-quota-top-bar {
  position: sticky;
  top: 0;
  z-index: 40;
}

/* Ensure smooth transitions */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

/* Tabular numbers for better alignment */
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
</style>
