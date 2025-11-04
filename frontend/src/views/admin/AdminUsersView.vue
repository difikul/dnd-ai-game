<template>
  <div class="admin-users">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white">Správa uživatelů</h1>
        <p class="mt-1 text-gray-400">Celkem {{ adminStore.totalUsers }} uživatelů</p>
      </div>

      <!-- Search & Filters -->
      <div class="flex items-center space-x-3">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Hledat uživatele..."
          class="px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-600 transition-colors"
          @input="handleSearch"
        />
        <select
          v-model="roleFilter"
          class="px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-red-600 transition-colors"
          @change="handleFilterChange"
        >
          <option value="">Všechny role</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <select
          v-model="statusFilter"
          class="px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-red-600 transition-colors"
          @change="handleFilterChange"
        >
          <option value="">Všechny stavy</option>
          <option value="active">Aktivní</option>
          <option value="banned">Zabanovaní</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="adminStore.loading" class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <p class="mt-4 text-gray-400">Načítám uživatele...</p>
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

    <!-- Users Table -->
    <div v-else-if="adminStore.users.length > 0" class="bg-dark-800 border border-dark-700 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-dark-700 border-b border-dark-600">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Uživatel</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statistiky</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Poslední aktivita</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Akce</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-dark-700">
            <tr
              v-for="userWithStats in adminStore.users"
              :key="userWithStats.user.id"
              class="hover:bg-dark-700/50 transition-colors"
            >
              <!-- User Info -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center">
                    <span class="text-sm font-bold text-white">{{ getUserInitials(userWithStats.user.username) }}</span>
                  </div>
                  <div>
                    <p class="font-medium text-white">{{ userWithStats.user.username }}</p>
                    <p class="text-sm text-gray-400">{{ userWithStats.user.email }}</p>
                  </div>
                </div>
              </td>

              <!-- Role -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'px-3 py-1 rounded-full text-xs font-semibold',
                    userWithStats.user.role === 'admin'
                      ? 'bg-red-600/20 text-red-400 border border-red-700'
                      : 'bg-blue-600/20 text-blue-400 border border-blue-700'
                  ]"
                >
                  {{ userWithStats.user.role === 'admin' ? 'Admin' : 'User' }}
                </span>
              </td>

              <!-- Status -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'px-3 py-1 rounded-full text-xs font-semibold',
                    userWithStats.user.isActive
                      ? 'bg-green-600/20 text-green-400 border border-green-700'
                      : 'bg-gray-600/20 text-gray-400 border border-gray-700'
                  ]"
                >
                  {{ userWithStats.user.isActive ? 'Aktivní' : 'Zabanován' }}
                </span>
              </td>

              <!-- Stats -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                <div class="space-y-1">
                  <div>{{ userWithStats.stats.characterCount }} postav</div>
                  <div class="text-gray-400">{{ userWithStats.stats.geminiRequestsTotal }} API requestů</div>
                </div>
              </td>

              <!-- Last Activity -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                <div v-if="userWithStats.stats.lastActivity">
                  {{ formatDate(userWithStats.stats.lastActivity) }}
                </div>
                <div v-else class="text-gray-500">Nikdy</div>
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end space-x-2">
                  <!-- Ban/Unban Button -->
                  <button
                    v-if="userWithStats.user.isActive"
                    @click="handleBan(userWithStats.user)"
                    class="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
                    title="Zabanovat uživatele"
                  >
                    Ban
                  </button>
                  <button
                    v-else
                    @click="handleUnban(userWithStats.user)"
                    class="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                    title="Odbanovat uživatele"
                  >
                    Unban
                  </button>

                  <!-- Delete Button -->
                  <button
                    @click="handleDelete(userWithStats.user)"
                    class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    title="Smazat uživatele"
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
      <div v-if="totalPages > 1" class="px-6 py-4 border-t border-dark-700 flex items-center justify-between">
        <p class="text-sm text-gray-400">
          Stránka {{ currentPage }} z {{ totalPages }}
        </p>
        <div class="flex items-center space-x-2">
          <button
            @click="handlePageChange(currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-4 py-2 bg-dark-700 hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            Předchozí
          </button>
          <button
            @click="handlePageChange(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-4 py-2 bg-dark-700 hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            Další
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-dark-800 border border-dark-700 rounded-lg p-12 text-center">
      <svg class="w-16 h-16 text-gray-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-white">Žádní uživatelé</h3>
      <p class="mt-2 text-gray-400">Nenalezeni žádní uživatelé odpovídající filtru.</p>
    </div>

    <!-- Confirm Delete Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
      @click.self="showDeleteModal = false"
    >
      <div class="bg-dark-800 border border-dark-700 rounded-lg max-w-md w-full p-6">
        <div class="flex items-start space-x-3">
          <div class="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-bold text-white">Smazat uživatele?</h3>
            <p class="mt-2 text-gray-400">
              Opravdu chceš smazat uživatele <strong class="text-white">{{ userToDelete?.username }}</strong>?
              Tato akce je nevratná a smaže všechna související data (postavy, sessions, zprávy).
            </p>
            <div class="mt-4 flex items-center space-x-3">
              <button
                @click="confirmDelete"
                class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                Ano, smazat
              </button>
              <button
                @click="showDeleteModal = false"
                class="flex-1 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors font-medium"
              >
                Zrušit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Ban Modal -->
    <div
      v-if="showBanModal"
      class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
      @click.self="showBanModal = false"
    >
      <div class="bg-dark-800 border border-dark-700 rounded-lg max-w-md w-full p-6">
        <h3 class="text-lg font-bold text-white mb-4">Zabanovat uživatele</h3>
        <p class="text-gray-400 mb-4">
          Zabanovat uživatele <strong class="text-white">{{ userToBan?.username }}</strong>?
        </p>
        <textarea
          v-model="banReason"
          placeholder="Důvod banu (nepovinné)..."
          class="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-600 transition-colors resize-none"
          rows="3"
        ></textarea>
        <div class="mt-4 flex items-center space-x-3">
          <button
            @click="confirmBan"
            class="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors font-medium"
          >
            Zabanovat
          </button>
          <button
            @click="showBanModal = false"
            class="flex-1 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors font-medium"
          >
            Zrušit
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '@/stores/adminStore'
import type { UserWithStats } from '@/types/admin'

