'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useHomeStore, type MemberInfo } from '@/store/home-store';
import { useSession } from 'next-auth/react';
import {
  Users, UserPlus, Pencil, X, Star, Shield,
  Mail, Clock, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  MEMBER_ROLE_LABELS, MEMBER_ROLE_COLORS,
  type HomeMemberRole,
} from '@/types';
import { MAX_MEMBERS_PER_HOME } from '@/lib/constants';
import { InviteDialog } from './InviteDialog';

// ─── Helpers ──────────────────────────────────────────────────────────

/** Generate a stable color from a string (hash-based fallback) */
function hashColor(str: string): string {
  const COLORS = [
    '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6',
    '#EF4444', '#6366F1', '#14B8A6', '#F97316', '#06B6D4',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

/** Relative time in French */
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffH < 24) return `il y a ${diffH}h`;
  if (diffD < 7) return `il y a ${diffD}j`;
  return `il y a ${Math.floor(diffD / 7)} sem`;
}

// ─── Invitation type ──────────────────────────────────────────────────

interface PendingInvitation {
  id: string;
  email: string;
  role: HomeMemberRole;
  nickname: string | null;
  createdAt: string;
  inviterName: string;
}

// ─── Component ────────────────────────────────────────────────────────

export function MembersPanel() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const members = useHomeStore((s) => s.members);
  const selectedHomeId = useHomeStore((s) => s.selectedHomeId);
  const hasPermission = useHomeStore((s) => s.hasPermission);
  const refreshMembers = useHomeStore((s) => s.refreshMembers);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  // Edit role dialog
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MemberInfo | null>(null);
  const [editRole, setEditRole] = useState<HomeMemberRole>('member');
  const [editRoleLoading, setEditRoleLoading] = useState(false);

  // Edit nickname dialog
  const [editNicknameOpen, setEditNicknameOpen] = useState(false);
  const [editNicknameTarget, setEditNicknameTarget] = useState<MemberInfo | null>(null);
  const [editNickname, setEditNickname] = useState('');
  const [editNicknameLoading, setEditNicknameLoading] = useState(false);

  // Remove confirmation
  const [removeTarget, setRemoveTarget] = useState<MemberInfo | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const canManage = hasPermission('canManageMembers');
  const canInvite = hasPermission('canInviteMembers');

  // ─── Fetch invitations ───────────────────────────────────────────

  const fetchInvitations = useCallback(async () => {
    if (!selectedHomeId) return;
    setLoadingInvitations(true);
    try {
      const res = await fetch(`/api/invitations?homeId=${selectedHomeId}`);
      const json = await res.json();
      if (json.success) {
        setInvitations(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch invitations:', err);
    } finally {
      setLoadingInvitations(false);
    }
  }, [selectedHomeId]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  // ─── Handlers ─────────────────────────────────────────────────────

  const handleOpenEditRole = (member: MemberInfo) => {
    setEditTarget(member);
    setEditRole(member.role);
    setEditRoleOpen(true);
  };

  const handleSaveRole = async () => {
    if (!editTarget || !selectedHomeId) return;
    setEditRoleLoading(true);
    try {
      const res = await fetch('/api/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeId: selectedHomeId,
          memberId: editTarget.id,
          role: editRole,
        }),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error || 'Erreur'); return; }
      toast.success(`Rôle mis à jour : ${MEMBER_ROLE_LABELS[editRole]}`);
      setEditRoleOpen(false);
      refreshMembers();
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setEditRoleLoading(false);
    }
  };

  const handleOpenEditNickname = (member: MemberInfo) => {
    setEditNicknameTarget(member);
    setEditNickname(member.nickname ?? '');
    setEditNicknameOpen(true);
  };

  const handleSaveNickname = async () => {
    if (!editNicknameTarget || !selectedHomeId) return;
    setEditNicknameLoading(true);
    try {
      const res = await fetch('/api/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeId: selectedHomeId,
          memberId: editNicknameTarget.id,
          nickname: editNickname.trim() || null,
        }),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error || 'Erreur'); return; }
      toast.success('Surnom mis à jour');
      setEditNicknameOpen(false);
      refreshMembers();
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setEditNicknameLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget || !selectedHomeId) return;
    setRemoveLoading(true);
    try {
      const res = await fetch('/api/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeId: selectedHomeId,
          memberId: removeTarget.id,
        }),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error || 'Erreur'); return; }
      toast.success(`${removeTarget.user.fullName} a été retiré`);
      setRemoveTarget(null);
      refreshMembers();
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setRemoveLoading(false);
    }
  };

  const handleInviteSuccess = () => {
    setInviteOpen(false);
    refreshMembers();
    fetchInvitations();
  };

  // ─── Available roles for edit (owner can assign any, except owner itself) ──

  const editableRoles: HomeMemberRole[] = ['admin', 'member', 'child'];

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-lg">
            Membres{' '}
            <span className="text-muted-foreground font-normal text-sm">
              ({members.length}/{MAX_MEMBERS_PER_HOME})
            </span>
          </h3>
        </div>
        {canInvite && (
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            Inviter
          </Button>
        )}
      </div>

      <Separator />

      {/* Members list */}
      <ScrollArea className="max-h-96 overflow-y-auto">
        <div className="space-y-2 pr-2">
          <AnimatePresence mode="popLayout">
            {members.map((member) => {
              const isOwner = member.role === 'owner';
              const isSelf = member.userId === currentUserId;
              const displayName = member.nickname || member.user.fullName;
              const avatarBg = member.user.avatarColor || hashColor(member.user.email);
              const initial = (member.user.fullName || member.user.email || '?')[0].toUpperCase();

              return (
                <motion.div
                  key={member.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  {/* Avatar */}
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{ backgroundColor: avatarBg }}
                  >
                    {initial}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">
                        {displayName}
                      </span>
                      <Badge
                        variant="secondary"
                        className={MEMBER_ROLE_COLORS[member.role]}
                      >
                        {isOwner && <Shield className="w-3 h-3 mr-1" />}
                        {MEMBER_ROLE_LABELS[member.role]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {member.user.email}
                    </p>

                    {/* Child points */}
                    {member.role === 'child' && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-medium text-amber-700">
                          {member.points} pts
                        </span>
                      </div>
                    )}

                    {/* Nickname (when different from full name) */}
                    {member.nickname && member.nickname !== member.user.fullName && (
                      <p className="text-xs text-muted-foreground italic mt-0.5">
                        «&nbsp;{member.nickname}&nbsp;»
                      </p>
                    )}
                  </div>

                  {/* Actions (only for owner managing non-owner, non-self members) */}
                  {canManage && !isOwner && !isSelf && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => handleOpenEditRole(member)}
                        title="Modifier le rôle"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setRemoveTarget(member)}
                        title="Retirer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}

                  {/* Edit nickname for children (owner can) */}
                  {canManage && member.role === 'child' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => handleOpenEditNickname(member)}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Surnom
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {members.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>Aucun membre</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Pending invitations */}
      {canInvite && (
        <>
          <Separator />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <h4 className="text-sm font-medium text-muted-foreground">
                Invitations en attente
              </h4>
              {loadingInvitations && (
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
              )}
            </div>
            <AnimatePresence>
              {invitations.map((inv) => (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  className="flex items-center justify-between rounded-lg border border-dashed p-3 mb-2 bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">
                        {inv.email}
                      </span>
                      <Badge
                        variant="secondary"
                        className={MEMBER_ROLE_COLORS[inv.role]}
                      >
                        {MEMBER_ROLE_LABELS[inv.role]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(inv.createdAt)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {!loadingInvitations && invitations.length === 0 && (
              <p className="text-xs text-muted-foreground pl-1">
                Aucune invitation en attente
              </p>
            )}
          </div>
        </>
      )}

      {/* Invite Dialog */}
      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSuccess={handleInviteSuccess}
      />

      {/* Edit Role Dialog */}
      <Dialog open={editRoleOpen} onOpenChange={setEditRoleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Changer le rôle de{' '}
              <span className="font-medium text-foreground">
                {editTarget?.nickname || editTarget?.user.fullName}
              </span>
            </p>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as HomeMemberRole)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {editableRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {MEMBER_ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveRole} disabled={editRoleLoading}>
              {editRoleLoading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Nickname Dialog */}
      <Dialog open={editNicknameOpen} onOpenChange={setEditNicknameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le surnom</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Surnom de{' '}
              <span className="font-medium text-foreground">
                {editNicknameTarget?.user.fullName}
              </span>
            </p>
            <div className="space-y-2">
              <Label htmlFor="edit-nickname">Surnom</Label>
              <Input
                id="edit-nickname"
                placeholder="Ex: Léo, Chloé..."
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
                maxLength={30}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditNicknameOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveNickname} disabled={editNicknameLoading}>
              {editNicknameLoading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <Dialog open={!!removeTarget} onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Retirer un membre</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Êtes-vous sûr de vouloir retirer{' '}
            <span className="font-medium text-foreground">
              {removeTarget?.nickname || removeTarget?.user.fullName}
            </span>{' '}
            de cette maison ? Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={removeLoading}
            >
              {removeLoading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Retirer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
