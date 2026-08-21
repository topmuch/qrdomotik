import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/admin/physical-qr-codes?search=&status=&batchId=&page=1
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const user = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    if (user?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const batchId = searchParams.get('batchId') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = 20;

    const where: Record<string, unknown> = {};
    if (search) where.activationCode = { contains: search.toUpperCase() };
    if (status) where.status = status;
    if (batchId) where.batchId = batchId;

    const [codes, total] = await Promise.all([
      db.physicalQrCode.findMany({
        where,
        include: {
          batch: { select: { id: true, quantity: true, createdAt: true } },
          activatedBy: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.physicalQrCode.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: codes,
      total,
      page,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Physical QR codes list error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/admin/physical-qr-codes — Mettre à jour le statut
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const user = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    if (user?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await req.json();
    const { codeId, status, reason } = body as { codeId: string; status: 'lost' | 'cancelled'; reason?: string };

    if (!codeId || !['lost', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }

    const existing = await db.physicalQrCode.findUnique({ where: { id: codeId } });
    if (!existing) {
      return NextResponse.json({ error: 'Code non trouvé' }, { status: 404 });
    }

    if (existing.status === 'cancelled') {
      return NextResponse.json({ error: 'Code déjà annulé' }, { status: 400 });
    }

    const updated = await db.physicalQrCode.update({
      where: { id: codeId },
      data: { status },
    });

    // Log l'action
    await db.activationLog.create({
      data: {
        physicalQrCodeId: codeId,
        userId: session.user.id,
        action: status === 'lost' ? 'marked_lost' : 'cancelled',
        details: JSON.stringify({ reason: reason || '', previousStatus: existing.status }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Physical QR code update error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
