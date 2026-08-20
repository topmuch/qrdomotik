import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/scraping/stats
 * Statistiques agrégées du système de scraping.
 */
export async function GET() {
  try {
    const [
      totalJobs,
      successJobs,
      failedJobs,
      runningJobs,
      lastJob,
      totalScrapedPromos,
      activeScrapedPromos,
      jobsBySource,
      recentJobs,
    ] = await Promise.all([
      db.scrapingJob.count(),
      db.scrapingJob.count({ where: { status: 'success' } }),
      db.scrapingJob.count({ where: { status: 'failed' } }),
      db.scrapingJob.count({ where: { status: 'running' } }),
      db.scrapingJob.findFirst({ orderBy: { startedAt: 'desc' } }),
      db.promo.count({ where: { source: 'scraped' } }),
      db.promo.count({
        where: {
          source: 'scraped',
          validUntil: { gte: new Date() },
        },
      }),
      db.scrapingJob.groupBy({
        by: ['source'],
        _sum: { productsScraped: true },
        _count: { id: true },
      }),
      db.scrapingJob.findMany({
        orderBy: { startedAt: 'desc' },
        take: 7,
      }),
    ])

    // Promos par catégorie
    const promosByCategory = await db.promo.groupBy({
      where: { source: 'scraped' },
      by: ['category'],
      _count: { id: true },
    })

    // Durée moyenne des jobs réussis
    const successfulJobs = await db.scrapingJob.findMany({
      where: {
        status: 'success',
        finishedAt: { not: null },
      },
      orderBy: { startedAt: 'desc' },
      take: 20,
    })

    const avgDurationMs =
      successfulJobs.length > 0
        ? Math.round(
            successfulJobs.reduce((sum, j) => {
              return sum + ((j.finishedAt?.getTime() ?? 0) - j.startedAt.getTime())
            }, 0) / successfulJobs.length,
          )
        : null

    return NextResponse.json({
      success: true,
      stats: {
        jobs: {
          total: totalJobs,
          success: successJobs,
          failed: failedJobs,
          running: runningJobs,
          successRate: totalJobs > 0 ? Math.round((successJobs / totalJobs) * 100) : 0,
          avgDurationMs,
          lastRun: lastJob?.startedAt.toISOString() ?? null,
          lastStatus: lastJob?.status ?? null,
        },
        promos: {
          totalScraped: totalScrapedPromos,
          active: activeScrapedPromos,
          expired: totalScrapedPromos - activeScrapedPromos,
          bySource: jobsBySource.reduce(
            (acc, g) => {
              acc[g.source] = g._sum.productsScraped ?? 0
              return acc
            },
            {} as Record<string, number>,
          ),
          byCategory: promosByCategory.reduce(
            (acc, g) => {
              const cat = g.category ?? 'autre'
              acc[cat] = g._count.id
              return acc
            },
            {} as Record<string, number>,
          ),
        },
        recentActivity: recentJobs.map((j) => ({
          id: j.id,
          source: j.source,
          status: j.status,
          productsScraped: j.productsScraped,
          startedAt: j.startedAt.toISOString(),
        })),
      },
    })
  } catch (error) {
    console.error('[Scraping Stats] Erreur :', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 },
    )
  }
}
