'use server';

import { db } from '@/lib/db';
import { haversineDistance, boundingBox, formatDistance } from '@/lib/geo';
import { DEFAULT_MAP_CENTER, EMERGENCY_PROS_TO_SHOW, MAX_SEARCH_RADIUS_KM } from '@/lib/constants';
import type { ApiResponse, EmergencyCategory } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/emergency-qr — Get emergency page data (ultra-fast, no auth)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as EmergencyCategory | null;
    const latitude = parseFloat(searchParams.get('latitude') ?? String(DEFAULT_MAP_CENTER.latitude));
    const longitude = parseFloat(searchParams.get('longitude') ?? String(DEFAULT_MAP_CENTER.longitude));
    const homeId = searchParams.get('homeId');

    const center = { latitude, longitude };
    const bbox = boundingBox(center, MAX_SEARCH_RADIUS_KM);

    // Map emergency category to professional category
    const proCategories = category
      ? [category]
      : ['plumber', 'electrician', 'locksmith', 'heating'] as EmergencyCategory[];

    // Find available professionals
    const professionals = await db.professional.findMany({
      where: {
        category: { in: proCategories },
        availableForUrgency: true,
        isVerified: true,
        AND: [
          { latitude: { gte: bbox.minLat } },
          { latitude: { lte: bbox.maxLat } },
          { longitude: { gte: bbox.minLng } },
          { longitude: { lte: bbox.maxLng } },
        ],
      },
      take: EMERGENCY_PROS_TO_SHOW * 2,
      orderBy: { rating: 'desc' },
      select: {
        id: true, businessName: true, category: true, phone: true,
        latitude: true, longitude: true, rating: true, isVerified: true,
      },
    });

    const availablePros = professionals
      .map((p) => ({
        ...p,
        distanceKm: haversineDistance(center, { latitude: p.latitude, longitude: p.longitude }),
        distanceText: formatDistance(haversineDistance(center, { latitude: p.latitude, longitude: p.longitude })),
      }))
      .filter((p) => p.distanceKm <= MAX_SEARCH_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, EMERGENCY_PROS_TO_SHOW);

    // Get home info if homeId provided (for equipment_info)
    let homeInfo = null;
    if (homeId) {
      homeInfo = await db.home.findUnique({
        where: { id: homeId },
        select: { id: true, name: true, address: true, latitude: true, longitude: true },
      });

      // Get emergency QR config
      const emergencyQr = await db.emergencyQrCode.findFirst({
        where: { homeId },
        select: { equipmentInfoJson: true, emergencyContactsJson: true, emergencyCategory: true },
      });
      if (emergencyQr && homeInfo) {
        homeInfo = { ...homeInfo, ...emergencyQr };
      }
    }

    return NextResponse.json<ApiResponse<{ professionals: typeof availablePros; home: typeof homeInfo }>>({
      success: true,
      data: {
        professionals: availablePros,
        home: homeInfo,
      },
    });
  } catch (error) {
    console.error('[GET /api/emergency-qr]', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/emergency-qr — Create/update emergency QR config
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { homeId, emergencyCategory, equipmentInfoJson, emergencyContactsJson } = body;

    if (!homeId) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'homeId requis' }, { status: 400 });
    }

    const existing = await db.emergencyQrCode.findFirst({ where: { homeId } });

    if (existing) {
      const updated = await db.emergencyQrCode.update({
        where: { id: existing.id },
        data: {
          emergencyCategory: emergencyCategory ?? existing.emergencyCategory,
          equipmentInfoJson: equipmentInfoJson ?? existing.equipmentInfoJson,
          emergencyContactsJson: emergencyContactsJson ?? existing.emergencyContactsJson,
        },
      });
      return NextResponse.json<ApiResponse<typeof updated>>({ success: true, data: updated, message: 'Config urgence mise à jour' });
    }

    const created = await db.emergencyQrCode.create({
      data: {
        homeId,
        emergencyCategory: (emergencyCategory ?? 'plumber') as EmergencyCategory,
        equipmentInfoJson: equipmentInfoJson ?? '{}',
        emergencyContactsJson: emergencyContactsJson ?? '[]',
      },
    });

    return NextResponse.json<ApiResponse<typeof created>>({ success: true, data: created, message: 'QR urgence configuré' }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/emergency-qr]', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
