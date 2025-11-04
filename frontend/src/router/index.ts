import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ============================================================================
    // Public routes (nepotřebují autentizaci)
    // ============================================================================
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresGuest: true } // Pouze pro nepřihlášené
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { requiresGuest: true } // Pouze pro nepřihlášené
    },

    // ============================================================================
    // Protected routes (vyžadují autentizaci)
    // ============================================================================
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/create-character',
      name: 'create-character',
      component: () => import('@/views/CharacterCreationView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/game/:id',
      name: 'game',
      component: () => import('@/views/GameView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/saves',
      name: 'saves',
      component: () => import('@/views/SavedGamesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },

    // ============================================================================
    // Admin routes (vyžadují autentizaci + admin roli)
    // ============================================================================
    {
      path: '/admin',
      component: () => import('@/components/admin/AdminLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: () => import('@/views/admin/AdminDashboardView.vue')
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('@/views/admin/AdminUsersView.vue')
        },
        {
          path: 'characters',
          name: 'admin-characters',
          component: () => import('@/views/admin/AdminCharactersView.vue')
        },
        {
          path: 'sessions',
          name: 'admin-sessions',
          component: () => import('@/views/admin/AdminSessionsView.vue')
        },
        {
          path: 'analytics',
          name: 'admin-analytics',
          component: () => import('@/views/admin/AdminAnalyticsView.vue')
        },
        {
          path: 'audit',
          name: 'admin-audit',
          component: () => import('@/views/admin/AdminAuditView.vue')
        },
        {
          path: 'bug-reports',
          name: 'admin-bug-reports',
          component: () => import('@/views/admin/AdminBugReportsView.vue')
        }
      ]
    }
  ]
})

// ============================================================================
// Navigation Guards
// ============================================================================

/**
 * Global navigation guard - kontroluje autentizaci před každou navigací
 */
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Pokud máme token v localStorage, ale user data nejsou načtená, načti je
  if (authStore.token && !authStore.user && to.name !== 'login' && to.name !== 'register') {
    try {
      await authStore.fetchCurrentUser()
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      // Token je neplatný, odhlásit
      authStore.logout()
    }
  }

  // Kontrola requiresAuth meta fieldu
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Route vyžaduje autentizaci, ale user není přihlášen → redirect na login
    console.log('🔒 Route requires authentication, redirecting to login')
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  // Kontrola requiresGuest meta fieldu (login/register pages)
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    // User je už přihlášen, redirect na home
    console.log('✅ User already authenticated, redirecting to home')
    next({ name: 'home' })
    return
  }

  // Kontrola requiresAdmin meta fieldu (admin routes)
  if (to.meta.requiresAdmin) {
    if (!authStore.isAuthenticated) {
      // User není přihlášen
      console.log('🔒 Admin route requires authentication, redirecting to login')
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }
    if (authStore.user?.role !== 'admin') {
      // User není admin
      console.log('⛔ Access denied: User is not an admin')
      next({ name: 'home' })
      return
    }
  }

  // Vše OK, pokračuj na cílovou route
  next()
})

export default router
