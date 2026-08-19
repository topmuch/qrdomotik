import { db } from './db'
import type { ScrapingSource, ScrapingResult } from './scrapers/types'
import { SCRAPING_CRON_HOUR } from './constants'

/**
 * Planificateur de scraping intégré à l'application Next.js.
 *
 * - Cron automatique à SCRAPING_CRON_HOUR (3h00)
 * - Déclenchement manuel via API
 * - Protection contre les exécutions simultanées
 * - Scrapers chargés dynamiquement (Playwright est lazy-importé)
 * - Nettoyage automatique des promos expirées
 */
class ScrapingScheduler {
  private intervalId: ReturnType<typeof setInterval> | null = null
  private isRunning = false
  private nextRun: Date | null = null
  private isExecuting = false
  private startedAt: Date | null = null

  /**
   * Démarre le planificateur cron.
   */
  start(): void {
    if (this.isRunning) return

    this.isRunning = true
    this.startedAt = new Date()
    console.log(`[ScrapingScheduler] Démarrage — prochaine exécution à ${SCRAPING_CRON_HOUR}h00`)

    const msUntilNext = this.calculateMsUntilNextRun()
    this.nextRun = new Date(Date.now() + msUntilNext)
    console.log(`[ScrapingScheduler] Prochain run prévu à ${this.nextRun.toISOString()}`)

    setTimeout(() => {
      this.runAllSources().finally(() => {
        this.intervalId = setInterval(() => {
          this.runAllSources()
          this.nextRun = new Date(Date.now() + 24 * 60 * 60 * 1000)
        }, 24 * 60 * 60 * 1000)
      })
    }, msUntilNext)
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    this.nextRun = null
    console.log('[ScrapingScheduler] Arrêté')
  }

  getStatus(): {
    isRunning: boolean
    isExecuting: boolean
    nextRun: Date | null
    startedAt: Date | null
    uptimeSeconds: number | null
  } {
    return {
      isRunning: this.isRunning,
      isExecuting: this.isExecuting,
      nextRun: this.nextRun,
      startedAt: this.startedAt,
      uptimeSeconds: this.startedAt
        ? Math.floor((Date.now() - this.startedAt.getTime()) / 1000)
        : null,
    }
  }

  async runAllSources(): Promise<ScrapingResult[]> {
    const sources: ScrapingSource[] = ['carrefour', 'auchan']
    const results: ScrapingResult[] = []
    for (const source of sources) {
      const result = await this.runSource(source)
      results.push(result)
    }
    return results
  }

  /**
   * Exécute un scraper pour une source donnée.
   * Les scrapers sont chargés dynamiquement pour éviter
   * d'importer Playwright au démarrage du serveur.
   */
  async runSource(source: ScrapingSource): Promise<ScrapingResult> {
    if (this.isExecuting) {
      return {
        success: false,
        source,
        storeLocation: 'Dakar',
        promos: [],
        error: 'Un scraping est déjà en cours',
        durationMs: 0,
        productsScraped: 0,
      }
    }

    this.isExecuting = true
    let job: any = null

    try {
      // Lazy-import du scraper uniquement quand nécessaire
      let scraper: { source: string; storeLocation: string; runWithRetry: () => Promise<ScrapingResult> }
      if (source === 'carrefour') {
        const mod = await import('./scrapers/carrefour')
        scraper = new mod.CarrefourScraper()
      } else if (source === 'auchan') {
        const mod = await import('./scrapers/auchan')
        scraper = new mod.AuchanScraper()
      } else {
        throw new Error(`Source de scraping inconnue : ${source}`)
      }

      // 1. Créer le job
      job = await db.scrapingJob.create({
        data: {
          source,
          storeLocation: scraper.storeLocation,
          status: 'running',
        },
      })
      console.log(`[ScrapingScheduler] Job ${job.id} créé pour ${source}`)

      // 2. Lancer le scraper
      const result = await scraper.runWithRetry()

      // 3. Insérer les promos
      if (result.success && result.promos.length > 0) {
        const defaultValidUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        for (const promo of result.promos) {
          try {
            await db.promo.create({
              data: {
                source: 'scraped',
                merchantId: null,
                title: promo.title,
                description: promo.description,
                imageUrl: promo.imageUrl,
                originalPrice: promo.originalPrice,
                promoPrice: promo.promoPrice,
                validFrom: promo.validFrom ? new Date(promo.validFrom) : new Date(),
                validUntil: promo.validUntil ? new Date(promo.validUntil) : defaultValidUntil,
                keywordsJson: JSON.stringify(promo.keywords),
                category: promo.category,
              },
            })
          } catch (err) {
            console.warn(`[ScrapingScheduler] Erreur insertion promo « ${promo.title} » : ${err}`)
          }
        }
      }

      // 4. Mettre à jour le job
      await db.scrapingJob.update({
        where: { id: job.id },
        data: {
          status: result.success ? 'success' : 'failed',
          productsScraped: result.productsScraped,
          finishedAt: new Date(),
          errorMessage: result.error,
        },
      })

      console.log(
        `[ScrapingScheduler] Job ${job.id} — ${result.success ? 'succès' : 'échec'} — ${result.productsScraped} produits`,
      )

      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error(`[ScrapingScheduler] Erreur critique pour ${source} : ${errorMsg}`)

      if (job) {
        try {
          await db.scrapingJob.update({
            where: { id: job.id },
            data: { status: 'failed', finishedAt: new Date(), errorMessage: errorMsg },
          })
        } catch (updateErr) {
          console.error(`[ScrapingScheduler] Impossible de mettre à jour le job : ${updateErr}`)
        }
      }

      return {
        success: false,
        source,
        storeLocation: 'Dakar',
        promos: [],
        error: errorMsg,
        durationMs: 0,
        productsScraped: 0,
      }
    } finally {
      // 5. Nettoyer les promos expirées
      try {
        const deleted = await db.promo.deleteMany({
          where: { source: 'scraped', validUntil: { lt: new Date() } },
        })
        if (deleted.count > 0) {
          console.log(`[ScrapingScheduler] ${deleted.count} promos scrapées expirées supprimées`)
        }
      } catch (err) {
        console.warn(`[ScrapingScheduler] Erreur nettoyage promos : ${err}`)
      }

      this.isExecuting = false
    }
  }

  private calculateMsUntilNextRun(): number {
    const now = new Date()
    const target = new Date(now)
    target.setHours(SCRAPING_CRON_HOUR, 0, 0, 0)
    if (target <= now) {
      target.setDate(target.getDate() + 1)
    }
    return target.getTime() - now.getTime()
  }
}

// Singleton global
const globalForScheduler = globalThis as unknown as {
  scrapingScheduler: ScrapingScheduler | undefined
}

const scheduler = globalForScheduler.scrapingScheduler ?? new ScrapingScheduler()

if (process.env.NODE_ENV !== 'production') {
  globalForScheduler.scrapingScheduler = scheduler
}

/** Retourne le scheduler en le démarrant si nécessaire */
export function getScrapingScheduler(): ScrapingScheduler {
  if (!scheduler.getStatus().isRunning) {
    scheduler.start()
  }
  return scheduler
}

/** Proxy avec auto-start */
export const scrapingScheduler = new Proxy(scheduler, {
  get(target, prop) {
    if (!target.getStatus().isRunning) {
      target.start()
    }
    const value = (target as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function' ? value.bind(target) : value
  },
})

export { ScrapingScheduler }
