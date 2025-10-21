<template>
  <div class="flex justify-start">
    <div class="bg-dark-800 text-gray-400 px-4 py-3 rounded-lg border border-dark-700">
      <div class="flex items-center gap-1">
        <span class="text-sm">🎲 Vypravěč píše</span>
        <div class="flex gap-1 ml-2">
          <div
            class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
            style="animation-delay: 0ms"
          />
          <div
            class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
            style="animation-delay: 150ms"
          />
          <div
            class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
            style="animation-delay: 300ms"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// No props or logic needed - purely presentational
</script>

<style scoped>
/* Custom bounce animation timing if needed */
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-0.5rem);
  }
}
</style>
