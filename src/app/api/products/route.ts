import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const createSchema = z.object({
  homeId: z.string().min(1),
  name: z.string().min(1).max(100),
  category: z.enum(['laitier', 'viande', 'epicerie', 'boisson', 'fruit', 'conserve', 'autre']).optional(),
  minStockThreshold: z.number().int().min(0).optional(),
  currentStock: z.number().int().min(0).optional(),
});

// GET /api/products?homeId=xxx
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const homeId = req.nextUrl.searchParams.get('homeId');
    if (!homeId) {
      return NextResponse.json({ success: false, error: 'homeId requis' }, { status: 400 });
    }

    const member = await db.homeMember.findUnique({
      where: { homeId_userId: { homeId, userId: session.user.id } },
    });
    if (!member) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    const products = await db.product.findMany({
      where: { homeId },
      include: {
        _count: { select: { productInstances: true } },
        productInstances: {
          where: { status: { in: ['fresh', 'warning', 'critical'] } },
          orderBy: { expiryDate: 'asc' },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/products
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const member = await db.homeMember.findUnique({
      where: { homeId_userId: { homeId: parsed.data.homeId, userId: session.user.id } },
    });
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    const product = await db.product.create({
      data: {
        homeId: parsed.data.homeId,
        name: parsed.data.name,
        category: parsed.data.category || 'autre',
        minStockThreshold: parsed.data.minStockThreshold ?? 1,
        currentStock: parsed.data.currentStock ?? 0,
      },
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
