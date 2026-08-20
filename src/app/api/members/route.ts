// ═══════════════════════════════════════════════════════════════
// QR DOMOTIK V2 — API Membres (liste + modification + suppression)
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod/v4';
import { checkMembership, requirePermission } from '@/lib/permissions';
import type { HomeMemberRole } from '@/types';

// ─── Hiérarchie des rôles pour le tri ──────────────────────────────────
// Ordre décroissant : owner (4) > admin (3) > member (2) > child (1)
const ROLE_WEIGHT: Record<string, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  child: 1,
};

// ─── Validation schemas (Zod v4) ──────────────────────────────────────

const updateMemberSchema = z.object({
  homeId: z.string().min(1, 'homeId est requis'),
  targetUserId: z.string().min(1, 'targetUserId est requis'),
  role: z.enum(['owner', 'admin', 'member', 'child'] as const).optional(),
  nickname: z.string().max(50).optional(),
});

const removeMemberSchema = z.object({
  homeId: z.string().min(1, 'homeId est requis'),
  targetUserId: z.string().min(1, 'targetUserId est requis'),
});

// ─── GET /api/members?homeId=xxx ─────────────────────────────────────
// Liste les membres d'une maison avec infos utilisateur.
// Tri : owner en premier, puis par hiérarchie de rôle, puis par joinedAt.

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Extraire homeId depuis les query params
    const { searchParams } = new URL(req.url);
    const homeId = searchParams.get('homeId');
    if (!homeId) {
      return NextResponse.json(
        { success: false, error: 'homeId est requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est membre de la maison
    const membership = await checkMembership(session.user.id, homeId);
    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Accès refusé' },
        { status: 403 }
      );
    }

    // Récupérer tous les membres avec les infos utilisateur
    const members = await db.homeMember.findMany({
      where: { homeId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            avatarColor: true,
          },
        },
      },
    });

    // Mapper et trier les résultats
    const data = members
      .map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role as HomeMemberRole,
        nickname: m.nickname,
        points: m.points,
        joinedAt: m.joinedAt,
        createdAt: m.createdAt,
        // Infos utilisateur
        email: m.user.email,
        fullName: m.user.fullName,
        avatarUrl: m.user.avatarUrl,
        avatarColor: m.user.avatarColor,
      }))
      // Tri : owner en premier, puis hiérarchie de rôle, puis date de jointure
      .sort((a, b) => {
        // Priorité par rôle décroissant
        const roleDiff = (ROLE_WEIGHT[b.role] ?? 0) - (ROLE_WEIGHT[a.role] ?? 0);
        if (roleDiff !== 0) return roleDiff;
        // À rôle égal, tri par date de jointure (les plus anciens en premier)
        return (a.joinedAt?.getTime() ?? 0) - (b.joinedAt?.getTime() ?? 0);
      });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Members GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/members ──────────────────────────────────────────────
