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

  // Vše OK, pokračuj na cílovou route
  next()
})

export default router
