import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { haversineDistance, boundingBox, extractKeywords, matchScore, formatDistance } from '@/lib/geo';
import { PROMO_MATCHING_RADIUS_KM } from '@/lib/constants';
import { z } from 'zod';

const matchingSchema = z.object({
  items: z.array(z.string().min(1)).min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusKm: z.number().min(0.1).max(20).optional(),
});

type MatchResult = {
  item: string;
  matches: Array<{
    promo: {
      id: string;
      title: string;
      description: string | null;
      imageUrl: string | null;
      originalPrice: number | null;
      promoPrice: number;
      validUntil: string | null;
      isFlashSale: boolean;
    };
    merchant: {
      id: string;
      name: string;
      category: string;
      address: string | null;
    } | null;
    score: number;
    distance: number;
    distanceText: string;
  }>;
};

// POST /api/matching — Match shopping list items to nearby promos
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, latitude, longitude, radiusKm } = matchingSchema.parse(body);

    const radius = radiusKm ?? PROMO_MATCHING_RADIUS_KM;
    const now = new Date();
    const center = { latitude, longitude };

    // Bounding box pre-filter for merchants
    const bbox = boundingBox(center, radius);

    // Fetch all active promos within radius that have a merchant
    const promos = await db.promo.findMany({
      where: {
        AND: [
          { validFrom: { lte: now } },
          { OR: [{ validUntil: { gte: now } }, { validUntil: null }] },
          { merchantId: { not: null } },
          {
            merchant: {
              AND: [
                { latitude: { gte: bbox.minLat } },
                { latitude: { lte: bbox.maxLat } },
                { longitude: { gte: bbox.minLng } },
                { longitude: { lte: bbox.maxLng } },
                { isActive: true },
              ],
            },
          },
        ],
      },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            category: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    // For each shopping list item, compute matches
    const results: MatchResult[] = [];

    for (const item of items) {
      const itemKeywords = extractKeywords(item);
      if (itemKeywords.length === 0) continue;

      const matches: MatchResult['matches'] = [];

      for (const promo of promos) {
        // Parse promo keywords
        let promoKeywords: string[] = [];
        try {
          promoKeywords = promo.keywordsJson ? JSON.parse(promo.keywordsJson) : [];
        } catch {
          // ignore malformed JSON
        }

        // Also extract keywords from title and description
        const titleKeywords = extractKeywords(promo.title);
        const descKeywords = promo.description ? extractKeywords(promo.description) : [];
        const allPromoKeywords = [...new Set([...promoKeywords, ...titleKeywords, ...descKeywords])];

        // Calculate match score
        const score = matchScore(itemKeywords, allPromoKeywords);
        if (score === 0) continue;

        // Calculate distance
        const distanceKm = promo.merchant
          ? haversineDistance(center, { latitude: promo.merchant.latitude, longitude: promo.merchant.longitude })
          : Infinity;

        // Filter by actual haversine distance
        if (distanceKm > radius) continue;

        matches.push({
          promo: {
            id: promo.id,
            title: promo.title,
            description: promo.description,
            imageUrl: promo.imageUrl,
            originalPrice: promo.originalPrice,
            promoPrice: promo.promoPrice,
            validUntil: promo.validUntil?.toISOString() ?? null,
            isFlashSale: promo.isFlashSale,
          },
          merchant: promo.merchant
            ? {
                id: promo.merchant.id,
                name: promo.merchant.name,
                category: promo.merchant.category,
                address: promo.merchant.address,
              }
            : null,
          score,
          distance: distanceKm,
          distanceText: formatDistance(distanceKm),
        });
      }

      // Sort matches by score (desc) then distance (asc)
      matches.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.distance - b.distance;
      });

      // Keep top 3 matches per item
      results.push({
        item,
        matches: matches.slice(0, 3),
      });
    }

    // Sort items by number of matches (desc)
    results.sort((a, b) => b.matches.length - a.matches.length);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 },
      );
    }
    console.error('[POST /api/matching]', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 },
    );
  }
}
