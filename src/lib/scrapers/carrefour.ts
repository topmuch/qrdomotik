import type { Page } from 'playwright'
import { BaseScraper } from './base'
import type { ScrapedPromo, ScrapingResult } from './types'

/**
 * Scraper Carrefour — extrait les promotions depuis carrefour.fr
 *
 * Stratégie :
 * 1. Navigation vers la page promotions
 * 2. Extraction des cartes promo via sélecteurs CSS multiples
 * 3. Parsing des prix, dates et images
 * 4. Gestion gracieuse des blocages anti-bot
 */
export class CarrefourScraper extends BaseScraper {
  readonly source = 'carrefour'
  readonly storeLocation = 'Dakar'

  private readonly promoUrl = 'https://www.carrefour.fr/promotions'

  async scrape(): Promise<ScrapingResult> {
    const startTime = Date.now()
    let browser: import('playwright').Browser | null = null

    try {
      const { browser: b, context } = await this.createBrowser()
      browser = b

      const page = await context.newPage()
      page.setDefaultTimeout(30_000)

      console.log(`[Carrefour] Navigation vers ${this.promoUrl}…`)
      const response = await page.goto(this.promoUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      })

      if (!response || response.status() >= 400) {
        throw new Error(`HTTP ${response?.status() ?? 'pas de réponse'} — page inaccessible`)
      }

      const pageContent = await page.content()
      if (this.isBlocked(pageContent)) {
        console.warn('[Carrefour] Page bloquée par anti-bot, tentative de contournement…')
        await this.delay(3000)
        await page.reload({ waitUntil: 'domcontentloaded' })
      }

      try {
        await page.waitForSelector(
          '[data-testid="product-card"], .product-card, article, .card, [class*="promo"], [class*="offer"]',
          { timeout: 15_000 },
        )
      } catch {
        console.warn('[Carrefour] Aucun sélecteur promo trouvé')
      }

      const promos = await this.extractPromos(page)

      return {
        success: true,
        source: this.source,
        storeLocation: this.storeLocation,
        promos,
        durationMs: Date.now() - startTime,
        productsScraped: promos.length,
      }
    } finally {
      if (browser) await this.closeBrowser(browser)
    }
  }

  private async extractPromos(page: Page): Promise<ScrapedPromo[]> {
    const promos: ScrapedPromo[] = []

    // Stratégie 1 : sélecteurs Carrefour spécifiques
    const cards = await page.$$('[data-testid="product-card"]')

    if (cards.length > 0) {
      console.log(`[Carrefour] ${cards.length} cartes produit (data-testid)`)
      for (const card of cards) {
        try {
          const promo = await this.parseProductCard(card)
          if (promo) promos.push(promo)
        } catch (err) {
          console.warn(`[Carrefour] Erreur parsing carte : ${err}`)
        }
      }
    } else {
      // Stratégie 2 : sélecteurs génériques
      console.log('[Carrefour] Recherche par sélecteurs génériques…')
      const genericCards = await page.$$('[class*="product"], [class*="promo"], [class*="offer"], article')
      for (const card of genericCards) {
        try {
          const promo = await this.parseGenericCard(card)
          if (promo) promos.push(promo)
        } catch {
          // Ignorer les cartes non-promo
        }
      }
    }

    console.log(`[Carrefour] ${promos.length} promotions extraites`)
    return promos
  }

  private async parseProductCard(card: any): Promise<ScrapedPromo | null> {
    const titleEl = await card.$('[data-testid="product-title"], h3, h2, .title, [class*="title"]')
    const title = titleEl ? await titleEl.textContent() : null
    if (!title?.trim()) return null

    const cleanTitle = title.trim()
    const promoPrice = await this.extractPrice(card, '[data-testid="product-price"], .price--promo, [class*="price"]')
    if (promoPrice === null) return null

    const originalPrice = await this.extractPrice(
      card,
      '[data-testid="product-original-price"], .price--old, .price--through, [class*="original"], s, del',
    )

    const imgEl = await card.$('img')
    let imageUrl: string | undefined
    if (imgEl) {
      imageUrl = (await imgEl.getAttribute('src')) || (await imgEl.getAttribute('data-src')) || undefined
    }

    const descEl = await card.$('[class*="description"], p, [data-testid="product-description"]')
    const descText = descEl ? await descEl.textContent() : null

    const validUntil = await this.extractDate(card)
    const category = await this.extractCategory(card)

    return {
      title: cleanTitle,
      description: descText ? this.truncate(descText.trim(), 200) : undefined,
      imageUrl,
      originalPrice: originalPrice ?? undefined,
      promoPrice,
      validUntil,
      category,
      keywords: this.extractKeywords(cleanTitle),
      sourceUrl: this.promoUrl,
    }
  }

  private async parseGenericCard(card: any): Promise<ScrapedPromo | null> {
    const heading = await card.$('h1, h2, h3, h4, [class*="title"]')
    const title = heading ? await heading.textContent() : null
    if (!title?.trim()) return null

    const cleanTitle = title.trim()
    const cardText = (await card.textContent()) ?? ''
    const prices = this.parsePricesFromText(cardText)
    if (prices.length === 0) return null

    const imgEl = await card.$('img')
    let imageUrl: string | undefined
    if (imgEl) {
      imageUrl = (await imgEl.getAttribute('src')) || (await imgEl.getAttribute('data-src')) || undefined
    }

    return {
      title: cleanTitle,
      description: this.truncate(cardText.slice(0, 200), 200),
      imageUrl,
      originalPrice: prices.length > 1 ? prices[prices.length - 1] : undefined,
      promoPrice: prices[0],
      category: 'divers',
      keywords: this.extractKeywords(cleanTitle),
      sourceUrl: this.promoUrl,
    }
  }

  private async extractPrice(element: any, selectors: string): Promise<number | null> {
    for (const sel of selectors.split(', ')) {
      try {
        const el = await element.$(sel.trim())
        if (el) {
          const text = await el.textContent()
          if (text) {
            const price = this.parsePrice(text)
            if (price !== null) return price
          }
        }
      } catch {
        // Passer au sélecteur suivant
      }
    }
    return null
  }

  private parsePrice(text: string): number | null {
    const match = text.replace(/\s/g, '').match(/(\d+[.,]\d{2})/)
    if (!match) return null
    return parseFloat(match[1].replace(',', '.'))
  }

  private parsePricesFromText(text: string): number[] {
    const matches = text.match(/\d+[.,]\d{2}/g)
    if (!matches) return []
    return matches.map((m) => parseFloat(m.replace(',', '.')))
  }

  private async extractDate(element: any): Promise<string | undefined> {
    try {
      const dateEl = await element.$('[class*="date"], [class*="valid"], [class*="expire"], time')
      if (!dateEl) return undefined

      const text = await dateEl.textContent()
      if (!text) return undefined

      const datetime = await dateEl.getAttribute('datetime')
      if (datetime) {
        const parsed = new Date(datetime)
        if (!isNaN(parsed.getTime())) return parsed.toISOString()
      }

      const frDateMatch = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
      if (frDateMatch) {
        const [, day, month, year] = frDateMatch
        const parsed = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`)
        if (!isNaN(parsed.getTime())) return parsed.toISOString()
      }
    } catch {
      // Date non trouvée
    }
    return undefined
  }

  private async extractCategory(element: any): Promise<string | undefined> {
    try {
      const catEl = await element.$('[class*="category"], [class*="cat"], [data-testid*="category"]')
      if (catEl) {
        const text = await catEl.textContent()
        return text?.trim() || undefined
      }
    } catch {
      // Catégorie non trouvée
    }
    return undefined
  }

  private isBlocked(pageContent: string): boolean {
    const blockIndicators = [
      'captcha', 'robot', 'not a robot', 'challenge',
      'accès refusé', 'interdit', 'cloudflare',
      'just a moment', 'attention required',
    ]
    const lower = pageContent.toLowerCase()
    return blockIndicators.some((indicator) => lower.includes(indicator))
  }
}
