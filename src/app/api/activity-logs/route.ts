import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/activity-logs?homeId=xxx&qrCodeId=xxx&limit=50
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const homeId = req.nextUrl.searchParams.get('homeId');
    const qrCodeId = req.nextUrl.searchParams.get('qrCodeId');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50', 10);

    if (!homeId) {
      return NextResponse.json({ success: false, error: 'homeId requis' }, { status: 400 });
    }

    const member = await db.homeMember.findUnique({
      where: { homeId_userId: { homeId, userId: session.user.id } },
    });
    if (!member) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    const where: Record<string, any> = { homeId };
    if (qrCodeId) where.qrCodeId = qrCodeId;

    const logs = await db.activityLog.findMany({
      where,
      include: {
        qrCode: { select: { name: true, type: true, publicSlug: true } },
        user: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
    });

    // Traduction des types d'actions
    const ACTION_LABELS: Record<string, string> = {
      ring: '🔔 Sonnette',
      message_left: '💬 Message laissé',
      instruction_used: '📋 Instruction utilisée',
      view: '👁️ Vue',
      wifi_connected: '📶 Wi-Fi connecté',
      pin_verified: '🔓 PIN vérifié',
      medication_taken: '💊 Médicament pris',
      chore_completed: '⭐ Corvée terminée',
      item_checked: '✅ Article coché',
      item_added: '➕ Article ajouté',
      item_removed: '🗑️ Article supprimé',
      product_scanned: '📷 Produit scanné',
      product_consumed: '✔️ Produit consommé',
    };

    const formatted = logs.map((log) => {
      let detail: any = null;
      if (log.detailsJson) {
        try { detail = JSON.parse(log.detailsJson); } catch { /* ignore */ }
      }
      return {
        id: log.id,
        actionType: log.actionType,
        actionLabel: ACTION_LABELS[log.actionType] || log.actionType,
        visitorName: log.visitorName,
        userName: log.user?.fullName || null,
        qrCode: log.qrCode,
        detail,
        createdAt: log.createdAt,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('ActivityLogs GET error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
