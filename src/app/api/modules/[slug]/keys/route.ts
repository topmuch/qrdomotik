import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const patchSchema = z.object({
  itemId: z.string().min(1),
  isBorrowed: z.boolean(),
  borrowedBy: z.string().max(100).optional(),
}).refine(
  (data) => !data.isBorrowed || (data.isBorrowed && data.borrowedBy),
  { message: 'borrowedBy est requis quand isBorrowed est true', path: ['borrowedBy'] },
);

// GET /api/modules/[slug]/keys — Get keys tracker content
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const qr = await db.qrCode.findUnique({
      where: { publicSlug: slug },
      include: { content: true },
    });

    if (!qr) {
      return NextResponse.json({ success: false, error: 'QR introuvable' }, { status: 404 });
    }

    if (!qr.isActive) {
      return NextResponse.json({ success: false, error: 'QR désactivé' }, { status: 403 });
    }

    const content = qr.content ? JSON.parse(qr.content.contentJson) : { items: [] };

    return NextResponse.json({ success: true, data: content });
  } catch (error) {
    console.error('Keys GET error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/modules/[slug]/keys — Toggle borrowed status on an item
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Données invalides' }, { status: 400 });
    }

    const { itemId, isBorrowed, borrowedBy } = parsed.data;

    const qr = await db.qrCode.findUnique({
      where: { publicSlug: slug },
      include: { content: true },
    });

    if (!qr) {
      return NextResponse.json({ success: false, error: 'QR introuvable' }, { status: 404 });
    }

    if (!qr.isActive) {
      return NextResponse.json({ success: false, error: 'QR désactivé' }, { status: 403 });
    }

    const content = qr.content ? JSON.parse(qr.content.contentJson) : { items: [] };
    const items = content.items || [];

    const itemIndex = items.findIndex((item: { id: string }) => item.id === itemId);
    if (itemIndex === -1) {
      return NextResponse.json({ success: false, error: 'Objet introuvable' }, { status: 404 });
    }

    const now = new Date().toISOString();
    items[itemIndex].isBorrowed = isBorrowed;
    items[itemIndex].borrowedBy = isBorrowed ? (borrowedBy || null) : null;
    items[itemIndex].lastSeenAt = now;

    content.items = items;

    if (qr.content) {
      await db.qrContent.update({
        where: { id: qr.content.id },
        data: { contentJson: JSON.stringify(content) },
      });
    } else {
      await db.qrContent.create({
        data: {
          qrCodeId: qr.id,
          contentJson: JSON.stringify(content),
        },
      });
    }

    // Log activity
    await db.activityLog.create({
      data: {
        homeId: qr.homeId,
        qrCodeId: qr.id,
        actionType: isBorrowed ? 'key_borrowed' : 'key_returned',
        detailsJson: JSON.stringify({ itemId, itemName: items[itemIndex].name, borrowedBy }),
        visitorName: borrowedBy || null,
      },
    });

    return NextResponse.json({ success: true, data: content });
  } catch (error) {
    console.error('Keys PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
