import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { generatePublicSlug, generatePin } from '@/lib/slug';
import { z } from 'zod/v4';
import { requirePermission } from '@/lib/permissions';

const createQrSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(80),
  type: z.enum([
    'wifi', 'link', 'info', 'postit', 'shopping_list',
    'doorman', 'medication', 'chores', 'stock_dlc',
    'guestbook', 'energy_counter', 'keys_tracker', 'daily_menu',
  ]),
  roomId: z.string().optional(),
  pinCode: z.string().length(4).regex(/^\d{4}$/).optional(),
  isPrivate: z.boolean().optional(),
  contentJson: z.string().optional(),
});

// Vérifie membership
async function checkAccess(userId: string, homeId: string) {
  const member = await db.homeMember.findUnique({
    where: { homeId_userId: { homeId, userId } },
  });
  return member;
}

// GET /api/qr-codes?homeId=xxx&roomId=xxx
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const homeId = req.nextUrl.searchParams.get('homeId');
    const roomId = req.nextUrl.searchParams.get('roomId');

    if (!homeId) {
      return NextResponse.json({ success: false, error: 'homeId requis' }, { status: 400 });
    }

    const member = await checkAccess(session.user.id, homeId);
    if (!member) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    const where: Record<string, unknown> = { homeId };
    if (roomId) where.roomId = roomId;

    const qrCodes = await db.qrCode.findMany({
      where,
      include: {
        room: { select: { id: true, name: true, icon: true } },
        content: { select: { contentJson: true, updatedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: qrCodes });
  } catch (error) {
    console.error('QrCodes GET error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/qr-codes
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createQrSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    if (!body.homeId) {
      return NextResponse.json({ success: false, error: 'homeId requis' }, { status: 400 });
    }

    const membership = await requirePermission(session.user.id, body.homeId, 'canCreateQr');
    if (!membership) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    // Si roomId fourni, vérifier qu'il appartient à la maison
    if (parsed.data.roomId) {
      const room = await db.room.findFirst({
        where: { id: parsed.data.roomId, homeId: body.homeId },
      });
      if (!room) {
        return NextResponse.json({ success: false, error: 'Pièce introuvable dans cette maison' }, { status: 404 });
      }
    }

    // Générer un slug unique
    let slug = generatePublicSlug();
    while (await db.qrCode.findUnique({ where: { publicSlug: slug } })) {
      slug = generatePublicSlug();
    }

    // Créer le QR code + contenu initial
    const qrCode = await db.qrCode.create({
      data: {
        homeId: body.homeId,
        roomId: parsed.data.roomId || null,
        name: parsed.data.name,
        type: parsed.data.type,
        publicSlug: slug,
        isPrivate: parsed.data.isPrivate ?? (parsed.data.pinCode ? true : false),
        pinCode: parsed.data.pinCode || null,
        content: parsed.data.contentJson
          ? { create: { contentJson: parsed.data.contentJson } }
          : undefined,
      },
      include: {
        room: { select: { id: true, name: true, icon: true } },
        content: { select: { contentJson: true, updatedAt: true } },
      },
    });

    return NextResponse.json({ success: true, data: qrCode, message: 'QR code créé' }, { status: 201 });
  } catch (error) {
    console.error('QrCodes POST error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
