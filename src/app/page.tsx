'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useHomeStore } from '@/store/home-store';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  QrCode, Home, Plus, LogIn, LogOut, UserPlus, ChevronRight,
  Bed, Bath, Sofa, CookingPot, DoorOpen, Car, Lamp, Monitor,
  Flower2, WashingMachine, Refrigerator, Tv, Warehouse,
  Trash2, Pencil, Menu, X, LayoutDashboard, Square,
} from 'lucide-react';
import { ROOM_ICONS } from '@/lib/constants';
import type { QrType } from '@/types';

// ─── Icônes dynamiques ────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Square, Bed, Bath, Sofa, CookingPot, DoorOpen, Car, Lamp, Monitor,
  Flower2, WashingMachine, Refrigerator, Tv, Warehouse,
};

const QR_TYPE_ICONS_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: () => null, link: () => null, info: () => null, postit: () => null,
  shopping_list: () => null, doorman: () => null, medication: () => null,
  chores: () => null, stock_dlc: () => null,
};

// ─── Animations ────────────────────────────────────────────────────────
const fadeIn = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };

// ─── Auth Forms ────────────────────────────────────────────────────────
function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!isLogin) {
        // Register
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, fullName }),
        });
        const data = await res.json();
        if (!data.success) {
          toast.error(data.error);
          return;
        }
        toast.success('Compte créé ! Connexion en cours...');
      }
      // Login
      const result = await signIn('credentials', {
        email, password, redirect: false,
      });
      if (result?.error) {
        toast.error('Email ou mot de passe incorrect');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 opacity-20 blur-xl" />
            <Image src="/qr-domotik-logo.png" alt="QR Domotik" width={80} height={80} className="relative rounded-2xl drop-shadow-lg" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            QR <span className="text-emerald-600">Domotik</span>
          </h1>
          <p className="text-muted-foreground mt-1">Votre maison, intelligemment connectée</p>
        </div>

        {/* Form Card */}
        <Card className="border-slate-200 shadow-lg shadow-slate-200/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              {isLogin ? 'Connexion' : 'Créer un compte'}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? 'Connectez-vous pour accéder à vos maisons'
                : 'Créez votre compte et votre première maison'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nom complet</Label>
                      <Input
                        id="fullName"
                        placeholder="Jean Dupont"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required={!isLogin}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {isLogin ? 'Connexion...' : 'Création...'}
                  </span>
                ) : isLogin ? 'Se connecter' : "S'inscrire"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?'}{' '}
                <span className="font-medium text-emerald-600 hover:underline">
                  {isLogin ? "S'inscrire" : 'Se connecter'}
                </span>
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Étape 2 — Authentification & Dashboard
        </p>
      </motion.div>
    </div>
  );
}

