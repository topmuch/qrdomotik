import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateUniqueCodes } from '@/lib/code-generator';

// POST /api/admin/qr-batches — Générer un lot
export async function POST(req: NextRequest) {
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
    const { quantity, designConfig } = body as { quantity: number; designConfig: Record<string, string> };

    if (![10, 15, 20].includes(quantity)) {
      return NextResponse.json({ error: 'Quantité invalide (10, 15 ou 20)' }, { status: 400 });
    }

    const designConfigJson = JSON.stringify(designConfig || { color: '#2563EB', dotStyle: 'rounded' });

    // Générer les codes uniques
    const codes = await generateUniqueCodes(quantity);

    // Créer le batch
    const batch = await db.qrBatch.create({
      data: {
        quantity,
        designConfigJson,
        createdBy: session.user.id,
        qrCodes: {
          create: codes.map((code) => ({
            activationCode: code,
            designConfigJson,
          })),
        },
      },
      include: { qrCodes: true },
    });

    return NextResponse.json({ success: true, data: batch });
  } catch (error) {
    console.error('Batch creation error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET /api/admin/qr-batches — Lister les lots
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const user = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    if (user?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const batches = await db.qrBatch.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { qrCodes: true } },
        creator: { select: { fullName: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, data: batches });
  } catch (error) {
    console.error('Batches list error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
