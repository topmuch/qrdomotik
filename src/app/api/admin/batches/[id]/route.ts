import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const me = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    if (me?.role !== 'superadmin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const { id } = await params;
    const batch = await db.qrBatch.findUnique({
      where: { id },
      include: {
        qrCodes: { orderBy: { createdAt: 'asc' } },
        creator: { select: { fullName: true, email: true } },
      },
    });
    if (!batch) return NextResponse.json({ error: 'Lot non trouvé' }, { status: 404 });

    return NextResponse.json({ success: true, data: batch });
  } catch (error) {
    console.error('Batch detail error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const me = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    if (me?.role !== 'superadmin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const { id } = await params;
    await db.physicalQrCode.deleteMany({ where: { batchId: id } });
    await db.qrBatch.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Batch delete error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}