// ─── Room Icon Selector ───────────────────────────────────────────────
function RoomIconSelector({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  const icons = ROOM_ICONS.filter(Boolean);
  return (
    <div className="grid grid-cols-7 gap-2">
      {icons.map((name) => {
        const IconComp = ICON_MAP[name] || Square;
        const isActive = value === name;
        return (
          <button
            key={name}
            type="button"
            onClick={() => onChange(name)}
            className={`p-2 rounded-lg border transition-all flex items-center justify-center ${
              isActive
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200'
                : 'border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700'
            }`}
            title={name}
          >
            <IconComp className="w-5 h-5" />
          </button>
        );
      })}
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────
function Dashboard() {
  const { data: session } = useSession();
  const store = useHomeStore();
  const [homeName, setHomeName] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomIcon, setRoomIcon] = useState('Square');
  const [homeDialogOpen, setHomeDialogOpen] = useState(false);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [deleteHomeId, setDeleteHomeId] = useState<string | null>(null);
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);
  const [editingRoom, setEditingRoom] = useState<{ id: string; name: string; icon: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    store.refreshHomes();
  }, []);

  // ─── Handlers ───
  const handleCreateHome = async () => {
    if (!homeName.trim()) return;
    const res = await fetch('/api/homes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: homeName, address: homeAddress || undefined }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(`Maison « ${data.data.name} » créée`);
      setHomeName('');
      setHomeAddress('');
      setHomeDialogOpen(false);
      store.refreshHomes();
    } else {
      toast.error(data.error);
    }
  };

  const handleDeleteHome = async () => {
    if (!deleteHomeId) return;
    const res = await fetch(`/api/homes/${deleteHomeId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      toast.success('Maison supprimée');
      store.refreshHomes();
    } else {
      toast.error(data.error);
    }
    setDeleteHomeId(null);
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim() || !store.selectedHomeId) return;
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ homeId: store.selectedHomeId, name: roomName, icon: roomIcon }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(`Pièce « ${data.data.name} » créée`);
      setRoomName('');
      setRoomIcon('Square');
      setRoomDialogOpen(false);
      store.refreshRooms();
      store.refreshHomes();
    } else {
      toast.error(data.error);
    }
  };

  const handleUpdateRoom = async () => {
    if (!editingRoom || !editingRoom.name.trim()) return;
    const res = await fetch(`/api/rooms/${editingRoom.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingRoom.name, icon: editingRoom.icon }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success('Pièce mise à jour');
      setEditingRoom(null);
      store.refreshRooms();
      store.refreshHomes();
    } else {
      toast.error(data.error);
    }
  };

  const handleDeleteRoom = async () => {
    if (!deleteRoomId) return;
    const res = await fetch(`/api/rooms/${deleteRoomId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      toast.success('Pièce supprimée');
      store.refreshRooms();
      store.refreshHomes();
    } else {
      toast.error(data.error);
    }
    setDeleteRoomId(null);
  };

  const selectedHome = store.getSelectedHome();
  const memberRole = selectedHome?.role;
  const canManage = memberRole === 'owner' || memberRole === 'admin';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* ─── Top Nav ─── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost" size="icon" className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <Image src="/qr-domotik-logo.png" alt="QR Domotik" width={28} height={28} className="rounded-md" />
              <span className="font-bold text-lg hidden sm:inline">
                QR <span className="text-emerald-600">Domotik</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:flex items-center gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" />
              Étape 2
            </Badge>
            <div className="flex items-center gap-2 text-sm">
              <span className="hidden md:inline text-muted-foreground">{session?.user?.name}</span>
              <Button variant="ghost" size="icon" onClick={() => signOut()} title="Déconnexion">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* ─── Sidebar — Homes ─── */}
        <aside className={`
          fixed inset-y-0 left-0 top-14 z-30 w-72 bg-white border-r border-slate-200
          transform transition-transform duration-200 ease-in-out
          md:static md:transform-none
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Mes Maisons</h2>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setHomeDialogOpen(true)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {store.homes.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8 px-4">
                    Aucune maison. Cliquez sur + pour commencer.
                  </p>
                )}
                {store.homes.map((home) => (
                  <button
                    key={home.id}
                    onClick={() => { store.selectHome(home.id); setMobileMenuOpen(false); }}
                    className={`
                      w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all group
                      ${store.selectedHomeId === home.id
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                      }
                    `}
                  >
                    <Home className={`w-4 h-4 flex-shrink-0 ${store.selectedHomeId === home.id ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{home.name}</p>
                      <p className="text-xs text-muted-foreground">{home.roomsCount} pièce{home.roomsCount > 1 ? 's' : ''}</p>
                    </div>
                    {home.role === 'owner' && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">owner</Badge>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </aside>

        {/* ─── Overlay mobile ─── */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 top-14 z-20 bg-black/20 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* ─── Main Content ─── */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {!selectedHome ? (
            // ─── No home selected ───
            <div className="flex items-center justify-center h-full min-h-[60vh]">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center max-w-sm"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <Home className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Bienvenue !</h2>
                <p className="text-muted-foreground mb-6">
                  {store.homes.length === 0
                    ? 'Créez votre première maison pour commencer.'
                    : 'Sélectionnez une maison dans le menu de gauche.'}
                </p>
                {store.homes.length === 0 && (
                  <Button onClick={() => setHomeDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Créer ma première maison
                  </Button>
                )}
              </motion.div>
            </div>
          ) : (
            // ─── Home selected — Rooms ───
            <motion.div
              key={selectedHome.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Home className="w-6 h-6 text-emerald-600" />
                    {selectedHome.name}
                  </h1>
                  {selectedHome.address && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedHome.address}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">{selectedHome.roomsCount} pièce{selectedHome.roomsCount > 1 ? 's' : ''}</Badge>
                    <Badge variant="secondary" className="text-xs">{selectedHome.qrCodesCount} QR code{selectedHome.qrCodesCount > 1 ? 's' : ''}</Badge>
                    <Badge variant="secondary" className="text-xs">{selectedHome.membersCount} membre{selectedHome.membersCount > 1 ? 's' : ''}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  {canManage && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setHomeDialogOpen(true)}>
                        <Pencil className="w-4 h-4 mr-1.5" /> Modifier
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteHomeId(selectedHome.id)}>
                        <Trash2 className="w-4 h-4 mr-1.5" /> Supprimer
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <Separator className="mb-6" />

              {/* Rooms Grid */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Pièces</h2>
                {canManage && (
                  <Button size="sm" onClick={() => { setRoomName(''); setRoomIcon('Square'); setRoomDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-1.5" /> Ajouter
                  </Button>
                )}
              </div>

              {store.rooms.length === 0 ? (
                <Card className="border-dashed border-2">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <DoorOpen className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="font-medium text-muted-foreground">Aucune pièce</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Ajoutez des pièces pour organiser vos QR codes
                    </p>
                    {canManage && (
                      <Button variant="outline" size="sm" onClick={() => setRoomDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-1.5" /> Première pièce
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                  {store.rooms.map((room) => {
                    const IconComp = ICON_MAP[room.icon] || Square;
                    return (
                      <motion.div key={room.id} variants={fadeIn}>
                        <Card className="group hover:shadow-md hover:border-emerald-200 transition-all">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                  <IconComp className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{room.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {room._count.qrCodes} QR code{room._count.qrCodes > 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                              {canManage && (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost" size="icon" className="h-7 w-7"
                                    onClick={() => setEditingRoom({ id: room.id, name: room.name, icon: room.icon })}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                                    onClick={() => setDeleteRoomId(room.id)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          )}
        </main>
      </div>

      {/* ─── Create/Edit Home Dialog ─── */}
      <Dialog open={homeDialogOpen} onOpenChange={setHomeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedHome ? 'Modifier la maison' : 'Nouvelle maison'}
            </DialogTitle>
            <DialogDescription>
              Donnez un nom à votre maison et optionnellement une adresse.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nom de la maison</Label>
              <Input
                placeholder="Ex: Maison Famille, Appartement Paris..."
                value={homeName}
                onChange={(e) => setHomeName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateHome()}
              />
            </div>
            <div className="space-y-2">
              <Label>Adresse (optionnel)</Label>
              <Input
                placeholder="Ex: 12 rue de la Paix, Paris"
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateHome()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHomeDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleCreateHome}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Create Room Dialog ─── */}
      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle pièce</DialogTitle>
            <DialogDescription>Ajoutez une pièce à votre maison.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nom de la pièce</Label>
              <Input
                placeholder="Ex: Cuisine, Chambre, Salon..."
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
              />
            </div>
            <div className="space-y-2">
              <Label>Icône</Label>
              <RoomIconSelector value={roomIcon} onChange={setRoomIcon} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoomDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleCreateRoom}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Room Dialog ─── */}
      <Dialog open={!!editingRoom} onOpenChange={(open) => !open && setEditingRoom(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la pièce</DialogTitle>
          </DialogHeader>
          {editingRoom && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  value={editingRoom.name}
                  onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Icône</Label>
                <RoomIconSelector value={editingRoom.icon} onChange={(icon) => setEditingRoom({ ...editingRoom, icon })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRoom(null)}>Annuler</Button>
            <Button onClick={handleUpdateRoom}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Home Confirmation ─── */}
      <AlertDialog open={!!deleteHomeId} onOpenChange={(open) => !open && setDeleteHomeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette maison ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Tous les QR codes, pièces et journaux d'activité seront supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteHome} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Delete Room Confirmation ─── */}
      <AlertDialog open={!!deleteRoomId} onOpenChange={(open) => !open && setDeleteRoomId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette pièce ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les QR codes associés ne seront pas supprimés mais seront dissociés de cette pièce.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRoom} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <QrCode className="w-3.5 h-3.5" />
              <span className="font-semibold text-foreground">QR Domotik</span>
              <span>— Étape 2 : Auth & Dashboard</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Auth NextAuth</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Homes CRUD</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Rooms CRUD</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Root Component ────────────────────────────────────────────────────
export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return session ? <Dashboard /> : <AuthForm />;
}
