import { NextResponse } from 'next/server'
import { scrapingScheduler } from '@/lib/scraping-scheduler'

/**
 * GET /api/scraping/scheduler
 * Statut du planificateur de scraping.
 */
export async function GET() {
  const status = scrapingScheduler.getStatus()
  return NextResponse.json({
    success: true,
    ...status,
    nextRun: status.nextRun?.toISOString() ?? null,
    startedAt: status.startedAt?.toISOString() ?? null,
  })
}
