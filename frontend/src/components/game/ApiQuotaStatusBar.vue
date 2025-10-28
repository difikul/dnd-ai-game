<template>
  <div class="fixed top-4 right-4 z-50">
    <!-- Collapsed State (Default) -->
    <button
      v-if="!isExpanded"
      @click="toggleExpanded"
      :class="collapsedButtonClass"
      class="w-12 h-12 rounded-lg shadow-lg transition-all duration-300
             flex items-center justify-center text-2xl
             focus:outline-none focus:ring-2 focus:ring-primary-500"
      title="Gemini API Quota"
    >
      📊
      <!-- Warning indicator -->
      <span
        v-if="quotaStore.isWarning"
        class="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse"
      />
    </button>

    <!-- Expanded State -->
    <div
      v-else
      :class="expandedPanelClass"
      class="rounded-lg shadow-2xl p-4 w-64 transition-all duration-300"
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-xl">📊</span>
          <span class="font-bold text-white">Gemini API</span>
        </div>
        <button
          @click="toggleExpanded"
          class="text-gray-400 hover:text-white transition"
          title="Zavřít"
        >
          ✕
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="quotaStore.loading" class="text-center py-4 text-gray-400">
        <svg class="animate-spin h-6 w-6 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm">Načítání...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="quotaStore.error" class="text-center py-4">
        <span class="text-red-400 text-sm">{{ quotaStore.error }}</span>
        <button
          @click="quotaStore.fetchQuota()"
          class="mt-2 text-xs text-primary-400 hover:text-primary-300 underline"
        >
          Zkusit znovu
        </button>
      </div>

      <!-- Stats Display -->
      <div v-else-if="quotaStore.hasStats" class="space-y-4">
        <!-- Per Minute Stats -->
        <div>
          <div class="flex justify-between text-sm mb-1">
            <span class="text-gray-300">Per Minute</span>
            <span class="font-semibold text-white">
              {{ quotaStore.stats!.requestsLastMinute }}/{{ quotaStore.stats!.limitPerMinute }}
            </span>
          </div>
          <div class="w-full bg-dark-700 rounded-full h-2 overflow-hidden">
            <div
              :class="getProgressColor(quotaStore.stats!.percentUsedMinute)"
              :style="{ width: quotaStore.stats!.percentUsedMinute + '%' }"
              class="h-full transition-all duration-300"
            />
          </div>
          <div class="text-xs text-gray-500 mt-1 text-right">
            {{ Math.round(quotaStore.stats!.percentUsedMinute) }}%
          </div>
        </div>

        <!-- Per Day Stats -->
        <div>
          <div class="flex justify-between text-sm mb-1">
            <span class="text-gray-300">Per Day</span>
            <span class="font-semibold text-white">
              {{ quotaStore.stats!.requestsLastDay }}/{{ quotaStore.stats!.limitPerDay }}
            </span>
          </div>
          <div class="w-full bg-dark-700 rounded-full h-2 overflow-hidden">
            <div
              :class="getProgressColor(quotaStore.stats!.percentUsedDay)"
              :style="{ width: quotaStore.stats!.percentUsedDay + '%' }"
              class="h-full transition-all duration-300"
            />
          </div>
          <div class="text-xs text-gray-500 mt-1 text-right">
            {{ Math.round(quotaStore.stats!.percentUsedDay) }}%
          </div>
        </div>

        <!-- Reset Timer -->
        <div v-if="quotaStore.timeUntilResetMinute !== null" class="text-xs text-gray-400 text-center pt-2 border-t border-dark-700">
          Reset za: {{ formatTimeUntilReset(quotaStore.timeUntilResetMinute) }}
        </div>

        <!-- Warning Message -->
        <div v-if="quotaStore.isExceeded" class="text-xs text-red-400 text-center bg-red-900 bg-opacity-20 px-2 py-1 rounded">
          ⚠️ Kvóta vyčerpána
        </div>
        <div v-else-if="quotaStore.isCritical" class="text-xs text-orange-400 text-center">
          ⚠️ Blížíte se limitu
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useQuotaStore } from '@/stores/quotaStore'

const quotaStore = useQuotaStore()
const isExpanded = ref(false)

// Computed classes for styling
const collapsedButtonClass = computed(() => {
  const base = 'bg-dark-800 hover:bg-dark-700 text-white border-2'

  if (quotaStore.isExceeded) {
    return `${base} border-red-500`
  } else if (quotaStore.isCritical) {
    return `${base} border-orange-500`
  } else if (quotaStore.isWarning) {
    return `${base} border-yellow-500`
  } else {
    return `${base} border-dark-700`
  }
})

const expandedPanelClass = computed(() => {
  const base = 'bg-dark-800 border-2'

  if (quotaStore.isExceeded) {
    return `${base} border-red-500`
  } else if (quotaStore.isCritical) {
    return `${base} border-orange-500 animate-pulse`
  } else if (quotaStore.isWarning) {
    return `${base} border-yellow-500`
  } else {
    return `${base} border-dark-700`
  }
})

/**
 * Toggle expanded state
 */
function toggleExpanded() {
  isExpanded.value = !isExpanded.value

  // Fetch fresh data when expanding
  if (isExpanded.value && !quotaStore.loading) {
    quotaStore.fetchQuota()
  }
}

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
/* Additional animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
