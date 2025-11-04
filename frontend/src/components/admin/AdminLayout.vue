<template>
  <div class="admin-layout min-h-screen bg-dark-900 text-gray-200">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 bg-dark-800 border-r border-dark-700',
        'transform transition-transform duration-300 ease-in-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      ]"
    >
      <!-- Logo & Header -->
      <div class="flex items-center justify-between h-16 px-6 border-b border-dark-700">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 class="text-lg font-bold text-white">Admin Panel</h1>
            <p class="text-xs text-gray-400">D&D AI Game</p>
          </div>
        </div>

        <!-- Mobile Close Button -->
        <button
          @click="sidebarOpen = false"
          class="md:hidden text-gray-400 hover:text-white"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200"
          :class="isActive(item.path) ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-dark-700 hover:text-white'"
        >
          <component :is="item.icon" class="w-5 h-5" />
          <span class="font-medium">{{ item.label }}</span>
          <span
            v-if="item.badge"
            class="ml-auto px-2 py-0.5 text-xs font-bold rounded-full"
            :class="isActive(item.path) ? 'bg-red-700' : 'bg-dark-600 text-gray-300'"
          >
            {{ item.badge }}
          </span>
        </router-link>
      </nav>

      <!-- User Info -->
      <div class="px-4 py-4 border-t border-dark-700">
        <div class="flex items-center space-x-3 px-4">
          <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center">
            <span class="text-sm font-bold text-white">{{ userInitials }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ authStore.user?.username }}</p>
            <p class="text-xs text-gray-400">Administrator</p>
          </div>
          <button
            @click="handleLogout"
            class="text-gray-400 hover:text-red-400 transition-colors"
            title="Odhlásit se"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="md:pl-64">
      <!-- Top Bar -->
      <header class="sticky top-0 z-40 bg-dark-800 border-b border-dark-700">
        <div class="flex items-center justify-between h-16 px-6">
          <!-- Mobile Menu Button -->
          <button
            @click="sidebarOpen = true"
            class="md:hidden text-gray-400 hover:text-white"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- Page Title -->
          <h2 class="text-xl font-bold text-white">{{ pageTitle }}</h2>

          <!-- Actions -->
          <div class="flex items-center space-x-4">
            <!-- Refresh Button -->
            <button
              @click="handleRefresh"
              class="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-dark-700"
              title="Obnovit data"
            >
              <svg class="w-5 h-5" :class="{ 'animate-spin': isRefreshing }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            <!-- Back to Game -->
            <router-link
              to="/"
              class="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors font-medium"
            >
              Zpět do hry
            </router-link>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-6">
        <router-view />
      </main>
    </div>

    <!-- Sidebar Overlay (Mobile) -->
    <div
      v-if="sidebarOpen"
      @click="sidebarOpen = false"
      class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useAdminStore } from '@/stores/adminStore'

// Stores
const authStore = useAuthStore()
const adminStore = useAdminStore()
const route = useRoute()
const router = useRouter()

// State
const sidebarOpen = ref(false)
const isRefreshing = ref(false)

// Icons as functional components
const DashboardIcon = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' })
])

const UsersIcon = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' })
])

const CharactersIcon = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' })
])

const SessionsIcon = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' }),
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z' })
])

const AnalyticsIcon = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' })
])

const AuditIcon = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
])

const BugReportIcon = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' })
])

// Navigation items
const navItems = computed(() => [
  {
    path: '/admin',
    label: 'Dashboard',
    icon: DashboardIcon
  },
  {
    path: '/admin/users',
    label: 'Uživatelé',
    icon: UsersIcon,
    badge: adminStore.totalUsers > 0 ? adminStore.totalUsers : undefined
  },
  {
    path: '/admin/characters',
    label: 'Postavy',
    icon: CharactersIcon,
    badge: adminStore.totalCharacters > 0 ? adminStore.totalCharacters : undefined
  },
  {
    path: '/admin/sessions',
    label: 'Aktivní sessions',
    icon: SessionsIcon,
    badge: adminStore.activeSessions.length > 0 ? adminStore.activeSessions.length : undefined
  },
  {
    path: '/admin/analytics',
    label: 'Analytika',
    icon: AnalyticsIcon
  },
  {
    path: '/admin/audit',
    label: 'Audit Log',
    icon: AuditIcon
  },
  {
    path: '/admin/bug-reports',
    label: 'Bug Reports',
    icon: BugReportIcon
  }
])

// Computed
const userInitials = computed(() => {
  if (!authStore.user?.username) return '??'
  const parts = authStore.user.username.split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return authStore.user.username.substring(0, 2).toUpperCase()
})

const pageTitle = computed(() => {
  const item = navItems.value.find(i => i.path === route.path)
  return item?.label || 'Admin Panel'
})

// Methods
function isActive(path: string): boolean {
  if (path === '/admin') {
    return route.path === '/admin'
  }
  return route.path.startsWith(path)
}

async function handleRefresh() {
  isRefreshing.value = true
  try {
    // Refresh current page data based on route
    if (route.path === '/admin') {
      await adminStore.fetchAnalytics()
    } else if (route.path === '/admin/users') {
      await adminStore.fetchUsers()
    } else if (route.path === '/admin/characters') {
      await adminStore.fetchCharacters()
    } else if (route.path === '/admin/sessions') {
      await adminStore.fetchActiveSessions()
    }
  } finally {
    setTimeout(() => {
      isRefreshing.value = false
    }, 500)
  }
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
/* Custom scrollbar for sidebar */
aside::-webkit-scrollbar {
  width: 6px;
}

aside::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

aside::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

aside::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Nav item hover effect */
.nav-item {
  position: relative;
  overflow: hidden;
}

.nav-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background: linear-gradient(to bottom, #dc2626, #b91c1c);
  transform: translateX(-100%);
  transition: transform 0.2s ease;
}

.nav-item:hover::before {
  transform: translateX(0);
}
</style>
