import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateRoomSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

// GET /api/rooms/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const room = await db.room.findUnique({
      where: { id },
      include: {
        _count: { select: { qrCodes: true } },
        home: { select: { ownerId: true } },
      },
    });

    if (!room) {
      return NextResponse.json({ success: false, error: 'Pièce introuvable' }, { status: 404 });
    }

    // Vérifier que l'utilisateur est membre de la maison
    const member = await db.homeMember.findUnique({
      where: { homeId_userId: { homeId: room.homeId, userId: session.user.id } },
    });
    if (!member) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: room });
  } catch (error) {
    console.error('Room GET error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/rooms/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = updateRoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Vérifier l'appartenance via la room
    const room = await db.room.findUnique({ where: { id } });
    if (!room) {
      return NextResponse.json({ success: false, error: 'Pièce introuvable' }, { status: 404 });
    }

    const member = await db.homeMember.findUnique({
      where: { homeId_userId: { homeId: room.homeId, userId: session.user.id } },
    });
    if (!member) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    const updated = await db.room.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Room PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/rooms/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const room = await db.room.findUnique({
      where: { id },
      include: { home: { select: { ownerId: true } } },
    });

    if (!room) {
      return NextResponse.json({ success: false, error: 'Pièce introuvable' }, { status: 404 });
    }

    const member = await db.homeMember.findUnique({
      where: { homeId_userId: { homeId: room.homeId, userId: session.user.id } },
    });
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    await db.room.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Pièce supprimée' });
  } catch (error) {
    console.error('Room DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
