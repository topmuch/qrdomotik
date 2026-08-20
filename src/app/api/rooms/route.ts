import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const createRoomSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(50),
  icon: z.string().default('square'),
});

// GET /api/rooms?homeId=xxx — Liste les pièces d'une maison
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

    // Vérifier l'appartenance
    const member = await db.homeMember.findUnique({
      where: { homeId_userId: { homeId, userId: session.user.id } },
    });
    if (!member) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    const rooms = await db.room.findMany({
      where: { homeId },
      include: { _count: { select: { qrCodes: true } } },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ success: true, data: rooms });
  } catch (error) {
    console.error('Rooms GET error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/rooms — Crée une pièce dans une maison
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createRoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    if (!body.homeId) {
      return NextResponse.json({ success: false, error: 'homeId requis' }, { status: 400 });
    }

    // Vérifier l'appartenance
    const member = await db.homeMember.findUnique({
      where: { homeId_userId: { homeId: body.homeId, userId: session.user.id } },
    });
    if (!member) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    // Calculer le sortOrder suivant
    const maxOrder = await db.room.findFirst({
      where: { homeId: body.homeId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const room = await db.room.create({
      data: {
        homeId: body.homeId,
        name: parsed.data.name,
        icon: body.icon || parsed.data.icon,
        sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json({ success: true, data: room, message: 'Pièce créée' }, { status: 201 });
  } catch (error) {
    console.error('Rooms POST error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
