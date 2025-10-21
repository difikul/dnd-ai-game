/**
 * Atmosphere Types - Frontend types pro dynamické pozadí
 * Synchronizováno s backend types
 */

/**
 * Nálada scény - ovlivňuje barevný overlay
 */
export enum Mood {
  MYSTERIOUS = 'mysterious',    // Tajemná - tmavě fialová
  DANGEROUS = 'dangerous',      // Nebezpečná - tmavě červená
  COZY = 'cozy',                // Útulná - teplá hnědá
  PEACEFUL = 'peaceful',        // Klidná - jemná modrá
  EPIC = 'epic',                // Epická - zlatá
  NEUTRAL = 'neutral'           // Neutrální - tmavá
}

/**
 * Denní doba
 */
export enum TimeOfDay {
  DAWN = 'dawn',      // Úsvit
  DAY = 'day',        // Den
  DUSK = 'dusk',      // Soumrak
  NIGHT = 'night'     // Noc
}

/**
 * Kompletní atmosphere data z backendu
 */
export interface AtmosphereData {
  /** Typ lokace (např. "forest", "tavern") */
  location: string

  /** Nálada scény */
  mood: Mood

  /** Denní doba */
  timeOfDay: TimeOfDay

  /** Počasí (volitelné) */
  weather?: string

  /** Search query použitý pro Pexels */
  searchQuery: string

  /** URL fotky z Pexels */
  backgroundUrl: string

  /** Pexels photo ID */
  pexelsPhotoId?: number
}

/**
 * Barevné hodnoty pro mood overlay
 */
export interface MoodColors {
  /** RGBA barva pro hlavní overlay */
  overlay: string

  /** RGBA barva pro vignette (tmavší okraje) */
  vignette: string
}

/**
 * Mood color palette
 */
export const MOOD_COLORS: Record<Mood, MoodColors> = {
  [Mood.MYSTERIOUS]: {
    overlay: 'rgba(25, 15, 45, 0.7)',      // Tmavě fialová
    vignette: 'rgba(15, 10, 30, 0.8)'
  },
  [Mood.DANGEROUS]: {
    overlay: 'rgba(45, 15, 15, 0.7)',      // Tmavě červená
    vignette: 'rgba(30, 10, 10, 0.8)'
  },
  [Mood.COZY]: {
    overlay: 'rgba(45, 30, 15, 0.6)',      // Teplá hnědá
    vignette: 'rgba(30, 20, 10, 0.7)'
  },
  [Mood.PEACEFUL]: {
    overlay: 'rgba(15, 35, 45, 0.5)',      // Jemná modrá
    vignette: 'rgba(10, 25, 35, 0.7)'
  },
  [Mood.EPIC]: {
    overlay: 'rgba(45, 35, 15, 0.6)',      // Zlatá
    vignette: 'rgba(35, 25, 10, 0.8)'
  },
  [Mood.NEUTRAL]: {
    overlay: 'rgba(10, 10, 20, 0.4)',      // Neutrální tmavá
    vignette: 'rgba(5, 5, 15, 0.7)'
  }
}
