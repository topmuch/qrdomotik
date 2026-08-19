// ═══════════════════════════════════════════════════════
// QR DOMOTIK V2 — API Invitations (liste + création)
// ═══════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod/v4';
import { requirePermission, generateInvitationToken, INVITABLE_ROLES } from '@/lib/permissions';
import { INVITATION_EXPIRY_DAYS, MAX_MEMBERS_PER_HOME } from '@/lib/constants';
import type { HomeMemberRole } from '@/types';

// ─── Validation schemas (Zod v4) ──────────────────────────────────────

const createInvitationSchema = z.object({
  homeId: z.string().min(1, 'homeId est requis'),
  email: z.string().email('Email invalide'),
  role: z.enum(['admin', 'member', 'child'] as const, {
    error: 'Rôle invalide',
  }),
  nickname: z.string().max(50).optional(),
});

// ─── GET /api/invitations?homeId=xxx ──────────────────────────────────
// Liste les invitations en attente pour une maison
// Permission requise : canInviteMembers

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

    // Vérifier la permission canInviteMembers
    const membership = await requirePermission(
      session.user.id,
      homeId,
      'canInviteMembers'
    );
    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Accès refusé' },
        { status: 403 }
      );
    }

    // Récupérer les invitations pending avec le nom de l'inviteur
    const invitations = await db.invitation.findMany({
      where: {
        homeId,
        status: 'pending',
      },
      include: {
        inviter: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      nickname: inv.nickname,
      token: inv.token,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
      inviterName: inv.inviter.fullName,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Invitations GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ─── POST /api/invitations ────────────────────────────────────────────
// Crée une nouvelle invitation
// Permission requise : canInviteMembers

export async function POST(req: NextRequest) {
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
    const parsed = createInvitationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { homeId, email, role, nickname } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Vérifier la permission canInviteMembers
    const membership = await requirePermission(
      session.user.id,
      homeId,
      'canInviteMembers'
    );
    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Accès refusé' },
        { status: 403 }
      );
    }

    // Vérifier que le rôle cible est autorisé pour l'invitant
    const allowedRoles = INVITABLE_ROLES[membership.role];
    if (!allowedRoles.includes(role as HomeMemberRole)) {
      return NextResponse.json(
        {
          success: false,
          error: `Vous ne pouvez pas inviter au rôle '${role}'`,
        },
        { status: 403 }
      );
    }

    // Vérifier que l'email n'est pas déjà membre de la maison
    const existingMember = await db.user.findFirst({
      where: {
        email: normalizedEmail,
        memberships: {
          some: { homeId },
        },
      },
      select: { id: true },
    });
    if (existingMember) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cet utilisateur est déjà membre de la maison',
        },
        { status: 409 }
      );
    }

    // Vérifier qu'aucune invitation pending n'existe pour cet email+maison
    const pendingInvitation = await db.invitation.findFirst({
      where: {
        homeId,
        email: normalizedEmail,
        status: 'pending',
      },
    });
    if (pendingInvitation) {
      return NextResponse.json(
        {
          success: false,
          error: 'Une invitation en attente existe déjà pour cet email',
        },
        { status: 409 }
      );
    }

    // Vérifier la limite de membres
    const memberCount = await db.homeMember.count({ where: { homeId } });
    const pendingCount = await db.invitation.count({
      where: { homeId, status: 'pending' },
    });
    if (memberCount + pendingCount >= MAX_MEMBERS_PER_HOME) {
      return NextResponse.json(
        {
          success: false,
          error: `Limite de ${MAX_MEMBERS_PER_HOME} membres atteinte`,
        },
        { status: 400 }
      );
    }

    // Générer le token et calculer la date d'expiration
    const token = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    // Créer l'invitation
    const invitation = await db.invitation.create({
      data: {
        homeId,
        inviterId: session.user.id,
        email: normalizedEmail,
        role,
        token,
        nickname: nickname || null,
        expiresAt,
      },
      include: {
        inviter: {
          select: { id: true, fullName: true },
        },
      },
    });

    // Journal d'activité
    await db.activityLog.create({
      data: {
        homeId,
        userId: session.user.id,
        actionType: 'member_invited',
        detailsJson: JSON.stringify({
          invitationId: invitation.id,
          email: normalizedEmail,
          role,
          nickname,
        }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          nickname: invitation.nickname,
          token: invitation.token,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt,
          inviterName: invitation.inviter.fullName,
        },
        message: 'Invitation envoyée avec succès',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Invitations POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
