'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useHomeStore } from '@/store/home-store';
import { MEMBER_ROLE_LABELS, type HomeMemberRole } from '@/types';
import { INVITABLE_ROLES } from '@/lib/permissions';

// ─── Props ────────────────────────────────────────────────────────────

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// ─── Email validation ─────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

// ─── Component ────────────────────────────────────────────────────────

export function InviteDialog({ open, onOpenChange, onSuccess }: InviteDialogProps) {
  const selectedHomeId = useHomeStore((s) => s.selectedHomeId);
  const currentRole = useHomeStore((s) => s.getCurrentRole)();

  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [role, setRole] = useState<HomeMemberRole>('member');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Determine which roles can be assigned
  const availableRoles: HomeMemberRole[] = currentRole
    ? INVITABLE_ROLES[currentRole] || []
    : [];

  // Reset form when dialog opens
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setEmail('');
      setNickname('');
      setRole(availableRoles[0] || 'member');
      setEmailError('');
    }
    onOpenChange(nextOpen);
  };

  const validate = (): boolean => {
    if (!email.trim()) {
      setEmailError('L\'email est requis');
      return false;
    }
    if (!isValidEmail(email.trim())) {
      setEmailError('Format d\'email invalide');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !selectedHomeId) return;

    setLoading(true);
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeId: selectedHomeId,
          email: email.trim(),
          role,
          nickname: nickname.trim() || null,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Erreur lors de l'invitation");
        return;
      }
      toast.success(`Invitation envoyée à ${email.trim()}`);
      onSuccess?.();
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inviter un membre</DialogTitle>
          <DialogDescription>
            Envoyez une invitation pour rejoindre votre maison.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email de la personne</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="email@exemple.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              disabled={loading}
              aria-invalid={!!emailError}
              autoFocus
            />
            {emailError && (
              <p className="text-xs text-red-500">{emailError}</p>
            )}
          </div>

          {/* Nickname (optional) */}
          <div className="space-y-2">
            <Label htmlFor="invite-nickname">
              Surnom{' '}
              <span className="text-muted-foreground font-normal">(optionnel)</span>
            </Label>
            <Input
              id="invite-nickname"
              placeholder="Ex: Maman, Léo..."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={loading}
              maxLength={30}
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Rôle</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as HomeMemberRole)}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {MEMBER_ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {availableRoles.length === 2 && availableRoles.includes('admin')
                ? 'Vous pouvez inviter des administrateurs, membres ou enfants.'
                : 'Vous pouvez inviter des membres ou enfants.'}
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Inviter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
