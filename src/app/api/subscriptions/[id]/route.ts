'use server';

import { db } from '@/lib/db';
import type { ApiResponse } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/subscriptions/[id] — Get subscription with professional/merchant details
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const subscription = await db.subscription.findUnique({
      where: { id },
      include: {
        professional: {
          select: {
            id: true,
            businessName: true,
            category: true,
            isVerified: true,
            isActive: true,
          },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Abonnement introuvable' },
        { status: 404 },
      );
    }

    return NextResponse.json<ApiResponse<typeof subscription>>({ success: true, data: subscription });
  } catch (error) {
    console.error('[GET /api/subscriptions/[id]]', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Erreur serveur' },
      { status: 500 },
    );
  }
}

// PATCH /api/subscriptions/[id] — Cancel subscription
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action !== 'cancel') {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Action invalide. Utilisez action="cancel"' },
        { status: 400 },
      );
    }

    const subscription = await db.subscription.findUnique({
      where: { id },
      include: {
        professional: { select: { id: true, userId: true, businessName: true } },
      },
    });

    if (!subscription) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Abonnement introuvable' },
        { status: 404 },
      );
    }

    if (subscription.status === 'cancelled') {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Cet abonnement est déjà annulé' },
        { status: 400 },
      );
    }

    const updated = await db.subscription.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    // Create notification for the subscriber
    if (subscription.professional?.userId) {
      await db.notification.create({
        data: {
          userId: subscription.professional.userId,
          type: 'system',
          title: 'Abonnement annulé',
          body: `Votre abonnement ${subscription.plan} (${subscription.subscriberType === 'merchant' ? 'Commerçant' : 'Artisan'}) a été annulé. Vous conservez l'accès jusqu'au ${new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}.`,
        },
      });
    }

    return NextResponse.json<ApiResponse<typeof updated>>({
      success: true,
      data: updated,
      message: 'Abonnement annulé avec succès',
    });
  } catch (error) {
    console.error('[PATCH /api/subscriptions/[id]]', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Erreur serveur' },
      { status: 500 },
    );
  }
}
