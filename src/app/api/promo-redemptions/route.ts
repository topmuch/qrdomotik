'use server';

import { db } from '@/lib/db';
import type { ApiResponse } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/promo-redemptions — List redemptions (for merchant dashboard)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const userId = searchParams.get('userId');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);

    if (!merchantId && !userId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'merchantId ou userId requis',
      }, { status: 400 });
    }

    const where: Record<string, unknown> = {};
    if (merchantId) where.merchantId = merchantId;
    if (userId) where.userId = userId;

    const redemptions = await db.promoRedemption.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        promo: { select: { id: true, title: true, promoPrice: true, originalPrice: true } },
        user: { select: { id: true, fullName: true, email: true } },
        merchant: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json<ApiResponse<typeof redemptions>>({
      success: true,
      data: redemptions,
    });
  } catch (error) {
    console.error('[GET /api/promo-redemptions]', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erreur serveur',
    }, { status: 500 });
  }
}

// POST /api/promo-redemptions — Redeem a coupon
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { promoId, userId, merchantId } = body;

    if (!promoId || !userId || !merchantId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Champs requis: promoId, userId, merchantId',
      }, { status: 400 });
    }

    // Check promo exists and is active
    const promo = await db.promo.findUnique({ where: { id: promoId } });
    if (!promo) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Promo introuvable',
      }, { status: 404 });
    }

    const now = new Date();
    if (promo.validUntil && promo.validUntil < now) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Promo expirée',
      }, { status: 400 });
    }

    // Check not already redeemed by this user
    const existing = await db.promoRedemption.findFirst({
      where: { promoId, userId },
    });
    if (existing) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Coupon déjà utilisé',
      }, { status: 409 });
    }

    // Calculate commission
    const commission = promo.promoPrice ? Math.min(0.50, Math.max(0.10, promo.promoPrice * 0.05)) : 0.20;

    const redemption = await db.promoRedemption.create({
      data: {
        promoId,
        userId,
        merchantId,
        commissionAmount: commission,
      },
    });

    // Increment promo redemption count
    await db.promo.update({
      where: { id: promoId },
      data: { redemptionsCount: { increment: 1 } },
    });

    return NextResponse.json<ApiResponse<typeof redemption>>({
      success: true,
      data: redemption,
      message: 'Coupon validé avec succès',
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/promo-redemptions]', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erreur serveur',
    }, { status: 500 });
  }
}
