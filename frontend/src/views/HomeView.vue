<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-b from-dark-900 to-dark-800">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-primary-500 mb-4">
        D&D AI Game
      </h1>
      <p class="text-xl text-gray-300 mb-8">
        Zahrajte si Dungeons & Dragons s AI vypravěčem
      </p>

      <div class="space-y-4">
        <button
          @click="router.push('/create-character')"
          class="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg block w-full"
        >
          🎭 Nová Hra
        </button>

        <button
          @click="router.push('/saves')"
          class="px-8 py-3 bg-dark-700 hover:bg-dark-600 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg block w-full"
        >
          💾 Načíst Hru
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>
