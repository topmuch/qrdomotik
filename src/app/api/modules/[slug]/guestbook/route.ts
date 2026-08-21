import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const postSchema = z.object({
  guestName: z.string().max(100).optional(),
  message: z.string().min(1).max(1000),
});

// GET /api/modules/[slug]/guestbook — List guestbook entries
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const qr = await db.qrCode.findUnique({
      where: { publicSlug: slug },
      include: { home: true },
    });

    if (!qr) {
      return NextResponse.json({ success: false, error: 'QR introuvable' }, { status: 404 });
    }

    if (!qr.isActive) {
      return NextResponse.json({ success: false, error: 'QR désactivé' }, { status: 403 });
    }

    const entries = await db.guestbookEntry.findMany({
      where: { qrCodeId: qr.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, data: entries });
  } catch (error) {
    console.error('Guestbook GET error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/modules/[slug]/guestbook — Add a new guestbook entry
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Données invalides' }, { status: 400 });
    }

    const { guestName, message } = parsed.data;

    const qr = await db.qrCode.findUnique({
      where: { publicSlug: slug },
    });

    if (!qr) {
      return NextResponse.json({ success: false, error: 'QR introuvable' }, { status: 404 });
    }

    if (!qr.isActive) {
      return NextResponse.json({ success: false, error: 'QR désactivé' }, { status: 403 });
    }

    const entry = await db.guestbookEntry.create({
      data: {
        qrCodeId: qr.id,
        guestName: guestName || 'Anonyme',
        message,
      },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        homeId: qr.homeId,
        qrCodeId: qr.id,
        actionType: 'guestbook_entry_added',
        visitorName: guestName || null,
      },
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    console.error('Guestbook POST error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
