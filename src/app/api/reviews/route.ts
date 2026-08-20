'use server';

import { db } from '@/lib/db';
import type { ApiResponse } from '@/types';
import { MAX_REVIEW_LENGTH, REVIEW_MIN_RATING, REVIEW_MAX_RATING, COMMISSIONS } from '@/lib/constants';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/reviews — List reviews (for professional, merchant, or service request)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const professionalId = searchParams.get('professionalId');
    const merchantId = searchParams.get('merchantId');
    const serviceRequestId = searchParams.get('serviceRequestId');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);

    const where: Record<string, unknown> = {};
    if (professionalId) where.professionalId = professionalId;
    if (merchantId) where.merchantId = merchantId;
    if (serviceRequestId) where.serviceRequestId = serviceRequestId;

    const reviews = await db.review.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true, avatarColor: true } },
        professional: { select: { id: true, businessName: true, category: true } },
        serviceRequest: { select: { id: true, description: true } },
      },
    });

    // Compute average rating
    const avgResult = await db.review.aggregate({
      where,
      _avg: { rating: true },
      _count: true,
    });

    // Rating distribution (1-5 stars count)
    const distribution = await db.review.groupBy({
      by: ['rating'],
      where,
      _count: true,
    });
    const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const d of distribution) {
      ratingDist[d.rating as number] = d._count;
    }

    return NextResponse.json<ApiResponse<{ reviews: typeof reviews; averageRating: number; totalReviews: number; distribution: typeof ratingDist }>>({
      success: true,
      data: {
        reviews,
        averageRating: avgResult._avg.rating ?? 0,
        totalReviews: avgResult._count,
        distribution: ratingDist,
      },
    });
  } catch (error) {
    console.error('[GET /api/reviews]', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/reviews — Create a review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, professionalId, merchantId, serviceRequestId, rating, comment } = body;

    if (!userId || !rating) {
      return NextResponse.json<ApiResponse<null>>({
        success: false, error: 'Champs requis: userId, rating',
      }, { status: 400 });
    }

    if (rating < REVIEW_MIN_RATING || rating > REVIEW_MAX_RATING) {
      return NextResponse.json<ApiResponse<null>>({
        success: false, error: `Note entre ${REVIEW_MIN_RATING} et ${REVIEW_MAX_RATING}`,
      }, { status: 400 });
    }

    if (comment && comment.length > MAX_REVIEW_LENGTH) {
      return NextResponse.json<ApiResponse<null>>({
        success: false, error: `Commentaire trop long (max ${MAX_REVIEW_LENGTH} chars)`,
      }, { status: 400 });
    }

    // Check not already reviewed this service request
    if (serviceRequestId) {
      const existing = await db.review.findFirst({ where: { serviceRequestId } });
      if (existing) {
        return NextResponse.json<ApiResponse<null>>({
          success: false, error: 'Avis déjà laissé pour cette intervention',
        }, { status: 409 });
      }
    }

    const review = await db.review.create({
      data: {
        userId,
        professionalId: professionalId ?? null,
        merchantId: merchantId ?? null,
        serviceRequestId: serviceRequestId ?? null,
        rating,
        comment: comment ?? '',
      },
    });

    // Update professional average rating
    if (professionalId) {
      const agg = await db.review.aggregate({
        where: { professionalId },
        _avg: { rating: true },
      });
      await db.professional.update({
        where: { id: professionalId },
        data: { rating: agg._avg.rating ?? 0 },
      });
    }

    // Update merchant average rating (if applicable)
    if (merchantId) {
      const agg = await db.review.aggregate({
        where: { merchantId },
        _avg: { rating: true },
      });
      // Store in a field if it exists
    }

    return NextResponse.json<ApiResponse<typeof review>>({
      success: true,
      data: review,
      message: 'Avis publié avec succès',
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/reviews]', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
