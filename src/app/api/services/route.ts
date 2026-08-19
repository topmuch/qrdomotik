'use server';

import { db } from '@/lib/db';
import type { ApiResponse, PriceUnit } from '@/types';
import { MAX_SERVICES_PER_PROFESSIONAL, MAX_SERVICE_DESCRIPTION_LENGTH } from '@/lib/constants';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/services — List services (optionally by professional)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const professionalId = searchParams.get('professionalId');
    const category = searchParams.get('category');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);

    const where: Record<string, unknown> = { isActive: true };
    if (professionalId) where.professionalId = professionalId;
    if (category) {
      where.professional = { category };
    }

    const services = await db.service.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        professional: {
          select: {
            id: true, businessName: true, category: true, isVerified: true,
            latitude: true, longitude: true, rating: true,
          },
        },
      },
    });

    return NextResponse.json<ApiResponse<typeof services>>({ success: true, data: services });
  } catch (error) {
    console.error('[GET /api/services]', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/services — Create a service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { professionalId, name, description, price, priceUnit, minDurationMinutes, category } = body;

    if (!professionalId || !name || price == null) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Champs requis: professionalId, name, price',
      }, { status: 400 });
    }

    // Check service count limit
    const count = await db.service.count({ where: { professionalId } });
    if (count >= MAX_SERVICES_PER_PROFESSIONAL) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: `Limite de ${MAX_SERVICES_PER_PROFESSIONAL} services atteinte`,
      }, { status: 400 });
    }

    if (description && description.length > MAX_SERVICE_DESCRIPTION_LENGTH) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: `Description trop longue (max ${MAX_SERVICE_DESCRIPTION_LENGTH} caractères)`,
      }, { status: 400 });
    }

    const service = await db.service.create({
      data: {
        professionalId,
        name,
        description: description ?? '',
        price,
        priceUnit: (priceUnit ?? 'flat_rate') as PriceUnit,
        minDurationMinutes: minDurationMinutes ?? 60,
        category: category ?? null,
        isActive: true,
      },
    });

    return NextResponse.json<ApiResponse<typeof service>>({
      success: true,
      data: service,
      message: 'Service créé',
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/services]', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
