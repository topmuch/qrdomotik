import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const me = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    if (me?.role !== 'superadmin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const body = await req.json();
    const { codeId } = body as { codeId: string };
    if (!codeId) return NextResponse.json({ error: 'codeId requis' }, { status: 400 });

    const existing = await db.physicalQrCode.findUnique({ where: { id: codeId } });
    if (!existing) return NextResponse.json({ error: 'Code non trouvé' }, { status: 404 });
    if (existing.status === 'cancelled') return NextResponse.json({ error: 'Code annulé, impossible de réinitialiser' }, { status: 400 });

    const updated = await db.physicalQrCode.update({
      where: { id: codeId },
      data: {
        status: 'inactive',
        activatedByUserId: null,
        activatedAt: null,
        dynamicQrCodeId: null,
      },
    });

    await db.activationLog.create({
      data: {
        physicalQrCodeId: codeId,
        userId: session.user.id,
        action: 'reset',
        details: JSON.stringify({ previousStatus: existing.status }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Reset QR error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
