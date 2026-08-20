'use server';

import { db } from '@/lib/db';
import { haversineDistance, boundingBox, formatDistance } from '@/lib/geo';
import { DEFAULT_MAP_CENTER, FLASH_SALE_PUSH_RADIUS_KM, FLASH_SALE_DEFAULT_DURATION, FLASH_SALE_DURATIONS, COMMISSIONS, PRICING } from '@/lib/constants';
import type { ApiResponse } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/flash-sales — List active flash sales
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = parseFloat(searchParams.get('latitude') ?? String(DEFAULT_MAP_CENTER.latitude));
    const longitude = parseFloat(searchParams.get('longitude') ?? String(DEFAULT_MAP_CENTER.longitude));
    const radiusKm = parseFloat(searchParams.get('radiusKm') ?? String(FLASH_SALE_PUSH_RADIUS_KM));

    const now = new Date();

    const flashSales = await db.promo.findMany({
      where: {
        isFlashSale: true,
        flashSaleExpiresAt: { gt: now },
        validFrom: { lte: now },
      },
      orderBy: { flashSaleExpiresAt: 'asc' },
      include: {
        merchant: { select: { id: true, name: true, latitude: true, longitude: true, category: true, subscriptionTier: true } },
      },
    });

    const center = { latitude, longitude };
    const bbox = boundingBox(center, radiusKm);

    const results = flashSales
      .filter((fs) => {
        if (!fs.merchant) return fs.source === 'scraped';
        const inBbox = fs.merchant.latitude >= bbox.minLat && fs.merchant.latitude <= bbox.maxLat
          && fs.merchant.longitude >= bbox.minLng && fs.merchant.longitude <= bbox.maxLng;
        if (!inBbox) return false;
        const dist = haversineDistance(center, { latitude: fs.merchant.latitude, longitude: fs.merchant.longitude });
        return dist <= radiusKm;
      })
      .map((fs) => {
        const dist = fs.merchant
          ? haversineDistance(center, { latitude: fs.merchant.latitude, longitude: fs.merchant.longitude })
          : 0;
        const expiresAt = fs.flashSaleExpiresAt ? new Date(fs.flashSaleExpiresAt) : null;
        const totalSeconds = fs.flashSaleStartedAt && expiresAt
          ? Math.max(1, (expiresAt.getTime() - new Date(fs.flashSaleStartedAt).getTime()) / 1000)
          : FLASH_SALE_DEFAULT_DURATION * 3600;
        const remainingSeconds = expiresAt
          ? Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))
          : 0;
        const originalPrice = fs.originalPrice ?? 0;
        const promoPrice = fs.promoPrice ?? 0;
        const discountPct = originalPrice > 0 ? Math.round(((originalPrice - promoPrice) / originalPrice) * 100) : 0;

        return {
          ...fs,
          distanceKm: dist,
          distanceText: fs.merchant ? formatDistance(dist) : 'En ligne',
          merchantName: fs.merchant?.name ?? '',
          merchantCategory: fs.merchant?.category ?? null,
          discountPct,
          remainingSeconds,
          totalSeconds,
          timeRemaining: formatTimeRemaining(remainingSeconds),
          progressPct: totalSeconds > 0 ? Math.min(100, ((totalSeconds - remainingSeconds) / totalSeconds) * 100) : 0,
        };
      });

    return NextResponse.json<ApiResponse<typeof results>>({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('[GET /api/flash-sales]', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erreur serveur',
    }, { status: 500 });
  }
}

// POST /api/flash-sales — Create a flash sale
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantId, title, description, originalPrice, promoPrice, imageUrl, category, durationHours, userId } = body;

    if (!merchantId || !title || !promoPrice) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Champs requis: merchantId, title, promoPrice',
      }, { status: 400 });
    }

    const duration = durationHours ?? FLASH_SALE_DEFAULT_DURATION;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + duration * 3600 * 1000);

    // Create flash sale promo
    const flashSale = await db.promo.create({
      data: {
        merchantId,
        title,
        description: description ?? '',
        originalPrice: originalPrice ?? null,
        promoPrice,
        imageUrl: imageUrl ?? null,
        category: category ?? null,
        source: 'local',
        validFrom: now,
        validUntil: expiresAt,
        isFlashSale: true,
        flashSaleStartedAt: now,
        flashSaleExpiresAt: expiresAt,
        keywordsJson: '[]',
      },
    });

    // Create transaction for flash sale trigger fee
    await db.transaction.create({
      data: {
        type: 'flash_sale',
        amount: PRICING.flash_sale_trigger.amount,
        status: 'pending',
        payerId: userId,
        receiverId: null,
        description: `Vente flash: ${title}`,
        referenceId: flashSale.id,
      },
    });

    return NextResponse.json<ApiResponse<typeof flashSale>>({
      success: true,
      data: flashSale,
      message: `Vente flash créée ! Expire dans ${duration}h`,
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/flash-sales]', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erreur serveur',
    }, { status: 500 });
  }
}

function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Terminée';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}