// Modifie le rôle ou le surnom d'un membre.
// Permission requise : canManageMembers (owner uniquement).

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Parser et valider le body
    const body = await req.json();
    const parsed = updateMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { homeId, targetUserId, role, nickname } = parsed.data;
    const currentUserId = session.user.id;

    // Vérifier la permission canManageMembers (owner uniquement)
    const membership = await requirePermission(
      currentUserId,
      homeId,
      'canManageMembers'
    );
    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Accès refusé — seul le propriétaire peut gérer les membres' },
        { status: 403 }
      );
    }

    // Vérifier que la cible est bien membre de la maison
    const targetMember = await db.homeMember.findUnique({
      where: { homeId_userId: { homeId, userId: targetUserId } },
    });
    if (!targetMember) {
      return NextResponse.json(
        { success: false, error: 'Membre non trouvé' },
        { status: 404 }
      );
    }

    // Validation : impossible de modifier son propre rôle
    if (targetUserId === currentUserId && role && role !== targetMember.role) {
      return NextResponse.json(
        { success: false, error: 'Vous ne pouvez pas modifier votre propre rôle' },
        { status: 400 }
      );
    }

    // Si un changement de rôle est demandé
    if (role && role !== targetMember.role) {
      // Compter le nombre d'owners actuels
      const ownerCount = await db.homeMember.count({
        where: { homeId, role: 'owner' },
      });

      // Si on rétrograde un owner, vérifier qu'il ne s'agit pas du dernier
      if (targetMember.role === 'owner' && ownerCount <= 1) {
        return NextResponse.json(
          { success: false, error: 'Impossible de modifier le rôle du dernier propriétaire' },
          { status: 400 }
        );
      }
    }

    // Préparer les données de mise à jour
    const updateData: Record<string, unknown> = {};
    if (role) updateData.role = role;
    if (nickname !== undefined) updateData.nickname = nickname || null;

    // Mettre à jour le membre
    const updated = await db.homeMember.update({
      where: { id: targetMember.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            avatarColor: true,
          },
        },
      },
    });

    // Journal d'activité : changement de rôle
    if (role && role !== targetMember.role) {
      await db.activityLog.create({
        data: {
          homeId,
          userId: currentUserId,
          actionType: 'member_role_changed',
          detailsJson: JSON.stringify({
            targetUserId,
            targetFullName: updated.user.fullName,
            previousRole: targetMember.role,
            newRole: role,
          }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        userId: updated.userId,
        role: updated.role as HomeMemberRole,
        nickname: updated.nickname,
        points: updated.points,
        joinedAt: updated.joinedAt,
        email: updated.user.email,
        fullName: updated.user.fullName,
        avatarUrl: updated.user.avatarUrl,
        avatarColor: updated.user.avatarColor,
      },
      message: role && role !== targetMember.role
        ? `Rôle changé en ${role}`
        : 'Membre mis à jour',
    });
  } catch (error) {
    console.error('Members PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/members ─────────────────────────────────────────────
// Retire un membre de la maison (cascade supprime les données liées).
// Permission requise : canManageMembers (owner uniquement).

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Parser et valider le body
    const body = await req.json();
    const parsed = removeMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { homeId, targetUserId } = parsed.data;
    const currentUserId = session.user.id;

    // Vérifier la permission canManageMembers (owner uniquement)
    const membership = await requirePermission(
      currentUserId,
      homeId,
      'canManageMembers'
    );
    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Accès refusé — seul le propriétaire peut gérer les membres' },
        { status: 403 }
      );
    }

    // Validation : impossible de se retirer soi-même par cette route
    if (targetUserId === currentUserId) {
      return NextResponse.json(
        { success: false, error: 'Vous ne pouvez pas vous retirer vous-même' },
        { status: 400 }
      );
    }

    // Vérifier que la cible est bien membre de la maison
    const targetMember = await db.homeMember.findUnique({
      where: { homeId_userId: { homeId, userId: targetUserId } },
      include: {
        user: { select: { fullName: true } },
      },
    });
    if (!targetMember) {
      return NextResponse.json(
        { success: false, error: 'Membre non trouvé' },
        { status: 404 }
      );
    }

    // Validation : impossible de supprimer le dernier propriétaire
    if (targetMember.role === 'owner') {
      const ownerCount = await db.homeMember.count({
        where: { homeId, role: 'owner' },
      });
      if (ownerCount <= 1) {
        return NextResponse.json(
          { success: false, error: 'Impossible de supprimer le dernier propriétaire' },
          { status: 400 }
        );
      }
    }

    // Supprimer le membre (cascade nettoie les données liées)
    await db.homeMember.delete({
      where: { id: targetMember.id },
    });

    return NextResponse.json({
      success: true,
      data: { removedUserId: targetUserId, removedMemberId: targetMember.id },
      message: `${targetMember.user.fullName} a été retiré de la maison`,
    });
  } catch (error) {
    console.error('Members DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
