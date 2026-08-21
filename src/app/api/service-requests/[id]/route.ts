'use server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// ─── GET: Single service request with relations ───────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const request = await db.serviceRequest.findUnique({
      where: { id },
      include: {
        professional: {
          select: { id: true, businessName: true, category: true, phone: true, latitude: true, longitude: true, isVerified: true, ratingAvg: true },
        },
        service: { select: { id: true, name: true, basePrice: true, priceUnit: true } },
        home: { select: { id: true, name: true, address: true, latitude: true, longitude: true } },
        review: true,
      },
    });

    if (!request) {
      return NextResponse.json({ success: false, error: 'Demande introuvable' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: request });
  } catch (error) {
    console.error('[GET] service-requests/[id]:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// ─── Valid status transitions ────────────────────────────────────────────────
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['accepted', 'cancelled'],
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled', 'disputed'],
  completed: ['disputed'],
  cancelled: [],
  disputed: [],
};

const patchSchema = z.object({
  status: z.enum(['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed']).optional(),
  finalPrice: z.number().positive().optional(),
  commissionAmount: z.number().min(0).optional(),
});

// ─── PATCH: Update status ────────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = patchSchema.parse(body);

    const existing = await db.serviceRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Demande introuvable' }, { status: 404 });
    }

    if (parsed.status && parsed.status !== existing.status) {
      const allowed = VALID_TRANSITIONS[existing.status] || [];
      if (!allowed.includes(parsed.status)) {
        return NextResponse.json(
          { success: false, error: `Transition invalide: ${existing.status} → ${parsed.status}` },
          { status: 400 },
        );
      }
    }

    const updated = await db.serviceRequest.update({
      where: { id },
      data: {
        ...(parsed.status && { status: parsed.status }),
        ...(parsed.finalPrice !== undefined && { finalPrice: parsed.finalPrice }),
        ...(parsed.commissionAmount !== undefined && { commissionAmount: parsed.commissionAmount }),
      },
    });

    // Create notification on status change
    if (parsed.status) {
      const home = await db.home.findUnique({
        where: { id: existing.homeId },
        select: { ownerId: true },
      });

      if (home) {
        const notifType = parsed.status === 'accepted' ? 'service_accepted' : 'service_update';
        const statusLabels: Record<string, string> = {
          pending: 'En attente',
          accepted: 'Acceptée',
          in_progress: 'En cours',
          completed: 'Terminée',
          cancelled: 'Annulée',
          disputed: 'Litige',
        };

        await db.notification.create({
          data: {
            userId: home.ownerId,
            homeId: existing.homeId,
            type: notifType,
            title: `Demande ${statusLabels[parsed.status] || parsed.status}`,
            body: `Votre demande de service a été mise à jour : ${statusLabels[parsed.status] || parsed.status}`,
            dataJson: JSON.stringify({ serviceRequestId: id, newStatus: parsed.status }),
          },
        });
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    console.error('[PATCH] service-requests/[id]:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// ─── DELETE: Soft-cancel ─────────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const updated = await db.serviceRequest.update({
      where: { id },
      data: { status: 'cancelled' },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[DELETE] service-requests/[id]:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
