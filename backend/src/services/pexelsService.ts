/**
 * Pexels Service - Integrace s Pexels API pro hledání atmosférických fotek
 * Free tier: 200 requests/hour
 * Dokumentace: https://www.pexels.com/api/documentation/
 */

import { PexelsSearchResponse, PexelsPhoto } from '../types/atmosphere.types'

// Cache systém: Map<searchQuery, {url: string, timestamp: number}>
interface CacheEntry {
  url: string
  photoId: number
  timestamp: number
}

const photoCache = new Map<string, CacheEntry>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hodina v milliseconds

// Default fallback background (dark fantasy)
const DEFAULT_BACKGROUND = 'https://images.pexels.com/photos/1809347/pexels-photo-1809347.jpeg?auto=compress&cs=tinysrgb&w=1920'

/**
 * Pexels Service Class
 */
class PexelsService {
  private apiKey: string
  private baseUrl: string = 'https://api.pexels.com/v1'

  constructor() {
    this.apiKey = process.env.PEXELS_API_KEY || ''

    if (!this.apiKey) {
      console.warn('⚠️  PEXELS_API_KEY není nastavený - bude použit fallback background')
    }
  }

  /**
   * Vyhledá fotku podle query s cache podporou
   * @param query - Search query (např. "dark forest mysterious night")
   * @returns URL fotky
   */
  async getCachedOrSearch(query: string): Promise<{ url: string; photoId?: number }> {
    // Normalizuj query (lowercase, trim)
    const normalizedQuery = query.toLowerCase().trim()

    // Zkontroluj cache
    const cached = this.getFromCache(normalizedQuery)
    if (cached) {
      console.log(`✅ Cache HIT pro query: "${normalizedQuery}"`)
      return { url: cached.url, photoId: cached.photoId }
    }

    console.log(`🔍 Cache MISS pro query: "${normalizedQuery}" - vyhledávám na Pexels...`)

    // Search na Pexels
    try {
      const result = await this.searchPhoto(normalizedQuery)

      // Ulož do cache
      this.saveToCache(normalizedQuery, result.url, result.photoId)

      return result
    } catch (error) {
      console.error('❌ Chyba při hledání fotky na Pexels:', error)
      return { url: DEFAULT_BACKGROUND }
    }
  }

  /**
   * Vyhledá fotku na Pexels API
   * @param query - Search query
   * @returns URL a ID fotky
   */
  private async searchPhoto(query: string): Promise<{ url: string; photoId: number }> {
    if (!this.apiKey) {
      console.warn('⚠️  Pexels API není dostupný - používám fallback')
      return { url: DEFAULT_BACKGROUND, photoId: 0 }
    }

    try {
      // Build search URL
      const searchUrl = new URL(`${this.baseUrl}/search`)
      searchUrl.searchParams.set('query', query)
      searchUrl.searchParams.set('per_page', '3') // Vezmi top 3 výsledky
      searchUrl.searchParams.set('orientation', 'landscape') // Preferuj landscape
      searchUrl.searchParams.set('size', 'large')

      // Fetch from Pexels
      const response = await fetch(searchUrl.toString(), {
        headers: {
          Authorization: this.apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status} ${response.statusText}`)
      }

      const data: PexelsSearchResponse = await response.json()

      // Zkontroluj že máme výsledky
      if (!data.photos || data.photos.length === 0) {
        console.warn(`⚠️  Žádné výsledky pro query: "${query}" - používám fallback`)
        return { url: DEFAULT_BACKGROUND, photoId: 0 }
      }

      // Vyber random z top 3 (pro variety)
      const randomIndex = Math.floor(Math.random() * Math.min(data.photos.length, 3))
      const selectedPhoto: PexelsPhoto = data.photos[randomIndex]

      // Používej large2x pro high quality
      const photoUrl = selectedPhoto.src.large2x || selectedPhoto.src.large

      console.log(`✅ Nalezena fotka: ${photoUrl.substring(0, 60)}... (ID: ${selectedPhoto.id})`)

      return {
        url: photoUrl,
        photoId: selectedPhoto.id,
      }
    } catch (error: any) {
      console.error('❌ Chyba při volání Pexels API:', error.message)
      throw error
    }
  }

  /**
   * Získá fotku z cache (pokud není expirovaná)
   * @param query - Search query
   * @returns Cache entry nebo null
   */
  private getFromCache(query: string): CacheEntry | null {
    const cached = photoCache.get(query)

    if (!cached) {
      return null
    }

    // Zkontroluj expirace
    const now = Date.now()
    if (now - cached.timestamp > CACHE_TTL) {
      // Cache expiroval
      photoCache.delete(query)
      return null
    }

    return cached
  }

  /**
   * Uloží fotku do cache
   * @param query - Search query
   * @param url - URL fotky
   * @param photoId - Pexels photo ID
   */
  private saveToCache(query: string, url: string, photoId: number): void {
    photoCache.set(query, {
      url,
      photoId,
      timestamp: Date.now(),
    })

    console.log(`💾 Uloženo do cache: "${query}" (cache size: ${photoCache.size})`)
  }

  /**
   * Vyčistí celou cache (pro testing/debugging)
   */
  clearCache(): void {
    photoCache.clear()
    console.log('🗑️  Cache vyčištěna')
  }

  /**
   * Vrátí statistiky cache
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: photoCache.size,
      entries: Array.from(photoCache.keys()),
    }
  }

  /**
   * Test Pexels API připojení
   */
  async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      console.error('❌ PEXELS_API_KEY není nastavený')
      return false
    }

    try {
      console.log('🧪 Testuji Pexels API připojení...')
      const result = await this.searchPhoto('fantasy forest')
      console.log('✅ Pexels API test úspěšný:', result.url.substring(0, 60) + '...')
      return true
    } catch (error: any) {
      console.error('❌ Pexels API test selhali:', error.message)
      return false
    }
  }
}

// Export singleton instance
export const pexelsService = new PexelsService()
