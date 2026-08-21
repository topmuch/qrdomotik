import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import type { QrType } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { activationCode, type, roomId, name, homeId } = body as {
      activationCode: string;
      type: QrType;
      roomId?: string;
      name: string;
      homeId: string;
    };

    const code = activationCode?.toUpperCase().trim();
    if (!code || !type || !name || !homeId) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
    }

    // Vérifier que le code existe et est inactif
    const physicalQr = await db.physicalQrCode.findUnique({ where: { activationCode: code } });
    if (!physicalQr) {
      return NextResponse.json({ error: 'Code invalide' }, { status: 404 });
    }
    if (physicalQr.status !== 'inactive') {
      return NextResponse.json({ error: 'Ce code n\'est plus disponible' }, { status: 400 });
    }

    // Vérifier l'appartenance à la maison
    const membership = await db.homeMember.findUnique({
      where: { homeId_userId: { homeId, userId: session.user.id } },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Vous n\'êtes pas membre de cette maison' }, { status: 403 });
    }

    // Générer un slug unique
    const slug = `qr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // Créer le QR code dynamique
    const dynamicQr = await db.qrCode.create({
      data: { homeId, roomId: roomId || null, name, type, publicSlug: slug, isActive: true },
    });

    // Créer un contenu par défaut selon le type
    let contentJson = '{}';
    if (type === 'wifi') contentJson = JSON.stringify({ ssid: '', password: '', security: 'WPA2', hiddenNetwork: false });
    else if (type === 'info') contentJson = JSON.stringify({ title: name, body: '' });
    else if (type === 'postit') contentJson = JSON.stringify({ message: '', color: 'yellow' });
    else if (type === 'shopping_list') contentJson = JSON.stringify({ items: [] });
    else if (type === 'doorman') contentJson = JSON.stringify({ mode: 'present', predefinedInstructions: [], showMessageField: true, showRingButton: true });
    else if (type === 'medication') contentJson = JSON.stringify({ medications: [] });
    else if (type === 'chores') contentJson = JSON.stringify({ chores: [] });
    else if (type === 'link') contentJson = JSON.stringify({ url: '', title: '', description: '' });
    else if (type === 'guestbook') contentJson = JSON.stringify({ title: '', requireName: true });
    else if (type === 'daily_menu') contentJson = JSON.stringify({ date: new Date().toISOString().split('T')[0], meals: [] });
    else if (type === 'keys_tracker') contentJson = JSON.stringify({ items: [] });
    else if (type === 'energy_counter') contentJson = JSON.stringify({ meterId: '', provider: '', currentReading: 0, unit: 'kWh' });

    await db.qrContent.create({
      data: { qrCodeId: dynamicQr.id, contentJson },
    });

    // Mettre à jour le code physique
    const updated = await db.physicalQrCode.update({
      where: { id: physicalQr.id },
      data: {
        status: 'active',
        activatedByUserId: session.user.id,
        activatedAt: new Date(),
        dynamicQrCodeId: dynamicQr.id,
      },
    });

    // Log
    await db.activationLog.create({
      data: {
        physicalQrCodeId: physicalQr.id,
        userId: session.user.id,
        action: 'activated',
        details: JSON.stringify({ type, name, homeId, roomId }),
      },
    });

    return NextResponse.json({
      success: true,
      data: { physicalQr: updated, dynamicQrCodeId: dynamicQr.id, slug },
      message: 'QR code activé avec succès',
    });
  } catch (error) {
    console.error('Activate error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
