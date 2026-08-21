import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// ─── GET: Professional with services, reviews, stats ────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const professional = await db.professional.findUnique({
      where: { id },
      include: {
        services: { where: { isActive: true } },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: { select: { fullName: true, avatarUrl: true } },
          },
        },
        user: { select: { fullName: true, email: true, phone: true, avatarUrl: true } },
        subscriptions: {
          where: { status: 'active' },
          orderBy: { currentPeriodEnd: 'desc' },
          take: 1,
        },
      },
    });

    if (!professional) {
      return NextResponse.json({ success: false, error: 'Professionnel introuvable' }, { status: 404 });
    }

    // Aggregate stats
    const totalJobsCompleted = await db.serviceRequest.count({
      where: { professionalId: id, status: 'completed' },
    });

    const pendingRequests = await db.serviceRequest.count({
      where: { professionalId: id, status: 'pending' },
    });

    return NextResponse.json({
      success: true,
      data: { ...professional, _stats: { totalJobsCompleted, pendingRequests } },
    });
  } catch (error) {
    console.error('[GET] professionals/[id]:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

const updateSchema = z.object({
  businessName: z.string().min(1).max(100).optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  description: z.string().max(2000).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  serviceRadiusKm: z.number().int().min(1).max(100).optional(),
  hourlyRate: z.number().min(0).optional(),
  isUrgentAvailable: z.boolean().optional(),
  portfolioImagesJson: z.string().optional(),
});

// ─── PUT: Update professional profile ───────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = updateSchema.parse(body);

    const existing = await db.professional.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Professionnel introuvable' }, { status: 404 });
    }

    const updated = await db.professional.update({
      where: { id },
      data: parsed,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    console.error('[PUT] professionals/[id]:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// ─── DELETE: Soft-delete ────────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const updated = await db.professional.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[DELETE] professionals/[id]:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
