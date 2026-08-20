import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SCRAPING_SOURCE_LABELS, SCRAPING_JOB_STATUS_LABELS } from '@/types'

/**
 * GET /api/scraping/jobs
 * Liste les dernières tâches de scraping avec stats agrégées.
 */
export async function GET() {
  try {
    const [jobs, totalCount, successCount, last24hCount] = await Promise.all([
      db.scrapingJob.findMany({
        orderBy: { startedAt: 'desc' },
        take: 50,
      }),
      db.scrapingJob.count(),
      db.scrapingJob.count({ where: { status: 'success' } }),
      db.scrapingJob.count({
        where: {
          startedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      jobs: jobs.map((j) => ({
        id: j.id,
        source: j.source,
        sourceLabel: SCRAPING_SOURCE_LABELS[j.source as keyof typeof SCRAPING_SOURCE_LABELS] ?? j.source,
        storeLocation: j.storeLocation,
        status: j.status,
        statusLabel: SCRAPING_JOB_STATUS_LABELS[j.status as keyof typeof SCRAPING_JOB_STATUS_LABELS] ?? j.status,
        productsScraped: j.productsScraped,
        errorMessage: j.errorMessage,
        startedAt: j.startedAt.toISOString(),
        finishedAt: j.finishedAt?.toISOString() ?? null,
        durationMs: j.finishedAt
          ? j.finishedAt.getTime() - j.startedAt.getTime()
          : null,
      })),
      stats: {
        total: totalCount,
        successRate: totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0,
        last24h: last24hCount,
      },
    })
  } catch (error) {
    console.error('[Scraping Jobs] Erreur :', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des tâches de scraping' },
      { status: 500 },
    )
  }
}
