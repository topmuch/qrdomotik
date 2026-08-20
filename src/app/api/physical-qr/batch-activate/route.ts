import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { codes, homeId, type, roomId } = await req.json() as {
      codes: string[];
      homeId: string;
      type: string;
      roomId?: string;
    };

    if (!codes?.length || !homeId || !type) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
    }

    const membership = await db.homeMember.findUnique({
      where: { homeId_userId: { homeId, userId: session.user.id } },
    });
    if (!membership) return NextResponse.json({ error: 'Non membre de cette maison' }, { status: 403 });

    const results: { code: string; success: boolean; error?: string }[] = [];

    for (const rawCode of codes) {
      const code = rawCode.toUpperCase().trim();
      if (!code) { results.push({ code: rawCode, success: false, error: 'Code vide' }); continue; }

      const physicalQr = await db.physicalQrCode.findUnique({ where: { activationCode: code } });
      if (!physicalQr) { results.push({ code, success: false, error: 'Code invalide' }); continue; }
      if (physicalQr.status !== 'inactive') { results.push({ code, success: false, error: 'Pas disponible' }); continue; }

      const slug = `qr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const dynamicQr = await db.qrCode.create({
        data: { homeId, roomId: roomId || null, name: `QR Physique ${code}`, type, publicSlug: slug, isActive: true },
      });
      await db.qrContent.create({ data: { qrCodeId: dynamicQr.id, contentJson: '{}' } });

      await db.physicalQrCode.update({
        where: { id: physicalQr.id },
        data: { status: 'active', activatedByUserId: session.user.id, activatedAt: new Date(), dynamicQrCodeId: dynamicQr.id },
      });
      await db.activationLog.create({
        data: { physicalQrCodeId: physicalQr.id, userId: session.user.id, action: 'activated', details: JSON.stringify({ type, batch: true }) },
      });

      results.push({ code, success: true });
    }

    const successCount = results.filter((r) => r.success).length;
    return NextResponse.json({
      success: true,
      data: results,
      message: `${successCount}/${codes.length} codes activés`,
    });
  } catch (error) {
    console.error('Batch activate error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
