'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  DoorOpen, Plus, Trash2, QrCode, Loader2, Home as HomeIcon, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────

interface HomeData { id: string; name: string; }
interface RoomData {
  id: string;
  name: string;
  icon: string;
  homeId: string;
  _count: { qrCodes: number };
}

// ─── Animation ────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

// ─── Component ────────────────────────────────────────────────────────────

export function ClientRooms() {
  const [homes, setHomes] = useState<HomeData[]>([]);
  const [selectedHome, setSelectedHome] = useState('');
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loadingHomes, setLoadingHomes] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RoomData | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch homes
  const fetchHomes = useCallback(async () => {
    setLoadingHomes(true);
    try {
      const res = await fetch('/api/homes');
      const data = await res.json();
      if (data.success) {
        const homesData: HomeData[] = Array.isArray(data.data) ? data.data : [];
        setHomes(homesData);
        // Auto-select if only one home
        if (homesData.length === 1 && !selectedHome) {
          setSelectedHome(homesData[0].id);
        }
      }
    } catch {
      /* silent */
    } finally {
      setLoadingHomes(false);
    }
  }, [selectedHome]);

  // Fetch rooms when home changes
  const fetchRooms = useCallback(async (homeId: string) => {
    if (!homeId) { setRooms([]); return; }
    setLoadingRooms(true);
    try {
      const res = await fetch(`/api/rooms?homeId=${homeId}`);
      const data = await res.json();
      if (data.success) {
        setRooms(Array.isArray(data.data) ? data.data : []);
      }
    } catch {
      /* silent */
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    fetchHomes();
  }, [fetchHomes]);

  useEffect(() => {
    if (selectedHome) fetchRooms(selectedHome);
    else setRooms([]);
  }, [selectedHome, fetchRooms]);

  const handleCreate = async () => {
    if (!newName.trim() || !selectedHome) return;
    setCreating(true);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), homeId: selectedHome }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Pièce « ${newName.trim()} » créée`);
        setNewName('');
        setCreateOpen(false);
        fetchRooms(selectedHome);
        // Refresh homes to update room count
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
      const res = await fetch(`/api/rooms/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Pièce supprimée');
        setDeleteTarget(null);
        fetchRooms(selectedHome);
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

  const selectedHomeName = homes.find((h) => h.id === selectedHome)?.name;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-purple-600" />
            Pièces
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Organisez vos pièces par maison.
          </p>
        </div>
        <Button
          className="bg-purple-600 hover:bg-purple-700"
          size="sm"
          disabled={!selectedHome}
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Nouvelle pièce
        </Button>
      </motion.div>

      {/* Home Selector */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <HomeIcon className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1">
                {loadingHomes ? (
                  <Skeleton className="h-5 w-40" />
                ) : homes.length === 0 ? (
                  <div>
                    <p className="text-sm text-gray-500">Aucune maison</p>
                    <p className="text-xs text-gray-400">Créez d'abord une maison.</p>
                  </div>
                ) : (
                  <Select value={selectedHome} onValueChange={setSelectedHome}>
                    <SelectTrigger className="border-0 p-0 h-auto shadow-none focus:ring-0">
                      <div className="flex items-center gap-2">
                        <SelectValue placeholder="Sélectionnez une maison" />
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {homes.map((h) => (
                        <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Rooms List */}
      {selectedHome && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {loadingRooms ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <DoorOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">Aucune pièce</p>
                <p className="text-xs text-gray-400 mt-1 mb-4">
                  Ajoutez des pièces à « {selectedHomeName} ».
                </p>
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  size="sm"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Créer une pièce
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide px-1">
                {rooms.length} pièce{rooms.length > 1 ? 's' : ''} dans « {selectedHomeName} »
              </p>
              <motion.div
                className="space-y-2"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {rooms.map((room) => (
                  <motion.div key={room.id} variants={itemVariants}>
                    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow group">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                              <DoorOpen className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-gray-900 truncate">
                                {room.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className="text-[10px] text-gray-500">
                                  <QrCode className="w-2.5 h-2.5 mr-1" />
                                  {room._count.qrCodes} QR
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setDeleteTarget(room)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}
        </motion.div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle pièce</DialogTitle>
            <DialogDescription>
              Ajoutez une pièce à « {selectedHomeName} ».
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="room-name">Nom de la pièce</Label>
              <Input
                id="room-name"
                placeholder="Ex: Cuisine, Chambre, Salon..."
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
              className="bg-purple-600 hover:bg-purple-700"
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
              Les QR codes de cette pièce seront également supprimés.
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
