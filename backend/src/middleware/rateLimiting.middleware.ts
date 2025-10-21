/**
 * Rate Limiting Middleware
 * Ochrana proti zneužití API, zejména drahých AI operací
 */

import rateLimit from 'express-rate-limit'

/**
 * Rate limiter pro AI/Gemini endpointy
 * Omezení: 15 požadavků za 15 minut (Gemini free tier limit)
 * Důvod: Gemini API má limit 15 RPM (requests per minute) na free tier
 */
export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 15, // Max 15 požadavků za okno
  message: {
    success: false,
    error: 'Příliš mnoho požadavků na AI',
    message: 'Prosím počkejte chvíli před dalším požadavkem. Limit: 15 požadavků za 15 minut.',
    retryAfter: '15 minut'
  },
  standardHeaders: true, // Vrátit rate limit info v `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Store v paměti (pro produkci použít Redis)
  skipSuccessfulRequests: false, // Počítej i úspěšné požadavky
  skipFailedRequests: false, // Počítej i neúspěšné požadavky
})

/**
 * Rate limiter pro standardní API endpointy
 * Omezení: 100 požadavků za 15 minut
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100, // Max 100 požadavků za okno
  message: {
    success: false,
    error: 'Příliš mnoho požadavků',
    message: 'Prosím počkejte chvíli před dalším požadavkem. Limit: 100 požadavků za 15 minut.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Rate limiter pro vytváření postav
 * Omezení: 10 postav za hodinu
 * Důvod: Prevence spamu a zneužití databáze
 */
export const characterCreationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hodina
  max: 10, // Max 10 nových postav za hodinu
  message: {
    success: false,
    error: 'Příliš mnoho nových postav',
    message: 'Můžete vytvořit maximálně 10 postav za hodinu. Zkuste to později.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip GET requests (načítání postav)
  skip: (req) => req.method !== 'POST'
})

/**
 * Velmi přísný rate limiter pro expensive operations
 * Omezení: 5 požadavků za hodinu
 */
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hodina
  max: 5, // Max 5 požadavků za hodinu
  message: {
    success: false,
    error: 'Dosáhli jste limitu pro tuto operaci',
    message: 'Tato operace je omezena na 5 požadavků za hodinu.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})
