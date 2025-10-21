/**
 * Atmosphere Types - Definice typů pro dynamické pozadí
 * Používáno pro analýzu AI narrativy a generování atmosférických efektů
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
 * Typy lokací (pro lepší search queries)
 */
export enum LocationType {
  FOREST = 'forest',
  TAVERN = 'tavern',
  MOUNTAIN = 'mountain',
  CAVE = 'cave',
  CASTLE = 'castle',
  DUNGEON = 'dungeon',
  VILLAGE = 'village',
  CITY = 'city',
  RUINS = 'ruins',
  DESERT = 'desert',
  OCEAN = 'ocean',
  SWAMP = 'swamp',
  PLAINS = 'plains',
  UNKNOWN = 'unknown'
}

/**
 * Kompletní atmosphere data vrácená z analýzy
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

  /** Vygenerovaný search query pro Pexels */
  searchQuery: string

  /** URL fotky z Pexels */
  backgroundUrl: string

  /** Pexels photo ID (pro tracking/cache) */
  pexelsPhotoId?: string
}

/**
 * Výsledek analýzy AI (před získáním fotky)
 */
export interface AtmosphereAnalysis {
  location: string
  mood: Mood
  timeOfDay: TimeOfDay
  weather?: string
}

/**
 * Pexels API response types
 */
export interface PexelsPhoto {
  id: number
  width: number
  height: number
  url: string
  photographer: string
  photographer_url: string
  src: {
    original: string
    large2x: string
    large: string
    medium: string
    small: string
    portrait: string
    landscape: string
    tiny: string
  }
}

export interface PexelsSearchResponse {
  total_results: number
  page: number
  per_page: number
  photos: PexelsPhoto[]
  next_page?: string
}
