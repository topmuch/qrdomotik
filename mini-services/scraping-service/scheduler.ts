import { db } from './db'
import { CarrefourScraper } from './scrapers/carrefour'
import { AuchanScraper } from './scrapers/auchan'
import type { ScrapingSource, ScrapingResult } from './types'
import { SCRAPING_CRON_HOUR } from './types'

type ScraperMap = Record<ScrapingSource, CarrefourScraper | AuchanScraper>

/**
 * Planificateur de scraping — exécute les scrapers à heure fixe (3h00)
 * et permet les déclenchements manuels.
 */
export class ScrapingScheduler {
  private intervalId: ReturnType<typeof setInterval> | null = null
  private isRunning = false
  private nextRun: Date | null = null
  private isExecuting = false

  private scrapers: ScraperMap = {
    carrefour: new CarrefourScraper(),
    auchan: new AuchanScraper(),
  }

  /**
   * Démarre le planificateur cron.
   * Calcule le délai jusqu'à la prochaine exécution à SCRAPING_CRON_HOUR,
   * puis se répète toutes les 24h.
   */
  start(): void {
    if (this.isRunning) return

    this.isRunning = true
    console.log(`[Scheduler] Démarrage — prochaine exécution à ${SCRAPING_CRON_HOUR}h00`)

    // Calcul du délai jusqu'à la prochaine exécution
    const msUntilNext = this.calculateMsUntilNextRun()
    this.nextRun = new Date(Date.now() + msUntilNext)
    console.log(`[Scheduler] Prochain run prévu à ${this.nextRun.toISOString()}`)

    // Premier déclenchement
    setTimeout(() => {
      this.runAllSources().finally(() => {
        // Puis intervalle toutes les 24h
        this.intervalId = setInterval(() => {
          this.runAllSources()
          this.nextRun = new Date(Date.now() + 24 * 60 * 60 * 1000)
        }, 24 * 60 * 60 * 1000)
      })
    }, msUntilNext)
  }

  /**
   * Arrête le planificateur.
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    this.nextRun = null
    console.log('[Scheduler] Arrêté')
  }

  /**
   * Retourne le statut actuel du planificateur.
   */
  getStatus(): { isRunning: boolean; nextRun: Date | null; isExecuting: boolean } {
    return {
      isRunning: this.isRunning,
      nextRun: this.nextRun,
      isExecuting: this.isExecuting,
    }
  }

  /**
   * Exécute tous les scrapers séquentiellement.
   */
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
   * Exécute un scraper pour une source donnée :
   * 1. Crée un ScrapingJob en base (status='running')
   * 2. Lance le scraper avec retry
   * 3. Insère les promos en base
   * 4. Met à jour le ScrapingJob
   * 5. Nettoie les promos expirées
   */
  async runSource(source: ScrapingSource): Promise<ScrapingResult> {
    if (this.isExecuting) {
      console.warn(`[Scheduler] Un scraping est déjà en cours, ignoré pour ${source}`)
      return {
        success: false,
        source,
        storeLocation: this.scrapers[source].storeLocation,
        promos: [],
        error: 'Un scraping est déjà en cours',
        durationMs: 0,
        productsScraped: 0,
      }
    }

    this.isExecuting = true
    let job: any = null

    try {
      // 1. Créer le job en base
      job = await db.scrapingJob.create({
        data: {
          source,
          storeLocation: this.scrapers[source].storeLocation,
          status: 'running',
        },
      })
      console.log(`[Scheduler] Job ${job.id} créé pour ${source}`)

      // 2. Lancer le scraper
      const result = await this.scrapers[source].runWithRetry()

      // 3. Insérer les promos en base
      if (result.success && result.promos.length > 0) {
        const defaultValidUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours par défaut

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
            console.warn(`[Scheduler] Erreur insertion promo « ${promo.title} » : ${err}`)
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
        `[Scheduler] Job ${job.id} terminé — ${result.success ? 'succès' : 'échec'} — ${result.productsScraped} produits`
      )

      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error(`[Scheduler] Erreur critique pour ${source} : ${errorMsg}`)

      // Mettre à jour le job en échec
      if (job) {
        try {
          await db.scrapingJob.update({
            where: { id: job.id },
            data: {
              status: 'failed',
              finishedAt: new Date(),
              errorMessage: errorMsg,
            },
          })
        } catch (updateErr) {
          console.error(`[Scheduler] Impossible de mettre à jour le job : ${updateErr}`)
        }
      }

      return {
        success: false,
        source,
        storeLocation: this.scrapers[source].storeLocation,
        promos: [],
        error: errorMsg,
        durationMs: 0,
        productsScraped: 0,
      }
    } finally {
      // 5. Nettoyer les promos scrapées expirées
      try {
        const deleted = await db.promo.deleteMany({
          where: {
            source: 'scraped',
            validUntil: { lt: new Date() },
          },
        })
        if (deleted.count > 0) {
          console.log(`[Scheduler] ${deleted.count} promos scrapées expirées supprimées`)
        }
      } catch (err) {
        console.warn(`[Scheduler] Erreur nettoyage promos expirées : ${err}`)
      }

      this.isExecuting = false
    }
  }

  /**
   * Calcule le nombre de millisecondes jusqu'à la prochaine exécution à SCRAPING_CRON_HOUR.
   */
  private calculateMsUntilNextRun(): number {
    const now = new Date()
    const target = new Date(now)
    target.setHours(SCRAPING_CRON_HOUR, 0, 0, 0)

    // Si l'heure cible est déjà passée aujourd'hui, planifier pour demain
    if (target <= now) {
      target.setDate(target.getDate() + 1)
    }

    return target.getTime() - now.getTime()
  }
}
