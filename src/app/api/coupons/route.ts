import { db } from '@/lib/db';
import type { ApiResponse } from '@/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { COMMISSIONS } from '@/lib/constants';

const generateCouponSchema = z.object({
  promoId: z.string().min(1),
  userId: z.string().min(1),
});

// POST /api/coupons — Generate a coupon QR code for a promo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = generateCouponSchema.parse(body);

    // Verify promo exists and is still valid
    const promo = await db.promo.findUnique({
      where: { id: parsed.promoId },
      include: { merchant: { select: { id: true, name: true } } },
    });

    if (!promo) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Promo non trouvée' },
        { status: 404 }
      );
    }

    const now = new Date();
    if (promo.validUntil && promo.validUntil < now) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Promo expirée' },
        { status: 400 }
      );
    }

    // Check for existing active coupon
    const existing = await db.promoRedemption.findFirst({
      where: {
        promoId: parsed.promoId,
        userId: parsed.userId,
        status: 'generated',
      },
    });

    if (existing) {
      return NextResponse.json<ApiResponse<{ redemptionId: string }>>({
        success: true,
        data: { redemptionId: existing.id },
        message: 'Coupon déjà généré',
      });
    }

    // Create redemption record
    const redemption = await db.promoRedemption.create({
      data: {
        promoId: parsed.promoId,
        userId: parsed.userId,
        status: 'generated',
        commissionAmount: COMMISSIONS.redemption.default,
      },
    });

    // Increment promo redemption count
    await db.promo.update({
      where: { id: parsed.promoId },
      data: { redemptionsCount: { increment: 1 } },
    });

    return NextResponse.json<ApiResponse<{ redemptionId: string }>>(
      {
        success: true,
        data: { redemptionId: redemption.id },
        message: 'Coupon généré avec succès',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Données invalides', message: error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }
    console.error('[POST /api/coupons]', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

const redeemCouponSchema = z.object({
  couponId: z.string().min(1),
  status: z.literal('redeemed'),
});

// PATCH /api/coupons — Redeem a coupon (merchant validates)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = redeemCouponSchema.parse(body);

    // Find the coupon
    const coupon = await db.promoRedemption.findUnique({
      where: { id: parsed.couponId },
      include: {
        promo: {
          include: { merchant: { select: { id: true, name: true } } },
        },
        user: { select: { id: true, fullName: true } },
      },
    });

    if (!coupon) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Coupon non trouvé' },
        { status: 404 }
      );
    }

    if (coupon.status !== 'generated') {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: `Coupon déjà ${coupon.status === 'redeemed' ? 'utilisé' : coupon.status}` },
        { status: 400 }
      );
    }

    // Update coupon status
    await db.promoRedemption.update({
      where: { id: parsed.couponId },
      data: { status: 'redeemed' },
    });

    // Increment promo redemptions count
    await db.promo.update({
      where: { id: coupon.promoId },
      data: { redemptionsCount: { increment: 1 } },
    });

    // Create commission transaction if applicable
    if (coupon.commissionAmount > 0) {
      await db.transaction.create({
        data: {
          type: 'commission',
          amount: coupon.commissionAmount,
          status: 'pending',
          payerId: coupon.promo.merchantId,
          description: `Commission coupon: ${coupon.promo.title}`,
          referenceId: coupon.id,
        },
      });
    }

    return NextResponse.json<ApiResponse<{
      promoTitle: string;
      userName: string;
      commissionAmount: number;
    }>>({
      success: true,
      data: {
        promoTitle: coupon.promo.title,
        userName: coupon.user.fullName,
        commissionAmount: coupon.commissionAmount,
      },
      message: 'Coupon validé avec succès',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Données invalides', message: error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }
    console.error('[PATCH /api/coupons]', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// GET /api/coupons?userId=xxx — List user's coupons with promo details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'userId requis' },
        { status: 400 }
      );
    }

    const redemptions = await db.promoRedemption.findMany({
      where: { userId },
      include: {
        promo: {
          include: {
            merchant: {
              select: { id: true, name: true, category: true, logoUrl: true },
            },
          },
        },
      },
      orderBy: { redeemedAt: 'desc' },
    });

    return NextResponse.json<ApiResponse<typeof redemptions>>({
      success: true,
      data: redemptions,
    });
  } catch (error) {
    console.error('[GET /api/coupons]', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
