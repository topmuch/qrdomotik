'use server';

import { db } from '@/lib/db';
import { haversineDistance, boundingBox, formatDistance } from '@/lib/geo';
import { DEFAULT_MAP_CENTER, DEFAULT_SEARCH_RADIUS_KM, MAX_SEARCH_RADIUS_KM, MAX_SERVICES_PER_PROFESSIONAL, MAX_VERIFICATION_DOCS, MAX_PORTFOLIO_IMAGES, MAX_SERVICE_DESCRIPTION_LENGTH } from '@/lib/constants';
import type { ApiResponse, ProfessionalCategory } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/professionals — List artisans with geo filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = parseFloat(searchParams.get('latitude') ?? String(DEFAULT_MAP_CENTER.latitude));
    const longitude = parseFloat(searchParams.get('longitude') ?? String(DEFAULT_MAP_CENTER.longitude));
    const radiusKm = Math.min(
      parseFloat(searchParams.get('radiusKm') ?? String(DEFAULT_SEARCH_RADIUS_KM)),
      MAX_SEARCH_RADIUS_KM
    );
    const category = searchParams.get('category') as ProfessionalCategory | null;
    const search = searchParams.get('search')?.trim();
    const urgentOnly = searchParams.get('urgent') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);

    const bbox = boundingBox({ latitude, longitude }, radiusKm);

    const conditions: Record<string, unknown>[] = [
      { latitude: { gte: bbox.minLat } },
      { latitude: { lte: bbox.maxLat } },
      { longitude: { gte: bbox.minLng } },
      { longitude: { lte: bbox.maxLng } },
      { isVerified: true },
    ];

    if (category) conditions.push({ category });
    if (search) {
      conditions.push({
        OR: [
          { businessName: { contains: search } },
          { description: { contains: search } },
          { specialties: { contains: search } },
        ],
      });
    }
    if (urgentOnly) conditions.push({ availableForUrgency: true });

    const professionals = await db.professional.findMany({
      where: { AND: conditions },
      take: limit,
      orderBy: urgentOnly ? { availableForUrgency: 'desc' } : { createdAt: 'desc' },
      include: {
        _count: { select: { services: true, serviceRequests: true, reviews: true } },
        user: { select: { fullName: true, phone: true, avatarUrl: true, avatarColor: true } },
      },
    });

    const center = { latitude, longitude };
    const results = professionals
      .map((p) => ({
        ...p,
        distanceKm: haversineDistance(center, { latitude: p.latitude, longitude: p.longitude }),
        distanceText: formatDistance(haversineDistance(center, { latitude: p.latitude, longitude: p.longitude })),
      }))
      .filter((p) => p.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return NextResponse.json<ApiResponse<typeof results>>({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('[GET /api/professionals]', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/professionals — Register as artisan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId, businessName, category, description, specialties,
      address, latitude, longitude, serviceRadiusKm,
      phone, availableForUrgency,
    } = body;

    if (!userId || !businessName || !category || !latitude || !longitude) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Champs requis: userId, businessName, category, latitude, longitude',
      }, { status: 400 });
    }

    const pro = await db.professional.create({
      data: {
        userId,
        businessName,
        category: category as ProfessionalCategory,
        description: description ?? '',
        specialties: specialties ?? '',
        address: address ?? '',
        latitude,
        longitude,
        serviceRadiusKm: serviceRadiusKm ?? 10,
        phone: phone ?? '',
        availableForUrgency: availableForUrgency ?? false,
        isVerified: false,
        verificationDocsJson: '[]',
        portfolioImagesJson: '[]',
        subscriptionTier: 'free',
      },
    });

    return NextResponse.json<ApiResponse<typeof pro>>({
      success: true,
      data: pro,
      message: 'Profil artisan créé. Veuillez soumettre vos documents de vérification.',
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/professionals]', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/professionals — Update profile or verify documents
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { professionalId, businessName, description, specialties, phone, serviceRadiusKm, availableForUrgency, verificationDocsJson } = body;

    if (!professionalId) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'professionalId requis' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (businessName) updateData.businessName = businessName;
    if (description) updateData.description = description;
    if (specialties) updateData.specialties = specialties;
    if (phone) updateData.phone = phone;
    if (serviceRadiusKm) updateData.serviceRadiusKm = serviceRadiusKm;
    if (availableForUrgency !== undefined) updateData.availableForUrgency = availableForUrgency;
    if (verificationDocsJson) updateData.verificationDocsJson = verificationDocsJson;

    const pro = await db.professional.update({
      where: { id: professionalId },
      data: updateData,
    });

    return NextResponse.json<ApiResponse<typeof pro>>({
      success: true,
      data: pro,
      message: 'Profil mis à jour',
    });
  } catch (error) {
    console.error('[PATCH /api/professionals]', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
