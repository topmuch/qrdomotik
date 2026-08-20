import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const verifySchema = z.object({
  pin: z.string().length(4).regex(/^\d{4}$/, 'PIN doit être 4 chiffres'),
});

// POST /api/r/[slug]/verify — Vérifie le PIN et renvoie le contenu débloqué
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'PIN invalide (4 chiffres requis)' },
        { status: 400 },
      );
    }

    const qr = await db.qrCode.findUnique({
      where: { publicSlug: slug },
      include: {
        home: { select: { name: true, address: true } },
        room: { select: { name: true, icon: true } },
        content: { select: { contentJson: true, updatedAt: true } },
      },
    });

    if (!qr) {
      return NextResponse.json(
        { success: false, error: 'QR code introuvable' },
        { status: 404 },
      );
    }

    if (!qr.isActive) {
      return NextResponse.json(
        { success: false, error: 'QR code désactivé' },
        { status: 403 },
      );
    }

    if (!qr.pinCode) {
      // Pas de PIN configuré — renvoyer directement le contenu
      return NextResponse.json({
        success: true,
        data: {
          id: qr.id,
          name: qr.name,
          type: qr.type,
          isActive: qr.isActive,
          homeName: qr.home.name,
          homeAddress: qr.home.address,
          roomName: qr.room?.name || null,
          contentJson: qr.content?.contentJson || '{}',
          contentUpdatedAt: qr.content?.updatedAt || null,
        },
      });
    }

    // Vérification du PIN
    if (parsed.data.pin !== qr.pinCode) {
      return NextResponse.json(
        { success: false, error: 'PIN incorrect' },
        { status: 401 },
      );
    }

    // PIN correct — logger l'accès et renvoyer le contenu
    await db.activityLog.create({
      data: {
        homeId: qr.homeId,
        qrCodeId: qr.id,
        actionType: 'pin_verified',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: qr.id,
        name: qr.name,
        type: qr.type,
        isActive: qr.isActive,
        homeName: qr.home.name,
        homeAddress: qr.home.address,
        roomName: qr.room?.name || null,
        contentJson: qr.content?.contentJson || '{}',
        contentUpdatedAt: qr.content?.updatedAt || null,
      },
    });
  } catch (error) {
    console.error('PIN verify error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 },
    );
  }
}
