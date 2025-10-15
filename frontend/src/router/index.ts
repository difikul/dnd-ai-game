import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/create-character',
      name: 'create-character',
      component: () => import('@/views/CharacterCreationView.vue')
    },
    {
      path: '/game/:id',
      name: 'game',
      component: () => import('@/views/GameView.vue')
    },
    {
      path: '/saves',
      name: 'saves',
      component: () => import('@/views/SavedGamesView.vue')
    }
  ]
})

export default router
