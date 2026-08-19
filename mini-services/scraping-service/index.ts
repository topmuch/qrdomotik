import { db } from './db'
import { ScrapingScheduler } from './scheduler'
import type { ScrapingSource } from './types'

const PORT = 3005
const startTime = Date.now()
const scheduler = new ScrapingScheduler()

/** En-têtes CORS */
const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

/** Réponse JSON utilitaire */
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  })
}

/** Log de requête avec timestamp */
function logRequest(method: string, path: string, status: number): void {
  const ts = new Date().toISOString()
  console.log(`[${ts}] ${method} ${path} → ${status}`)
}

/** Extrait le body JSON d'une requête */
async function parseBody<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T
  } catch {
    return null
  }
}

// ─── Démarrage du serveur ───────────────────────────────────────────

console.log(`[Scraping Service] Démarrage sur le port ${PORT}…`)

// Démarrer le planificateur
scheduler.start()
console.log('[Scraping Service] Planificateur démarré (cron 3h00)')

Bun.serve({
  port: PORT,

  async fetch(req) {
    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method

    // Gestion des requêtes OPTIONS (preflight CORS)
    if (method === 'OPTIONS') {
      logRequest(method, path, 204)
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    // ─── GET /health ──────────────────────────────────────────────
    if (method === 'GET' && path === '/health') {
      logRequest(method, path, 200)
      return json({
        status: 'ok',
        service: 'scraping-service',
        uptime: Math.floor((Date.now() - startTime) / 1000),
        version: '1.0.0',
      })
    }

    // ─── GET /scheduler/status ────────────────────────────────────
    if (method === 'GET' && path === '/scheduler/status') {
      logRequest(method, path, 200)
      const status = scheduler.getStatus()
      return json({
        isRunning: status.isRunning,
        isExecuting: status.isExecuting,
        nextRun: status.nextRun ? status.nextRun.toISOString() : null,
      })
    }

    // ─── POST /trigger ────────────────────────────────────────────
    if (method === 'POST' && path === '/trigger') {
      const body = await parseBody<{ source?: ScrapingSource | 'all' }>(req)
      const source = body?.source ?? 'all'

      console.log(`[Trigger] Déclenchement manuel — source : ${source}`)
      logRequest(method, path, 200)

      let results
      if (source === 'all') {
        results = await scheduler.runAllSources()
      } else {
        const result = await scheduler.runSource(source)
        results = [result]
      }

      return json({
        success: true,
        message: source === 'all'
          ? `Scraping de toutes les sources terminé`
          : `Scraping ${source} terminé`,
        results: results.map((r) => ({
          source: r.source,
          success: r.success,
          productsScraped: r.productsScraped,
          durationMs: r.durationMs,
          error: r.error ?? null,
        })),
      })
    }

    // ─── GET /jobs ────────────────────────────────────────────────
    if (method === 'GET' && path === '/jobs') {
      const jobs = await db.scrapingJob.findMany({
        orderBy: { startedAt: 'desc' },
        take: 20,
      })
      logRequest(method, path, 200)
      return json({
        success: true,
        count: jobs.length,
        jobs: jobs.map((j) => ({
          id: j.id,
          source: j.source,
          storeLocation: j.storeLocation,
          status: j.status,
          productsScraped: j.productsScraped,
          errorMessage: j.errorMessage,
          startedAt: j.startedAt.toISOString(),
          finishedAt: j.finishedAt?.toISOString() ?? null,
        })),
      })
    }

    // ─── GET /jobs/:id ────────────────────────────────────────────
    const jobMatch = path.match(/^\/jobs\/([a-zA-Z0-9]+)$/)
    if (method === 'GET' && jobMatch) {
      const jobId = jobMatch[1]
      const job = await db.scrapingJob.findUnique({ where: { id: jobId } })

      if (!job) {
        logRequest(method, path, 404)
        return json({ success: false, error: 'Tâche de scraping non trouvée' }, 404)
      }

      logRequest(method, path, 200)
      return json({
        success: true,
        job: {
          id: job.id,
          source: job.source,
          storeLocation: job.storeLocation,
          status: job.status,
          productsScraped: job.productsScraped,
          errorMessage: job.errorMessage,
          startedAt: job.startedAt.toISOString(),
          finishedAt: job.finishedAt?.toISOString() ?? null,
        },
      })
    }

    // ─── GET /stats ───────────────────────────────────────────────
    if (method === 'GET' && path === '/stats') {
      const [totalJobs, successJobs, lastJob, totalPromos, carrefourPromos, auchanPromos] =
        await Promise.all([
          db.scrapingJob.count(),
          db.scrapingJob.count({ where: { status: 'success' } }),
          db.scrapingJob.findFirst({ orderBy: { startedAt: 'desc' } }),
          db.promo.count({ where: { source: 'scraped' } }),
          db.promo.count({ where: { source: 'scraped' } }), // Utilise l'info de la source scraping
          db.promo.count({ where: { source: 'scraped' } }),
        ])

      // Compter les promos par source de scraping via les jobs
      const jobsBySource = await db.scrapingJob.groupBy({
        by: ['source'],
        _sum: { productsScraped: true },
      })

      const promosBySource: Record<string, number> = {}
      for (const g of jobsBySource) {
        promosBySource[g.source] = g._sum.productsScraped ?? 0
      }

      logRequest(method, path, 200)
      return json({
        success: true,
        stats: {
          totalJobs,
          successJobs,
          failedJobs: totalJobs - successJobs,
          successRate: totalJobs > 0 ? Math.round((successJobs / totalJobs) * 100) : 0,
          lastRun: lastJob ? lastJob.startedAt.toISOString() : null,
          totalPromosScraped: totalPromos,
          promosBySource,
        },
      })
    }

    // ─── 404 ─────────────────────────────────────────────────────
    logRequest(method, path, 404)
    return json({ success: false, error: 'Route non trouvée' }, 404)
  },

  error(error) {
    console.error(`[Scraping Service] Erreur serveur :`, error)
    return json({ success: false, error: 'Erreur interne du serveur' }, 500)
  },
})

console.log(`[Scraping Service] ✅ Serveur prêt sur http://localhost:${PORT}`)
