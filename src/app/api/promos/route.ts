'use server';

import { db } from '@/lib/db';
import { haversineDistance, boundingBox, formatDistance, extractKeywords, matchScore } from '@/lib/geo';
import { DEFAULT_MAP_CENTER, DEFAULT_SEARCH_RADIUS_KM, PROMO_MATCHING_RADIUS_KM, MAX_SEARCH_RADIUS_KM } from '@/lib/constants';
import type { ApiResponse, MerchantCategory, PromoSource } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/promos — List active promos with geo filtering + smart matching
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = parseFloat(searchParams.get('latitude') ?? String(DEFAULT_MAP_CENTER.latitude));
    const longitude = parseFloat(searchParams.get('longitude') ?? String(DEFAULT_MAP_CENTER.longitude));
    const radiusKm = Math.min(
      parseFloat(searchParams.get('radiusKm') ?? String(DEFAULT_SEARCH_RADIUS_KM)),
      MAX_SEARCH_RADIUS_KM
    );
    const category = searchParams.get('category') as MerchantCategory | null;
    const source = searchParams.get('source') as PromoSource | null;
    const search = searchParams.get('search')?.trim();
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const shoppingList = searchParams.get('shoppingList')?.trim(); // comma-separated items
    const flashOnly = searchParams.get('flash') === 'true';

    const now = new Date();

    // Build where clause
    const conditions: Record<string, unknown>[] = [
      { validFrom: { lte: now } },
      { OR: [{ validUntil: { gte: now } }, { validUntil: null }] },
    ];

    if (source) conditions.push({ source });
    if (category) conditions.push({ category });
    if (search) {
      conditions.push({
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
        ],
      });
    }
    if (flashOnly) conditions.push({ isFlashSale: true });

    // For non-scraped promos, filter by merchant proximity
    if (source !== 'scraped') {
      const bbox = boundingBox({ latitude, longitude }, radiusKm);
      conditions.push({
        merchant: {
          AND: [
            { latitude: { gte: bbox.minLat } },
            { latitude: { lte: bbox.maxLat } },
            { longitude: { gte: bbox.minLng } },
            { longitude: { lte: bbox.maxLng } },
          ],
        },
      });
    }

    const promos = await db.promo.findMany({
      where: { AND: conditions },
      take: limit,
      orderBy: flashOnly ? { flashSaleExpiresAt: 'asc' } : { createdAt: 'desc' },
      include: {
        merchant: {
          select: { id: true, name: true, latitude: true, longitude: true, category: true, subscriptionTier: true },
        },
      },
    });

    const center = { latitude, longitude };
    const shoppingKeywords = shoppingList ? extractKeywords(shoppingList.replace(/,/g, ' ')) : [];

    const results = promos
      .map((p) => {
        let distanceKm = Infinity;
        let merchantName = '';
        let merchantCategory: string | null = null;

        if (p.merchant) {
          distanceKm = haversineDistance(center, { latitude: p.merchant.latitude, longitude: p.merchant.longitude });
          merchantName = p.merchant.name;
          merchantCategory = p.merchant.category;
        }

        // Smart matching with shopping list
        let promoKeywords: string[] = [];
        try {
          promoKeywords = p.keywordsJson ? JSON.parse(p.keywordsJson) : [];
        } catch { /* ignore */ }

        const score = shoppingKeywords.length > 0
          ? matchScore(shoppingKeywords, promoKeywords)
          : 0;

        const originalPrice = p.originalPrice ?? 0;
        const promoPrice = p.promoPrice ?? 0;
        const discountPct = originalPrice > 0 ? Math.round(((originalPrice - promoPrice) / originalPrice) * 100) : 0;

        return {
          ...p,
          distanceKm,
          distanceText: distanceKm < Infinity ? formatDistance(distanceKm) : null,
          merchantName,
          merchantCategory,
          matchScore: score,
          discountPct,
        };
      })
      // For non-scraped promos, filter by actual haversine distance
      .filter((p) => p.source === 'scraped' || p.distanceKm <= radiusKm)
      // Sort: matched items first, then by discount, then by distance
      .sort((a, b) => {
        if (a.matchScore !== b.matchScore) return b.matchScore - a.matchScore;
        if (b.discountPct !== a.discountPct) return b.discountPct - a.discountPct;
        return a.distanceKm - b.distanceKm;
      });

    return NextResponse.json<ApiResponse<typeof results>>({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('[GET /api/promos]', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erreur serveur',
    }, { status: 500 });
  }
}
