/**
 * Atmosphere Store
 * Pinia store for managing dynamic atmospheric backgrounds
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AtmosphereData, MoodColors } from '@/types/atmosphere'
import { Mood, MOOD_COLORS } from '@/types/atmosphere'

export const useAtmosphereStore = defineStore('atmosphere', () => {
  // State
  const currentBackground = ref<string | null>(null)
  const previousBackground = ref<string | null>(null)
  const currentMood = ref<Mood>(Mood.NEUTRAL)
  const currentAtmosphere = ref<AtmosphereData | null>(null)
  const isTransitioning = ref(false)

  // Getters
  const hasBackground = computed(() => currentBackground.value !== null)
  const moodColors = computed(() => getMoodColors(currentMood.value))

  // Actions

  /**
   * Update atmosphere with new data from narrator response
   * Preloads image and transitions smoothly
   * @param atmosphere - New atmosphere data from backend
   */
  async function updateAtmosphere(atmosphere: AtmosphereData): Promise<void> {
    console.log('🎨 Updating atmosphere:', atmosphere)
    console.log('🎨 Current state before update:', {
      currentBackground: currentBackground.value,
      hasBackground: currentBackground.value !== null
    })

    // Skip if same background (optimization)
    if (currentBackground.value === atmosphere.backgroundUrl) {
      console.log('✅ Same background, skipping transition')
      return
    }

    try {
      isTransitioning.value = true

      // Preload new background image
      await preloadImage(atmosphere.backgroundUrl)

      // Store previous background for fade-out effect
      previousBackground.value = currentBackground.value

      // Update state
      currentBackground.value = atmosphere.backgroundUrl
      currentMood.value = atmosphere.mood as Mood
      currentAtmosphere.value = atmosphere

      console.log('✅ Atmosphere updated:', {
        location: atmosphere.location,
        mood: atmosphere.mood,
        backgroundUrl: atmosphere.backgroundUrl.substring(0, 60) + '...'
      })

      // Clear previous background after transition (2s)
      setTimeout(() => {
        previousBackground.value = null
        isTransitioning.value = false
      }, 2000)

    } catch (error) {
      console.error('❌ Failed to update atmosphere:', error)
      isTransitioning.value = false
    }
  }

  /**
   * Preload image to ensure smooth transition (no flashing)
   * @param url - Image URL to preload
   */
  function preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()

      img.onload = () => {
        console.log('✅ Image preloaded:', url.substring(0, 60) + '...')
        resolve()
      }

      img.onerror = (error) => {
        console.error('❌ Image preload failed:', url)
        reject(error)
      }

      img.src = url
    })
  }

  /**
   * Get mood colors for overlay and vignette
   * @param mood - Current mood
   * @returns Mood colors (overlay and vignette)
   */
  function getMoodColors(mood: Mood): MoodColors {
    return MOOD_COLORS[mood] || MOOD_COLORS[Mood.NEUTRAL]
  }

  /**
   * Set default/fallback background
   * @param url - Default background URL
   */
  function setDefaultBackground(url: string): void {
    if (!currentBackground.value) {
      currentBackground.value = url
      console.log('✅ Default background set')
    }
  }

  /**
   * Clear atmosphere (reset to neutral)
   */
  function clearAtmosphere(): void {
    previousBackground.value = currentBackground.value
    currentBackground.value = null
    currentMood.value = Mood.NEUTRAL
    currentAtmosphere.value = null
    isTransitioning.value = false

    setTimeout(() => {
      previousBackground.value = null
    }, 2000)

    console.log('🗑️  Atmosphere cleared')
  }

  /**
   * Reset store to initial state
   */
  function reset(): void {
    currentBackground.value = null
    previousBackground.value = null
    currentMood.value = Mood.NEUTRAL
    currentAtmosphere.value = null
    isTransitioning.value = false
  }

  return {
    // State
    currentBackground,
    previousBackground,
    currentMood,
    currentAtmosphere,
    isTransitioning,

    // Getters
    hasBackground,
    moodColors,

    // Actions
    updateAtmosphere,
    preloadImage,
    getMoodColors,
    setDefaultBackground,
    clearAtmosphere,
    reset,
  }
})
