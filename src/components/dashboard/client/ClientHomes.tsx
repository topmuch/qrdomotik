'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Plus, Trash2, DoorOpen, QrCode, Users, ChevronRight, Loader2, HomeIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDashboardStore } from '@/store/dashboard-store';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────

interface HomeData {
  id: string;
  name: string;
  roomsCount?: number;
  qrCodesCount?: number;
  membersCount?: number;
  _count?: { rooms: number; qrCodes: number; members: number };
}

function getCounts(home: HomeData) {
  return {
    rooms: home._count?.rooms ?? home.roomsCount ?? 0,
    qrCodes: home._count?.qrCodes ?? home.qrCodesCount ?? 0,
    members: home._count?.members ?? home.membersCount ?? 0,
  };
}

// ─── Animation ────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

// ─── Component ────────────────────────────────────────────────────────────

export function ClientHomes() {
  const { setActivePage } = useDashboardStore();
  const [homes, setHomes] = useState<HomeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HomeData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchHomes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/homes');
      const data = await res.json();
      if (data.success) setHomes(Array.isArray(data.data) ? data.data : []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomes();
  }, [fetchHomes]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/homes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Maison « ${newName.trim()} » créée`);
        setNewName('');
        setCreateOpen(false);
        fetchHomes();
      } else {
        toast.error(data.error || 'Erreur lors de la création');
      }
    } catch {
      toast.error('Erreur serveur');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/homes/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Maison supprimée');
        setDeleteTarget(null);
        fetchHomes();
      } else {
        toast.error(data.error || 'Erreur lors de la suppression');
      }
    } catch {
      toast.error('Erreur serveur');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Home className="w-5 h-5 text-emerald-600" />
            Mes Maisons
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Gérez vos maisons et leurs pièces.
          </p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          size="sm"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Nouvelle maison
        </Button>
      </motion.div>

      {/* Homes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : homes.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <HomeIcon className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">Aucune maison</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">
              Créez votre première maison pour commencer à utiliser QR Domotik.
            </p>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              size="sm"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Créer une maison
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {homes.map((home) => (
            <motion.div key={home.id} variants={itemVariants}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow group">
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <Home className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate max-w-[160px]">
                          {home.name}
                        </h3>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setDeleteTarget(home)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 rounded-lg bg-gray-50">
                      <DoorOpen className="w-3.5 h-3.5 text-gray-400 mx-auto mb-1" />
                      <p className="text-sm font-bold text-gray-900">{getCounts(home).rooms}</p>
                      <p className="text-[10px] text-gray-400">Pièces</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-gray-50">
                      <QrCode className="w-3.5 h-3.5 text-gray-400 mx-auto mb-1" />
                      <p className="text-sm font-bold text-gray-900">{getCounts(home).qrCodes}</p>
                      <p className="text-[10px] text-gray-400">QR Codes</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-gray-50">
                      <Users className="w-3.5 h-3.5 text-gray-400 mx-auto mb-1" />
                      <p className="text-sm font-bold text-gray-900">{getCounts(home).members}</p>
                      <p className="text-[10px] text-gray-400">Membres</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setActivePage('rooms')}
                  >
                    Voir les pièces
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle maison</DialogTitle>
            <DialogDescription>
              Donnez un nom à votre nouvelle maison.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="home-name">Nom de la maison</Label>
              <Input
                id="home-name"
                placeholder="Ex: Maison principale"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                maxLength={50}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!newName.trim() || creating}
              onClick={handleCreate}
            >
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {deleteTarget?.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Toutes les pièces, QR codes et données associées seront définitivement supprimés.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
