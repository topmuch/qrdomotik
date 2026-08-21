import { db } from '@/lib/db';
import type { ApiResponse } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

interface MerchantStats {
  totalPromos: number;
  activePromos: number;
  totalViews: number;
  totalRedemptions: number;
  ratingAvg: number;
  totalReviews: number;
}

// GET /api/merchants/[id]/stats — Merchant statistics
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify merchant exists
    const merchant = await db.merchant.findUnique({
      where: { id },
      select: { id: true, isActive: true, ratingAvg: true, totalReviews: true },
    });

    if (!merchant || !merchant.isActive) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Commerçant non trouvé' },
        { status: 404 }
      );
    }

    const now = new Date();

    // Aggregate promos stats
    const promoStats = await db.promo.aggregate({
      where: { merchantId: id },
      _sum: {
        viewsCount: true,
        redemptionsCount: true,
      },
      _count: true,
    });

    // Count active promos (validUntil >= now)
    const activePromosCount = await db.promo.count({
      where: {
        merchantId: id,
        validUntil: { gte: now },
      },
    });

    const stats: MerchantStats = {
      totalPromos: promoStats._count ?? 0,
      activePromos: activePromosCount,
      totalViews: promoStats._sum.viewsCount ?? 0,
      totalRedemptions: promoStats._sum.redemptionsCount ?? 0,
      ratingAvg: merchant.ratingAvg,
      totalReviews: merchant.totalReviews,
    };

    return NextResponse.json<ApiResponse<MerchantStats>>({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[GET /api/merchants/[id]/stats]', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
