// ═══════════════════════════════════════════════════════
// QR DOMOTIK V3 — Types pour le système de scraping
// ═══════════════════════════════════════════════════════

export type ScrapingSource = 'carrefour' | 'auchan' | 'leclerc'

export interface ScrapedPromo {
  title: string
  description?: string
  imageUrl?: string
  originalPrice?: number
  promoPrice: number
  validFrom?: string // ISO date
  validUntil?: string // ISO date
  category?: string
  keywords: string[]
  sourceUrl?: string
}

export interface ScrapingResult {
  success: boolean
  source: string
  storeLocation: string
  promos: ScrapedPromo[]
  error?: string
  durationMs: number
  productsScraped: number
}

export const SCRAPING_MAX_RETRIES = 3
export const SCRAPING_RETRY_DELAY_MS = 5000
export const SCRAPING_USER_AGENT =
  'QRDomotik-Bot/1.0 (compatible; +https://qrdomotik.com/bot)'
