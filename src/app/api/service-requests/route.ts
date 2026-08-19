'use server';

import { db } from '@/lib/db';
import type { ApiResponse, ServiceRequestStatus, UrgencyLevel } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/service-requests — List requests (user or professional)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const professionalId = searchParams.get('professionalId');
    const status = searchParams.get('status') as ServiceRequestStatus | null;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);

    if (!userId && !professionalId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false, error: 'userId ou professionalId requis',
      }, { status: 400 });
    }

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (professionalId) where.professionalId = professionalId;
    if (status) where.status = status;

    const requests = await db.serviceRequest.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        service: { select: { id: true, name: true, price: true, priceUnit: true, professionalId: true } },
        professional: { select: { id: true, businessName: true, category: true, phone: true, isVerified: true, rating: true } },
        user: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });

    return NextResponse.json<ApiResponse<typeof requests>>({ success: true, data: requests });
  } catch (error) {
    console.error('[GET /api/service-requests]', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/service-requests — Create a booking request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, professionalId, serviceId, description, urgencyLevel, preferredDate, preferredTime, address, photosJson } = body;

    if (!userId || !professionalId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false, error: 'Champs requis: userId, professionalId',
      }, { status: 400 });
    }

    const serviceRequest = await db.serviceRequest.create({
      data: {
        userId,
        professionalId,
        serviceId: serviceId ?? null,
        description: description ?? '',
        urgencyLevel: (urgencyLevel ?? 'normal') as UrgencyLevel,
        status: 'pending',
        preferredDate: preferredDate ?? null,
        preferredTime: preferredTime ?? null,
        address: address ?? '',
        photosJson: photosJson ?? '[]',
        quotedPrice: null,
      },
    });

    // Create notification for professional
    await db.notification.create({
      data: {
        userId: professionalId,
        type: 'service_accepted',
        title: 'Nouvelle demande de service',
        body: `Une nouvelle demande de ${urgencyLevel === 'emergency' ? '⏰ URGENCE' : 'service'} vous a été envoyée.`,
        dataJson: JSON.stringify({ serviceRequestId: serviceRequest.id }),
      },
    });

    return NextResponse.json<ApiResponse<typeof serviceRequest>>({
      success: true,
      data: serviceRequest,
      message: 'Demande envoyée avec succès',
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/service-requests]', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/service-requests — Update status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, status, quotedPrice, professionalNotes } = body;

    if (!requestId || !status) {
      return NextResponse.json<ApiResponse<null>>({
        success: false, error: 'requestId et status requis',
      }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { status: status as ServiceRequestStatus };
    if (quotedPrice != null) updateData.quotedPrice = quotedPrice;
    if (professionalNotes) updateData.professionalNotes = professionalNotes;

    const updated = await db.serviceRequest.update({
      where: { id: requestId },
      data: updateData,
    });

    return NextResponse.json<ApiResponse<typeof updated>>({
      success: true,
      data: updated,
      message: `Demande ${status === 'accepted' ? 'acceptée' : status === 'in_progress' ? 'en cours' : status === 'completed' ? 'terminée' : 'mise à jour'}`,
    });
  } catch (error) {
    console.error('[PATCH /api/service-requests]', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
