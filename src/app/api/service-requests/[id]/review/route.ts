import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const reviewSchema = z.object({
  userId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// ─── POST: Submit a review ───────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: serviceRequestId } = await params;
  try {
    const body = await req.json();
    const { userId, rating, comment } = reviewSchema.parse(body);

    // Check request exists and is completed
    const serviceRequest = await db.serviceRequest.findUnique({
      where: { id: serviceRequestId },
    });

    if (!serviceRequest) {
      return NextResponse.json({ success: false, error: 'Demande introuvable' }, { status: 404 });
    }

    if (serviceRequest.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Seuls les services terminés peuvent être notés' },
        { status: 400 },
      );
    }

    // Check no existing review
    const existingReview = await db.review.findUnique({
      where: { serviceRequestId },
    });

    if (existingReview) {
      return NextResponse.json({ success: false, error: 'Un avis existe déjà pour cette demande' }, { status: 409 });
    }

    // Create review
    const review = await db.review.create({
      data: {
        serviceRequestId,
        professionalId: serviceRequest.professionalId,
        userId,
        rating,
        comment,
      },
    });

    // Recalculate professional average
    const allReviews = await db.review.findMany({
      where: { professionalId: serviceRequest.professionalId },
      select: { rating: true },
    });

    const totalReviews = allReviews.length;
    const ratingAvg = totalReviews > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    await db.professional.update({
      where: { id: serviceRequest.professionalId },
      data: { ratingAvg, totalReviews },
    });

    // Notify professional
    await db.notification.create({
      data: {
        userId: serviceRequest.professionalId,
        type: 'review_requested',
        title: 'Nouvel avis reçu',
        body: `Vous avez reçu un avis de ${rating}/5 étoiles`,
        dataJson: JSON.stringify({ serviceRequestId, reviewId: review.id, rating }),
      },
    });

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    console.error('[POST] service-requests/[id]/review:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
