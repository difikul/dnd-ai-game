<template>
  <div class="admin-dashboard">
    <!-- Loading State -->
    <div v-if="adminStore.loading && !adminStore.analytics" class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <p class="mt-4 text-gray-400">Načítám statistiky...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="adminStore.error" class="bg-red-900/20 border border-red-700 rounded-lg p-6">
      <div class="flex items-start space-x-3">
        <svg class="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h3 class="text-lg font-semibold text-red-400">Chyba při načítání dat</h3>
          <p class="mt-1 text-red-300">{{ adminStore.error }}</p>
        </div>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else-if="adminStore.analytics" class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p class="mt-1 text-gray-400">Přehled klíčových metrik a statistik</p>
      </div>

      <!-- KPI Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Users Card -->
        <div class="kpi-card bg-dark-800 border border-dark-700 rounded-lg p-6 hover:border-blue-600 transition-colors">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-400">Uživatelé</p>
              <p class="mt-2 text-3xl font-bold text-white">{{ adminStore.analytics.users.total }}</p>
              <div class="mt-2 flex items-center space-x-2 text-xs">
                <span class="text-green-400">+{{ adminStore.analytics.users.newToday }} dnes</span>
                <span class="text-gray-500">•</span>
                <span class="text-blue-400">{{ adminStore.analytics.users.active24h }} aktivních</span>
              </div>
            </div>
            <div class="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Characters Card -->
        <div class="kpi-card bg-dark-800 border border-dark-700 rounded-lg p-6 hover:border-purple-600 transition-colors">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-400">Postavy</p>
              <p class="mt-2 text-3xl font-bold text-white">{{ adminStore.analytics.characters.total }}</p>
              <div class="mt-2 flex items-center space-x-2 text-xs">
                <span class="text-green-400">+{{ adminStore.analytics.characters.createdToday }} dnes</span>
              </div>
            </div>
            <div class="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Sessions Card -->
        <div class="kpi-card bg-dark-800 border border-dark-700 rounded-lg p-6 hover:border-green-600 transition-colors">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-400">Herní sessions</p>
              <p class="mt-2 text-3xl font-bold text-white">{{ adminStore.analytics.sessions.total }}</p>
              <div class="mt-2 flex items-center space-x-2 text-xs">
                <span class="text-green-400">{{ adminStore.analytics.sessions.active }} aktivních</span>
                <span class="text-gray-500">•</span>
                <span class="text-blue-400">{{ adminStore.analytics.sessions.completedToday }} hotovo</span>
              </div>
            </div>
            <div class="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Gemini API Card -->
        <div class="kpi-card bg-dark-800 border border-dark-700 rounded-lg p-6 hover:border-orange-600 transition-colors">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-400">Gemini API</p>
              <p class="mt-2 text-3xl font-bold text-white">{{ adminStore.analytics.gemini.requestsToday }}</p>
              <div class="mt-2 flex items-center space-x-2 text-xs">
                <span class="text-green-400">{{ adminStore.analytics.gemini.successRate }}% úspěšnost</span>
                <span class="text-gray-500">•</span>
                <span class="text-blue-400">{{ formatNumber(adminStore.analytics.gemini.avgPerUser) }}/user</span>
              </div>
            </div>
            <div class="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-dark-800 border border-dark-700 rounded-lg p-6">
        <h2 class="text-lg font-bold text-white mb-4">Rychlé akce</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <router-link
            to="/admin/users"
            class="quick-action flex items-center space-x-3 p-4 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
          >
            <div class="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p class="font-medium text-white">Spravovat uživatele</p>
              <p class="text-sm text-gray-400">{{ adminStore.analytics.users.total }} celkem</p>
            </div>
          </router-link>

          <router-link
            to="/admin/sessions"
            class="quick-action flex items-center space-x-3 p-4 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
          >
            <div class="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="font-medium text-white">Aktivní sessions</p>
              <p class="text-sm text-gray-400">{{ adminStore.analytics.sessions.active }} probíhá</p>
            </div>
          </router-link>

          <router-link
            to="/admin/analytics"
            class="quick-action flex items-center space-x-3 p-4 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
          >
            <div class="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p class="font-medium text-white">Podrobná analytika</p>
              <p class="text-sm text-gray-400">Gemini usage, abuse detection</p>
            </div>
          </router-link>
        </div>
      </div>

      <!-- System Health -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Gemini Stats -->
        <div class="bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h2 class="text-lg font-bold text-white mb-4">Gemini API dnes</h2>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-gray-400">Requesty dnes</span>
              <span class="font-semibold text-white">{{ adminStore.analytics.gemini.requestsToday }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-400">Requesty za 7 dní</span>
              <span class="font-semibold text-white">{{ adminStore.analytics.gemini.requestsLast7d }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-400">Úspěšnost</span>
              <div class="flex items-center space-x-2">
                <div class="w-24 h-2 bg-dark-600 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
                    :style="{ width: `${adminStore.analytics.gemini.successRate}%` }"
                  ></div>
                </div>
                <span class="font-semibold text-green-400">{{ adminStore.analytics.gemini.successRate }}%</span>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-400">Průměr na uživatele</span>
              <span class="font-semibold text-white">{{ formatNumber(adminStore.analytics.gemini.avgPerUser) }}</span>
            </div>
          </div>
        </div>

        <!-- Admin Count -->
        <div class="bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h2 class="text-lg font-bold text-white mb-4">Správa platformy</h2>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-gray-400">Počet adminů</span>
              <span class="font-semibold text-white">{{ adminStore.analytics.users.admins }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-400">Aktivní uživatelé (24h)</span>
              <span class="font-semibold text-white">{{ adminStore.analytics.users.active24h }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-400">Nové postavy dnes</span>
              <span class="font-semibold text-white">{{ adminStore.analytics.characters.createdToday }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-400">Dokončené sessions dnes</span>
              <span class="font-semibold text-white">{{ adminStore.analytics.sessions.completedToday }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAdminStore } from '@/stores/adminStore'

const adminStore = useAdminStore()

// Format number with decimal places
function formatNumber(num: number): string {
  if (num < 10) {
    return num.toFixed(1)
  }
  return Math.round(num).toString()
}

// Load analytics on mount
onMounted(async () => {
  await adminStore.fetchAnalytics()
})
</script>

<style scoped>
.kpi-card {
  position: relative;
  overflow: hidden;
}

.kpi-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(to right, transparent, currentColor, transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.kpi-card:hover::before {
  opacity: 0.5;
}

.quick-action {
  position: relative;
  overflow: hidden;
}

.quick-action::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(to bottom, #dc2626, #b91c1c);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.quick-action:hover::before {
  transform: translateX(0);
}
</style>
