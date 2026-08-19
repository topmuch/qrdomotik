import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateHomeSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  address: z.string().max(200).optional(),
});

// Vérifie que l'utilisateur est membre de la maison
async function checkMembership(userId: string, homeId: string) {
  const member = await db.homeMember.findUnique({
    where: { homeId_userId: { homeId, userId } },
  });
  return !!member;
}

// GET /api/homes/[id] — Détails d'une maison
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
    const isMember = await checkMembership(session.user.id, id);
    if (!isMember) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    const home = await db.home.findUnique({
      where: { id },
      include: {
        rooms: { orderBy: { sortOrder: 'asc' } },
        members: {
          include: { user: { select: { id: true, email: true, fullName: true } } },
        },
        _count: { select: { qrCodes: true } },
      },
    });

    if (!home) {
      return NextResponse.json({ success: false, error: 'Maison introuvable' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: home });
  } catch (error) {
    console.error('Home GET error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/homes/[id] — Met à jour une maison
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
    const isMember = await checkMembership(session.user.id, id);
    if (!isMember) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateHomeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const home = await db.home.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({
      success: true,
      data: { id: home.id, name: home.name, address: home.address },
    });
  } catch (error) {
    console.error('Home PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/homes/[id] — Supprime une maison
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
    const home = await db.home.findUnique({ where: { id } });
    if (!home || home.ownerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Seul le propriétaire peut supprimer' },
        { status: 403 }
      );
    }

    await db.home.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Maison supprimée' });
  } catch (error) {
    console.error('Home DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