const adminStore = useAdminStore()

// State
const searchQuery = ref('')
const roleFilter = ref<'' | 'user' | 'admin'>('')
const statusFilter = ref<'' | 'active' | 'banned'>('')
const currentPage = ref(1)
const limit = 50

// Modals
const showDeleteModal = ref(false)
const userToDelete = ref<UserWithStats['user'] | null>(null)
const showBanModal = ref(false)
const userToBan = ref<UserWithStats['user'] | null>(null)
const banReason = ref('')

// Computed
const totalPages = computed(() => Math.ceil(adminStore.totalUsers / limit))

// Methods
function getUserInitials(username: string): string {
  const parts = username.split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return username.substring(0, 2).toUpperCase()
}

function formatDate(date: Date): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) {
    return `před ${diffMins} min`
  } else if (diffHours < 24) {
    return `před ${diffHours} h`
  } else if (diffDays < 7) {
    return `před ${diffDays} d`
  } else {
    return d.toLocaleDateString('cs-CZ')
  }
}

async function loadUsers() {
  const params: any = {
    page: currentPage.value,
    limit,
    search: searchQuery.value || undefined,
    role: roleFilter.value || undefined,
    isActive: statusFilter.value === 'active' ? true : statusFilter.value === 'banned' ? false : undefined
  }
  await adminStore.fetchUsers(params)
}

let searchTimeout: number | null = null
function handleSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = window.setTimeout(() => {
    currentPage.value = 1
    loadUsers()
  }, 500)
}

function handleFilterChange() {
  currentPage.value = 1
  loadUsers()
}

function handlePageChange(page: number) {
  currentPage.value = page
  loadUsers()
}

function handleBan(user: UserWithStats['user']) {
  userToBan.value = user
  banReason.value = ''
  showBanModal.value = true
}

async function confirmBan() {
  if (!userToBan.value) return
  const success = await adminStore.banUser(userToBan.value.id, banReason.value || undefined)
  if (success) {
    showBanModal.value = false
    userToBan.value = null
    banReason.value = ''
  }
}

async function handleUnban(user: UserWithStats['user']) {
  await adminStore.unbanUser(user.id)
}

function handleDelete(user: UserWithStats['user']) {
  userToDelete.value = user
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!userToDelete.value) return
  const success = await adminStore.deleteUser(userToDelete.value.id)
  if (success) {
    showDeleteModal.value = false
    userToDelete.value = null
  }
}

// Load users on mount
onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
/* Custom scrollbar for table */
.overflow-x-auto::-webkit-scrollbar {
  height: 8px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
