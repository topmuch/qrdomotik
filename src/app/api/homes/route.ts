import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const createHomeSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(50),
  address: z.string().max(200).optional(),
});

// GET /api/homes — Liste les maisons de l'utilisateur connecté
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const memberships = await db.homeMember.findMany({
      where: { userId: session.user.id },
      include: {
        home: {
          include: {
            _count: { select: { rooms: true, qrCodes: true, members: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const homes = memberships.map((m) => ({
      id: m.home.id,
      name: m.home.name,
      address: m.home.address,
      role: m.role,
      roomsCount: m.home._count.rooms,
      qrCodesCount: m.home._count.qrCodes,
      membersCount: m.home._count.members,
      createdAt: m.home.createdAt,
    }));

    return NextResponse.json({ success: true, data: homes });
  } catch (error) {
    console.error('Homes GET error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/homes — Crée une nouvelle maison
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createHomeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const home = await db.home.create({
      data: {
        ownerId: session.user.id,
        name: parsed.data.name,
        address: parsed.data.address,
      },
    });

    // Ajouter le créateur comme owner
    await db.homeMember.create({
      data: {
        homeId: home.id,
        userId: session.user.id,
        role: 'owner',
      },
    });

    return NextResponse.json({
      success: true,
      data: { id: home.id, name: home.name, address: home.address },
      message: 'Maison créée avec succès',
    }, { status: 201 });
  } catch (error) {
    console.error('Homes POST error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
