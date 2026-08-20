import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/scraping/promos
 * Liste les promos scrapées actives.
 * Query params : source, category, limit (default 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source')
    const category = searchParams.get('category')
    const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100)

    const where: Record<string, unknown> = {
      source: 'scraped',
      validUntil: { gte: new Date() },
    }

    if (source) where.source = source
    if (category) where.category = category

    const promos = await db.promo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      count: promos.length,
      promos: promos.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        imageUrl: p.imageUrl,
        originalPrice: p.originalPrice,
        promoPrice: p.promoPrice,
        discount: p.originalPrice
          ? Math.round(((p.originalPrice - p.promoPrice) / p.originalPrice) * 100)
          : null,
        validFrom: p.validFrom?.toISOString() ?? null,
        validUntil: p.validUntil?.toISOString() ?? null,
        keywords: JSON.parse(p.keywordsJson || '[]'),
        category: p.category,
        source: p.source,
        viewsCount: p.viewsCount,
        redemptionsCount: p.redemptionsCount,
      })),
    })
  } catch (error) {
    console.error('[Scraping Promos] Erreur :', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des promos scrapées' },
      { status: 500 },
    )
  }
}
