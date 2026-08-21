import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const user = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    if (user?.role !== 'superadmin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const [
      totalBatches,
      totalPhysicalQr,
      activePhysicalQr,
      inactivePhysicalQr,
      lostPhysicalQr,
      totalUsers,
      totalHomes,
      totalQrCodes,
      recentActivations,
      typeDistribution,
    ] = await Promise.all([
      db.qrBatch.count(),
      db.physicalQrCode.count(),
      db.physicalQrCode.count({ where: { status: 'active' } }),
      db.physicalQrCode.count({ where: { status: 'inactive' } }),
      db.physicalQrCode.count({ where: { status: 'lost' } }),
      db.user.count(),
      db.home.count(),
      db.qrCode.count(),
      db.activationLog.findMany({
        where: { action: 'activated', createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        select: { createdAt: true, id: true },
        orderBy: { createdAt: 'asc' },
      }),
      db.qrCode.groupBy({ by: ['type'], _count: { type: true } }),
    ]);

    const dailyMap = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyMap.set(key, 0);
    }
    recentActivations.forEach((a) => {
      const key = a.createdAt.toISOString().split('T')[0];
      dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
    });
    const activationByDay = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }));

    return NextResponse.json({
      success: true,
      data: {
        totalBatches,
        totalPhysicalQr,
        activePhysicalQr,
        inactivePhysicalQr,
        lostPhysicalQr,
        totalUsers,
        totalHomes,
        totalQrCodes,
        activationByDay,
        typeDistribution: typeDistribution.map((t) => ({ type: t.type, count: t._count.type })),
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
