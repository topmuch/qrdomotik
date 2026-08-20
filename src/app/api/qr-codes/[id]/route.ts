import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  roomId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  pinCode: z.string().length(4).regex(/^\d{4}$/).nullable().optional(),
  isPresentMode: z.boolean().optional(),
  contentJson: z.string().optional(),
});

// GET /api/qr-codes/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const qrCode = await db.qrCode.findUnique({
      where: { id },
      include: {
        room: { select: { id: true, name: true, icon: true, homeId: true } },
        home: { select: { ownerId: true } },
        content: { select: { contentJson: true, updatedAt: true } },
      },
    });

    if (!qrCode) {
      return NextResponse.json({ success: false, error: 'QR code introuvable' }, { status: 404 });
    }

    const member = await db.homeMember.findUnique({
      where: { homeId_userId: { homeId: qrCode.homeId, userId: session.user.id } },
    });
    if (!member) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: qrCode });
  } catch (error) {
    console.error('QrCode GET error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/qr-codes/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const qrCode = await db.qrCode.findUnique({ where: { id } });
    if (!qrCode) {
      return NextResponse.json({ success: false, error: 'QR code introuvable' }, { status: 404 });
    }

    const member = await db.homeMember.findUnique({
      where: { homeId_userId: { homeId: qrCode.homeId, userId: session.user.id } },
    });
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    const { contentJson, ...updateData } = parsed.data;

    const updated = await db.qrCode.update({
      where: { id },
      data: updateData,
      include: {
        room: { select: { id: true, name: true, icon: true } },
        content: { select: { contentJson: true, updatedAt: true } },
      },
    });

    // Mettre à jour le contenu JSON si fourni
    if (contentJson !== undefined) {
      await db.qrContent.upsert({
        where: { qrCodeId: id },
        update: { contentJson },
        create: { qrCodeId: id, contentJson },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('QrCode PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/qr-codes/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const qrCode = await db.qrCode.findUnique({ where: { id } });
    if (!qrCode) {
      return NextResponse.json({ success: false, error: 'QR code introuvable' }, { status: 404 });
    }

    const member = await db.homeMember.findUnique({
      where: { homeId_userId: { homeId: qrCode.homeId, userId: session.user.id } },
    });
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    await db.qrCode.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'QR code supprimé' });
  } catch (error) {
    console.error('QrCode DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
