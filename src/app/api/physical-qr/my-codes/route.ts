import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const codes = await db.physicalQrCode.findMany({
      where: { activatedByUserId: session.user.id, status: 'active' },
      include: {
        dynamicQrCode: { select: { id: true, name: true, type: true, publicSlug: true, room: { select: { name: true } } } },
        batch: { select: { id: true, createdAt: true } },
      },
      orderBy: { activatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: codes });
  } catch (error) {
    console.error('My codes error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
