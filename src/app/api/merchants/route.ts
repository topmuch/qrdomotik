'use server';

import { db } from '@/lib/db';
import { haversineDistance, boundingBox, formatDistance } from '@/lib/geo';
import { DEFAULT_MAP_CENTER, DEFAULT_SEARCH_RADIUS_KM, MAX_SEARCH_RADIUS_KM } from '@/lib/constants';
import type { ApiResponse, MerchantCategory } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/merchants — List merchants with geo filtering
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
    const search = searchParams.get('search')?.trim();
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);

    // Bounding box pre-filter
    const bbox = boundingBox({ latitude, longitude }, radiusKm);

    const where: Record<string, unknown> = {
      AND: [
        { latitude: { gte: bbox.minLat } },
        { latitude: { lte: bbox.maxLat } },
        { longitude: { gte: bbox.minLng } },
        { longitude: { lte: bbox.maxLng } },
      ],
    };

    if (category) {
      (where.AND as unknown[]).push({ category });
    }
    if (search) {
      (where.AND as unknown[]).push({
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      });
    }

    const merchants = await db.merchant.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { promos: true, reviews: true } },
      },
    });

    // Apply Haversine + sort by distance
    const center = { latitude, longitude };
    const results = merchants
      .map((m) => ({
        ...m,
        distanceKm: haversineDistance(center, { latitude: m.latitude, longitude: m.longitude }),
        distanceText: formatDistance(haversineDistance(center, { latitude: m.latitude, longitude: m.longitude })),
        avgRating: 0, // Will be populated by review system
      }))
      .filter((m) => m.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return NextResponse.json<ApiResponse<typeof results>>({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('[GET /api/merchants]', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erreur serveur',
    }, { status: 500 });
  }
}

// POST /api/merchants — Register a new merchant (V3 Étape 3 prep)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, category, address, latitude, longitude, phone, email, userId } = body;

    if (!name || !category || !latitude || !longitude || !userId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Champs requis: name, category, latitude, longitude, userId',
      }, { status: 400 });
    }

    const merchant = await db.merchant.create({
      data: {
        name,
        description: description ?? '',
        category: category as MerchantCategory,
        address: address ?? '',
        latitude,
        longitude,
        phone: phone ?? '',
        email: email ?? '',
        userId,
        subscriptionTier: 'free',
      },
    });

    return NextResponse.json<ApiResponse<typeof merchant>>({
      success: true,
      data: merchant,
      message: 'Commerçant enregistré avec succès',
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/merchants]', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erreur serveur',
    }, { status: 500 });
  }
}
