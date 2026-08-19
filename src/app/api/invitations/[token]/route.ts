// ═══════════════════════════════════════════════════════
// QR DOMOTIK V2 — API Invitation par token (détails + acceptation)
// ═══════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// ─── GET /api/invitations/[token] ─────────────────────────────────────
// Récupère les détails d'une invitation (public, accès par token)
// Utilisé pour la page d'acceptation avant connexion

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Récupérer l'invitation avec les infos de la maison et de l'inviteur
    const invitation = await db.invitation.findUnique({
      where: { token },
      include: {
        home: {
          select: { id: true, name: true },
        },
        inviter: {
          select: { id: true, fullName: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation introuvable' },
        { status: 404 }
      );
    }

    // Vérifier que l'invitation n'est pas expirée
    if (new Date() > invitation.expiresAt) {
      // Marquer l'invitation comme expirée en base
      await db.invitation.update({
        where: { id: invitation.id },
        data: { status: 'expired' },
      });
      return NextResponse.json(
        { success: false, error: 'Invitation expirée' },
        { status: 410 }
      );
    }

    // Vérifier que l'invitation n'est pas révoquée ou déjà acceptée
    if (invitation.status === 'revoked') {
      return NextResponse.json(
        { success: false, error: 'Invitation révoquée' },
        { status: 403 }
      );
    }

    if (invitation.status === 'accepted') {
      return NextResponse.json(
        { success: false, error: 'Invitation déjà acceptée' },
        { status: 409 }
      );
    }

    // Retourner les informations publiques de l'invitation
    return NextResponse.json({
      success: true,
      data: {
        homeId: invitation.home.id,
        homeName: invitation.home.name,
        inviterName: invitation.inviter.fullName,
        role: invitation.role,
        nickname: invitation.nickname,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error('Invitation GET by token error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ─── POST /api/invitations/[token] ────────────────────────────────────
// Accepte une invitation (auth requis, email de l'utilisateur doit correspondre)

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // Auth requise pour accepter une invitation
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { token } = await params;

    // Récupérer l'invitation avec la maison
    const invitation = await db.invitation.findUnique({
      where: { token },
      include: {
        home: {
          select: { id: true, name: true },
        },
        inviter: {
          select: { id: true, fullName: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation introuvable' },
        { status: 404 }
      );
    }

    // Vérifier le statut de l'invitation
    if (invitation.status !== 'pending') {
      const statusMessages: Record<string, string> = {
        accepted: 'Invitation déjà acceptée',
        revoked: 'Invitation révoquée',
        expired: 'Invitation expirée',
      };
      return NextResponse.json(
        { success: false, error: statusMessages[invitation.status] || 'Invitation invalide' },
        { status: 409 }
      );
    }

    // Vérifier que l'invitation n'est pas expirée
    if (new Date() > invitation.expiresAt) {
      await db.invitation.update({
        where: { id: invitation.id },
        data: { status: 'expired' },
      });
      return NextResponse.json(
        { success: false, error: 'Invitation expirée' },
        { status: 410 }
      );
    }

    // Vérifier que l'email de l'utilisateur connecté correspond à l'invitation
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, fullName: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    if (user.email.toLowerCase().trim() !== invitation.email.toLowerCase().trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "L'email de votre compte ne correspond pas à l'invitation",
        },
        { status: 403 }
      );
    }

    // Vérifier que l'utilisateur n'est pas déjà membre de cette maison
    const existingMembership = await db.homeMember.findUnique({
      where: {
        homeId_userId: {
          homeId: invitation.homeId,
          userId: session.user.id,
        },
      },
    });
    if (existingMembership) {
      return NextResponse.json(
        { success: false, error: 'Vous êtes déjà membre de cette maison' },
        { status: 409 }
      );
    }

    // Créer le membership en transaction
    const newMember = await db.homeMember.create({
      data: {
        homeId: invitation.homeId,
        userId: session.user.id,
        role: invitation.role,
        nickname: invitation.nickname,
        invitedAt: invitation.createdAt,
        joinedAt: new Date(),
      },
    });

    // Marquer l'invitation comme acceptée
    await db.invitation.update({
      where: { id: invitation.id },
      data: { status: 'accepted' },
    });

    // Journal d'activité
    await db.activityLog.create({
      data: {
        homeId: invitation.homeId,
        userId: session.user.id,
        actionType: 'member_joined',
        detailsJson: JSON.stringify({
          invitationId: invitation.id,
          role: invitation.role,
          nickname: invitation.nickname,
          invitedBy: invitation.inviter.fullName,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newMember.id,
        homeId: newMember.homeId,
        role: newMember.role,
        nickname: newMember.nickname,
        joinedAt: newMember.joinedAt,
        homeName: invitation.home.name,
      },
      message: 'Invitation acceptée avec succès',
    });
  } catch (error) {
    console.error('Invitation POST accept error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
