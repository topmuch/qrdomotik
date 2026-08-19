'use server';

import { db } from '@/lib/db';
import type { ApiResponse, SubscriptionTier } from '@/types';
import { PRICING } from '@/lib/constants';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/subscriptions — List subscriptions for a user/merchant/pro
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const professionalId = searchParams.get('professionalId');
    const userId = searchParams.get('userId');

    const where: Record<string, unknown> = {};
    if (merchantId) where.merchantId = merchantId;
    if (professionalId) where.professionalId = professionalId;
    if (userId) where.userId = userId;

    const subscriptions = await db.subscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        merchant: { select: { id: true, name: true } },
        professional: { select: { id: true, businessName: true } },
      },
    });

    return NextResponse.json<ApiResponse<typeof subscriptions>>({ success: true, data: subscriptions });
  } catch (error) {
    console.error('[GET /api/subscriptions]', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/subscriptions — Create or upgrade subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, subscriberType, plan, merchantId, professionalId } = body;

    if (!userId || !subscriberType || !plan) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Champs requis: userId, subscriberType, plan',
      }, { status: 400 });
    }

    const tier = plan as SubscriptionTier;
    const amount = subscriberType === 'merchant'
      ? (tier === 'featured' ? PRICING.merchant_featured.amount : PRICING.merchant_premium.amount)
      : (tier === 'featured' ? PRICING.professional_featured.amount : PRICING.professional_premium.amount);

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const subscription = await db.subscription.create({
      data: {
        userId,
        subscriberType,
        plan: tier,
        amount,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        merchantId: merchantId ?? null,
        professionalId: professionalId ?? null,
      },
    });

    // Create transaction
    await db.transaction.create({
      data: {
        type: 'subscription',
        amount,
        status: 'completed',
        payerId: userId,
        receiverId: null,
        description: `Abonnement ${tier} - ${subscriberType === 'merchant' ? 'Commerçant' : 'Artisan'}`,
        referenceId: subscription.id,
      },
    });

    // Update merchant/pro tier
    if (merchantId) {
      await db.merchant.update({ where: { id: merchantId }, data: { subscriptionTier: tier } });
    }
    if (professionalId) {
      await db.professional.update({ where: { id: professionalId }, data: { subscriptionTier: tier } });
    }

    return NextResponse.json<ApiResponse<typeof subscription>>({
      success: true,
      data: subscription,
      message: `Abonnement ${tier} activé ! (${amount.toFixed(2)}€/mois)`,
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/subscriptions]', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
