// ═══════════════════════════════════════════════════════
// QR DOMOTIK V2 — Utilitaire de permissions (RLS émulé)
// ═══════════════════════════════════════════════════════

import { db } from './db';
import type { HomeMemberRole } from '@/types';
import { ROLE_PERMISSIONS } from '@/types';

// ─── Types ─────────────────────────────────────────────────────────────

export interface Membership {
  id: string;
  homeId: string;
  userId: string;
  role: HomeMemberRole;
  nickname: string | null;
  points: number;
}

export type PermissionKey = keyof typeof ROLE_PERMISSIONS[HomeMemberRole];

// ─── Core Functions ────────────────────────────────────────────────────

/**
 * Vérifie qu'un utilisateur est membre d'une maison.
 * Retourne l'objet Membership avec le rôle, ou null si non membre.
 */
export async function checkMembership(
  userId: string,
  homeId: string
): Promise<Membership | null> {
  const member = await db.homeMember.findUnique({
    where: { homeId_userId: { homeId, userId } },
    select: {
      id: true,
      homeId: true,
      userId: true,
      role: true,
      nickname: true,
      points: true,
    },
  });
  return member as Membership | null;
}

/**
 * Vérifie qu'un utilisateur est membre ET a la permission requise.
 * Retourne la Membership si OK, ou null si refusé.
 */
export async function requirePermission(
  userId: string,
  homeId: string,
  permission: PermissionKey
): Promise<Membership | null> {
  const membership = await checkMembership(userId, homeId);
  if (!membership) return null;
  if (!hasPermission(membership.role, permission)) return null;
  return membership;
}

/**
 * Vérifie si un rôle a une permission donnée (fonction pure).
 */
export function hasPermission(
  role: HomeMemberRole,
  permission: PermissionKey
): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}

/**
 * Vérifie que l'utilisateur est au minimum du rôle spécifié.
 * Hiérarchie: owner > admin > member > child
 */
export function hasMinRole(
  actualRole: HomeMemberRole,
  minRole: HomeMemberRole
): boolean {
  const hierarchy: Record<HomeMemberRole, number> = {
    owner: 4,
    admin: 3,
    member: 2,
    child: 1,
  };
  return (hierarchy[actualRole] ?? 0) >= (hierarchy[minRole] ?? 0);
}

/**
 * Construit un objet Prisma `where` pour filtrer par maison.
 * Usage: const items = await db.qrCode.findMany({ where: homeWhere(homeId) })
 */
export function homeWhere(homeId: string) {
  return { homeId };
}

// ─── Invitation Helpers ───────────────────────────────────────────────

/**
 * Génère un token d'invitation sécurisé (hex 32 chars).
 */
export function generateInvitationToken(): string {
  const array = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 16; i++) array[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Rôles qu'un invitant peut attribuer selon son propre rôle.
 */
export const INVITABLE_ROLES: Record<HomeMemberRole, HomeMemberRole[]> = {
  owner: ['admin', 'member', 'child'],
  admin: ['member', 'child'],
  member: [],
  child: [],
};
