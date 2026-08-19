import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const logSchema = z.object({
  actionType: z.string().min(1),
  detailsJson: z.string().optional(),
  visitorName: z.string().max(100).optional(),
});

// POST /api/r/[slug]/log — Enregistre une action (sans auth)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const parsed = logSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Données invalides' }, { status: 400 });
    }

    const qr = await db.qrCode.findUnique({ where: { publicSlug: slug } });
    if (!qr) {
      return NextResponse.json({ success: false, error: 'QR introuvable' }, { status: 404 });
    }

    if (!qr.isActive) {
      return NextResponse.json({ success: false, error: 'QR désactivé' }, { status: 403 });
    }

    await db.activityLog.create({
      data: {
        homeId: qr.homeId,
        qrCodeId: qr.id,
        actionType: parsed.data.actionType,
        detailsJson: parsed.data.detailsJson || null,
        visitorName: parsed.data.visitorName || null,
      },
    });

    return NextResponse.json({ success: true, message: 'Action enregistrée' });
  } catch (error) {
    console.error('Log error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
