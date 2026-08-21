import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const me = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    if (me?.role !== 'superadmin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = 20;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true, fullName: true, email: true, role: true, createdAt: true,
          _count: { select: { ownedHomes: true, qrCodes: true, activatedQrCodes: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.user.count({ where }),
    ]);

    // Map field names to what the frontend expects
    const mapped = users.map((u) => ({
      ...u,
      _count: {
        homes: u._count.ownedHomes,
        qrCodes: u._count.qrCodes,
        activatedPhysicalQr: u._count.activatedQrCodes,
      },
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
      total,
      page,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
