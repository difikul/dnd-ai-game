<template>
  <div class="atmospheric-background">
    <!-- Previous Background (fade out) -->
    <div
      v-show="previousBackground"
      class="background-layer fade-out"
      :style="{
        backgroundImage: previousBackground ? `url(${previousBackground})` : 'none',
        opacity: previousBackground ? 0 : 0
      }"
    />

    <!-- Current Background (fade in) -->
    <div
      class="background-layer fade-in"
      :style="{
        backgroundImage: currentBackground ? `url(${currentBackground})` : 'none',
        opacity: currentBackground ? 1 : 0,
        pointerEvents: currentBackground ? 'auto' : 'none'
      }"
    />

    <!-- Mood Overlay -->
    <div
      class="mood-overlay"
      :style="{ backgroundColor: moodColors.overlay }"
    />

    <!-- Vignette Effect (darker edges) -->
    <div class="vignette" />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useAtmosphereStore } from '@/stores/atmosphereStore'

const atmosphereStore = useAtmosphereStore()

// Use computed instead of storeToRefs for better reactivity
const currentBackground = computed(() => atmosphereStore.currentBackground)
const previousBackground = computed(() => atmosphereStore.previousBackground)
const moodColors = computed(() => atmosphereStore.moodColors)

// Debug logging to verify reactivity
watch(currentBackground, (newVal, oldVal) => {
  console.log('🎨 [AtmosphericBackground Component] currentBackground changed:', newVal?.substring(0, 60) + '...')
  console.log('🎨 [Component] Old value:', oldVal?.substring(0, 40) + '...')
  console.log('🎨 [Component] New value:', newVal?.substring(0, 40) + '...')
  console.log('🎨 [Component] Store direct:', atmosphereStore.currentBackground?.substring(0, 40) + '...')

  // Force check DOM after update
  setTimeout(() => {
    const element = document.querySelector('.background-layer.fade-in')
    if (element) {
      const style = getComputedStyle(element)
      console.log('✅ [Component] Element exists! Opacity:', style.opacity, 'BG:', style.backgroundImage.substring(0, 50))
    } else {
      console.log('❌ [Component] Element NOT in DOM!')
    }
  }, 100)
}, { immediate: true })

watch(() => atmosphereStore.hasBackground, (newVal) => {
  console.log('🎨 [AtmosphericBackground Component] hasBackground:', newVal)
}, { immediate: true })
</script>

<style scoped>
.atmospheric-background {
  position: fixed;
  inset: 0;
  z-index: 0; /* Changed from -1 to 0 - under content but visible */
  overflow: hidden;
  background-color: #0a0a0f; /* Fallback dark color */
}

/* Background Layers */
.background-layer {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(4px); /* Subtle blur for depth */
  transform: scale(1.05); /* Slight zoom to hide blur edges */
  transition: opacity 2s ease-in-out, filter 2s ease-in-out;
}

.background-layer.fade-in {
  opacity: 1;
  animation: fadeIn 2s ease-in-out;
}

.background-layer.fade-out {
  opacity: 0;
  animation: fadeOut 2s ease-in-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    filter: blur(8px);
  }
  to {
    opacity: 1;
    filter: blur(4px);
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
    filter: blur(4px);
  }
  to {
    opacity: 0;
    filter: blur(8px);
  }
}

/* Mood Overlay */
.mood-overlay {
  position: absolute;
  inset: 0;
  transition: background-color 2s ease-in-out;
  pointer-events: none;
}

/* Vignette Effect (darker edges) */
.vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at center,
    transparent 0%,
    transparent 50%,
    rgba(0, 0, 0, 0.15) 85%,
    rgba(0, 0, 0, 0.3) 100%
  );
  pointer-events: none;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .background-layer {
    filter: blur(3px); /* Less blur on mobile for performance */
  }

  .vignette {
    background: radial-gradient(
      circle at center,
      transparent 0%,
      transparent 40%,
      rgba(0, 0, 0, 0.2) 80%,
      rgba(0, 0, 0, 0.35) 100%
    );
  }
}

/* Loading skeleton (before first background loads) */
.atmospheric-background:empty {
  background: linear-gradient(
    135deg,
    #0a0a0f 0%,
    #1a1a2e 50%,
    #0a0a0f 100%
  );
  animation: skeletonPulse 3s ease-in-out infinite;
}

@keyframes skeletonPulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.8;
  }
}
</style>
