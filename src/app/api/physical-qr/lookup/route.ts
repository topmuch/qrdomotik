import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code')?.toUpperCase().trim();
    if (!code) return NextResponse.json({ error: 'Code manquant' }, { status: 400 });

    const qr = await db.physicalQrCode.findUnique({
      where: { activationCode: code },
      include: { activatedBy: { select: { id: true, fullName: true } } },
    });

    if (!qr) return NextResponse.json({ error: 'Code invalide', status: 'not_found' }, { status: 404 });

    return NextResponse.json({
      success: true,
      data: {
        status: qr.status,
        activationCode: qr.activationCode,
        activatedByName: qr.activatedBy?.fullName || null,
        activatedAt: qr.activatedAt,
      },
    });
  } catch (error) {
    console.error('Lookup error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
