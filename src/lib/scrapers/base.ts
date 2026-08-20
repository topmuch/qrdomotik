import { chromium, type Browser, type BrowserContext } from 'playwright'
import type { ScrapingResult } from './types'
import { SCRAPING_MAX_RETRIES, SCRAPING_RETRY_DELAY_MS, SCRAPING_USER_AGENT } from './types'

/**
 * Classe de base abstraite pour tous les scrapers.
 * Gère le cycle de vie du navigateur, les tentatives et le nettoyage.
 */
export abstract class BaseScraper {
  abstract readonly source: string
  abstract readonly storeLocation: string

  protected readonly userAgent = SCRAPING_USER_AGENT

  /** Méthode à implémenter par chaque scraper concret */
  abstract scrape(): Promise<ScrapingResult>

  /**
   * Lance un navigateur Chromium headless avec configuration anti-détection.
   */
  protected async createBrowser(): Promise<{ browser: Browser; context: BrowserContext }> {
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
      ],
    })

    const context = await browser.newContext({
      userAgent: this.userAgent,
      viewport: { width: 1920, height: 1080 },
      locale: 'fr-FR',
      timezoneId: 'Europe/Paris',
      extraHTTPHeaders: {
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    })

    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false })
    })

    return { browser, context }
  }

  /** Ferme proprement le navigateur */
  protected async closeBrowser(browser: Browser): Promise<void> {
    try {
      await browser.close()
    } catch {
      // Le navigateur peut déjà être fermé
    }
  }

  /**
   * Exécute le scraping avec logique de retry.
   */
  async runWithRetry(): Promise<ScrapingResult> {
    let lastError: Error | undefined

    for (let attempt = 1; attempt <= SCRAPING_MAX_RETRIES; attempt++) {
      try {
        console.log(`[Scraper ${this.source}] Tentative ${attempt}/${SCRAPING_MAX_RETRIES}…`)
        const result = await this.scrape()
        return result
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        console.warn(`[Scraper ${this.source}] Tentative ${attempt} échouée : ${lastError.message}`)

        if (attempt < SCRAPING_MAX_RETRIES) {
          console.log(`[Scraper ${this.source}] Nouvelle tentative dans ${SCRAPING_RETRY_DELAY_MS}ms…`)
          await this.delay(SCRAPING_RETRY_DELAY_MS)
        }
      }
    }

    return {
      success: false,
      source: this.source,
      storeLocation: this.storeLocation,
      promos: [],
      error: `Échec après ${SCRAPING_MAX_RETRIES} tentatives : ${lastError?.message ?? 'Erreur inconnue'}`,
      durationMs: 0,
      productsScraped: 0,
    }
  }

  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Extrait des mots-clés à partir d'un titre (filtre les mots vides français).
   */
  protected extractKeywords(title: string): string[] {
    const stopWords = new Set([
      'le', 'la', 'les', 'de', 'des', 'du', 'un', 'une', 'et', 'à', 'au', 'aux',
      'en', 'pour', 'dans', 'sur', 'avec', 'par', 'ne', 'pas', 'plus', 'ou', 'où',
      'est', 'sont', 'a', 'son', 'sa', 'ses', 'ce', 'cette', 'ces', 'il', 'elle',
      'qui', 'que', 'qu', 'se', 'ont', 'très', 'tout', 'tous', 'toute',
      'fait', 'faire', 'entre', 'sous', 'chez', 'nos', 'votre', 'mon', 'ma', 'mes',
    ])

    return title
      .toLowerCase()
      .replace(/[^a-z0-9àâäéèêëïîôùûüÿçœæ\s-]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word))
  }

  /** Tronque un texte à maxLength caractères */
  protected truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength).trimEnd() + '…'
  }
}
