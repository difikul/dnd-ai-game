<template>
  <div class="atmospheric-background">
    <!-- Previous Background (fade out) -->
    <div
      v-if="previousBackground"
      class="background-layer fade-out"
      :style="{ backgroundImage: `url(${previousBackground})` }"
    />

    <!-- Current Background (fade in) -->
    <div
      v-if="currentBackground"
      class="background-layer fade-in"
      :style="{ backgroundImage: `url(${currentBackground})` }"
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
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAtmosphereStore } from '@/stores/atmosphereStore'

const atmosphereStore = useAtmosphereStore()
const { currentBackground, previousBackground, moodColors } = storeToRefs(atmosphereStore)
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
    transparent 30%,
    rgba(0, 0, 0, 0.4) 70%,
    rgba(0, 0, 0, 0.7) 100%
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
      transparent 20%,
      rgba(0, 0, 0, 0.5) 70%,
      rgba(0, 0, 0, 0.8) 100%
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
