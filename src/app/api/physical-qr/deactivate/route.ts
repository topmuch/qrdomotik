import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { activationCode } = await req.json() as { activationCode: string };
    const code = activationCode?.toUpperCase().trim();
    if (!code) return NextResponse.json({ error: 'Code manquant' }, { status: 400 });

    const physicalQr = await db.physicalQrCode.findUnique({ where: { activationCode: code } });
    if (!physicalQr) return NextResponse.json({ error: 'Code non trouvé' }, { status: 404 });
    if (physicalQr.status !== 'active') return NextResponse.json({ error: 'Ce code n\'est pas actif' }, { status: 400 });
    if (physicalQr.activatedByUserId !== session.user.id) {
      return NextResponse.json({ error: 'Vous n\'êtes pas le propriétaire de ce code' }, { status: 403 });
    }

    // Supprimer le contenu et le QR dynamique lié
    if (physicalQr.dynamicQrCodeId) {
      await db.qrContent.deleteMany({ where: { qrCodeId: physicalQr.dynamicQrCodeId } });
      await db.qrCode.delete({ where: { id: physicalQr.dynamicQrCodeId } });
    }

    const updated = await db.physicalQrCode.update({
      where: { id: physicalQr.id },
      data: {
        status: 'inactive',
        activatedByUserId: null,
        activatedAt: null,
        dynamicQrCodeId: null,
      },
    });

    await db.activationLog.create({
      data: { physicalQrCodeId: physicalQr.id, userId: session.user.id, action: 'deactivated' },
    });

    return NextResponse.json({ success: true, data: updated, message: 'QR code désactivé' });
  } catch (error) {
    console.error('Deactivate error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
