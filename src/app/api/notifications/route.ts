// ═══════════════════════════════════════════════════════════════
// QR DOMOTIK V2 — API Notifications (liste + marquer comme lu)
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod/v4';

// ─── Constantes ───────────────────────────────────────────────────────

const MAX_NOTIFICATIONS = 50;

// ─── Validation schemas (Zod v4) ──────────────────────────────────────

const markReadSchema = z.union([
  // Cas 1 : marquer une seule notification
  z.object({
    id: z.string().min(1, 'id est requis'),
  }),
  // Cas 2 : marquer plusieurs notifications par ids
  z.object({
    ids: z.array(z.string().min(1)).min(1, 'ids ne peut pas être vide'),
  }),
  // Cas 3 : marquer toutes les notifications non lues
  z.object({
    all: z.literal(true),
  }),
]);

// ─── GET /api/notifications ──────────────────────────────────────────
// Liste les notifications de l'utilisateur connecté.
// Query param optionnel : unreadOnly=true pour filtrer les non lues.
// Inclut le nom de la maison. Triée par createdAt desc, limitée à 50.

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Filtrer les non lues si demandé
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const notifications = await db.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      include: {
        home: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_NOTIFICATIONS,
    });

    // Mapper les résultats avec le nom de la maison
    const data = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      dataJson: n.dataJson,
      isRead: n.isRead,
      homeId: n.homeId,
      homeName: n.home.name,
      createdAt: n.createdAt,
    }));

    // Compter le total des non lues (pour le badge)
    const unreadCount = await db.notification.count({
      where: { userId, isRead: false },
    });

    return NextResponse.json({ success: true, data, unreadCount });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/notifications ─────────────────────────────────────────
// Marque une ou plusieurs notifications comme lues.
// Body accepté :
//   { id }         — notification unique
//   { ids: [...] } — lot de notifications
//   { all: true }  — toutes les non lues

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parser et valider le body
    const body = await req.json();
    const parsed = markReadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    let count = 0;

    // Cas 1 : notification unique par id
    if ('id' in parsed.data) {
      const result = await db.notification.updateMany({
        where: { id: parsed.data.id, userId },
        data: { isRead: true },
      });
      count = result.count;
    }

    // Cas 2 : lot d'ids
    if ('ids' in parsed.data) {
      const result = await db.notification.updateMany({
        where: {
          id: { in: parsed.data.ids },
          userId,
        },
        data: { isRead: true },
      });
      count = result.count;
    }

    // Cas 3 : toutes les non lues
    if ('all' in parsed.data) {
      const result = await db.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      count = result.count;
    }

    return NextResponse.json({
      success: true,
      data: { markedCount: count },
      message: `${count} notification${count > 1 ? 's' : ''} marquée${count > 1 ? 's' : ''} comme lue${count > 1 ? 's' : ''}`,
    });
  } catch (error) {
    console.error('Notifications PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
