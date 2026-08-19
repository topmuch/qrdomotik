import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/r/[slug] — Renvoie les données publiques d'un QR code (sans auth)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

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

    return NextResponse.json({
      success: true,
      data: {
        id: qr.id,
        name: qr.name,
        type: qr.type,
        isActive: qr.isActive,
        hasPin: !!qr.pinCode,
        isPresentMode: qr.isPresentMode,
        homeName: qr.home.name,
        homeAddress: qr.home.address,
        roomName: qr.room?.name || null,
        // Masquer le contenu si un PIN est requis — il sera délivré via /verify
        contentJson: qr.pinCode ? null : (qr.content?.contentJson || '{}'),
        contentUpdatedAt: qr.content?.updatedAt || null,
      },
    });
  } catch (error) {
    console.error('Public QR GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 },
    );
  }
}
