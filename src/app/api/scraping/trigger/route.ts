import { NextRequest, NextResponse } from 'next/server'
import { SCRAPING_SOURCES } from '@/lib/constants'
import { scrapingScheduler } from '@/lib/scraping-scheduler'
import type { ScrapingSource } from '@/lib/scrapers/types'

/**
 * POST /api/scraping/trigger
 * Déclenche un scraping manuel.
 * Body : { source?: 'carrefour' | 'auchan' | 'all' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { source } = body as { source?: string }

    // Validation de la source
    const validSources = [...SCRAPING_SOURCES, 'all'] as const
    if (source && !validSources.includes(source as typeof validSources[number])) {
      return NextResponse.json(
        { success: false, error: `Source invalide. Sources acceptées : ${validSources.join(', ')}` },
        { status: 400 },
      )
    }

    const schedulerStatus = scrapingScheduler.getStatus()
    if (schedulerStatus.isExecuting) {
      return NextResponse.json(
        { success: false, error: 'Un scraping est déjà en cours. Veuillez réessayer plus tard.' },
        { status: 409 },
      )
    }

    let results
    if (source === 'all' || !source) {
      results = await scrapingScheduler.runAllSources()
    } else {
      const result = await scrapingScheduler.runSource(source as ScrapingSource)
      results = [result]
    }

    return NextResponse.json({
      success: true,
      message: source === 'all'
        ? 'Scraping de toutes les sources terminé'
        : `Scraping ${source} terminé`,
      results: results.map((r) => ({
        source: r.source,
        success: r.success,
        productsScraped: r.productsScraped,
        durationMs: r.durationMs,
        error: r.error ?? null,
      })),
    })
  } catch (error) {
    console.error('[Scraping Trigger] Erreur :', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors du déclenchement du scraping' },
      { status: 500 },
    )
  }
}
