'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { useHomeStore, type QrCodeInfo } from '@/store/home-store';
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
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  QrCode, Home, Plus, LogIn, LogOut, UserPlus, Users,
  Bed, Bath, Sofa, CookingPot, DoorOpen, Car, Lamp, Monitor,
  Flower2, WashingMachine, Refrigerator, Tv, Warehouse, KeyRound,
  Trash2, Pencil, Menu, X, LayoutDashboard, Square,
  Wifi, ExternalLink, BookOpen, StickyNote, ShoppingCart,
  Pill, Star, Package, Download, Eye, Power, PowerOff,
  Copy, Check, Bell, Settings, PackageSearch, ToggleLeft, ToggleRight,
  Zap, UtensilsCrossed, MessageSquare,
} from 'lucide-react';
import { ContentEditor, StockDlcPanel } from '@/components/dashboard/ContentEditor';
import { ActivityLogs } from '@/components/dashboard/ActivityLogs';
import { MembersPanel } from '@/components/dashboard/MembersPanel';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { NotificationPermission } from '@/components/dashboard/NotificationPermission';
import { ROOM_ICONS } from '@/lib/constants';
import { QR_TYPE_LABELS, QR_TYPE_DESCRIPTIONS, QR_TYPE_ICONS, type QrType } from '@/types';

// ─── Icon Maps ──────────────────────────────────────────────────────────
const ROOM_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Square, Bed, Bath, Sofa, CookingPot, DoorOpen, Car, Lamp, Monitor,
  Flower2, WashingMachine, Refrigerator, Tv, Warehouse,
};

const QR_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi, link: ExternalLink, info: BookOpen, postit: StickyNote,
  shopping_list: ShoppingCart, doorman: DoorOpen, medication: Pill,
  chores: Star, stock_dlc: Package, guestbook: MessageSquare,
  energy_counter: Zap, keys_tracker: KeyRound, daily_menu: UtensilsCrossed,
};

const QR_COLOR_MAP: Record<string, string> = {
  wifi: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  link: 'bg-violet-50 text-violet-700 border-violet-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  postit: 'bg-amber-50 text-amber-700 border-amber-200',
  shopping_list: 'bg-rose-50 text-rose-700 border-rose-200',
  doorman: 'bg-orange-50 text-orange-700 border-orange-200',
  medication: 'bg-teal-50 text-teal-700 border-teal-200',
  chores: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  stock_dlc: 'bg-lime-50 text-lime-700 border-lime-200',
  guestbook: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  energy_counter: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  keys_tracker: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  daily_menu: 'bg-red-50 text-red-700 border-red-200',
};

// ─── Defaults content per type ──────────────────────────────────────────
const DEFAULT_CONTENT: Record<string, string> = {
  wifi: JSON.stringify({ ssid: '', password: '', security: 'WPA2' }),
  link: JSON.stringify({ url: '', title: '', description: '' }),
  info: JSON.stringify({ title: '', body: '' }),
  postit: JSON.stringify({ message: '', color: 'yellow' }),
  shopping_list: JSON.stringify({ items: [] }),
  doorman: JSON.stringify({ predefinedInstructions: [], showMessageField: true, showRingButton: true, welcomeMessage: '' }),
  medication: JSON.stringify({ medications: [{ name: '', dosage: '', time: '08:00' }], reminderMessage: '' }),
  chores: JSON.stringify({ chores: [], rewardMessage: '' }),
  stock_dlc: JSON.stringify({ tracked: true }),
};

// ─── Animations ──────────────────────────────────────────────────────────
const fadeIn = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };

// ═══════════════════════════════════════════════════════════════════════════
// AUTH FORM
// ═══════════════════════════════════════════════════════════════════════════
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
        const res = await fetch('/api/auth/register', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, fullName }),
        });
        const data = await res.json();
        if (!data.success) { toast.error(data.error); return; }
        toast.success('Compte créé ! Connexion...');
      }
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) toast.error('Email ou mot de passe incorrect');
    } catch { toast.error('Erreur de connexion'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 opacity-20 blur-xl" />
            <Image src="/qr-domotik-logo.png" alt="QR Domotik" width={80} height={80} className="relative rounded-2xl drop-shadow-lg" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">QR <span className="text-emerald-600">Domotik</span></h1>
          <p className="text-muted-foreground mt-1">Votre maison, intelligemment connectée</p>
        </div>
        <Card className="border-slate-200 shadow-lg shadow-slate-200/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              {isLogin ? 'Connexion' : 'Créer un compte'}
            </CardTitle>
            <CardDescription>{isLogin ? 'Connectez-vous pour accéder à vos maisons' : 'Créez votre compte et votre première maison'}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div key="name" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                    <div className="space-y-2"><Label htmlFor="fullName">Nom complet</Label><Input id="fullName" placeholder="Jean Dupont" value={fullName} onChange={(e) => setFullName(e.target.value)} required={!isLogin} /></div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="password">Mot de passe</Label><Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (<span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isLogin ? 'Connexion...' : 'Création...'}</span>) : isLogin ? 'Se connecter' : "S'inscrire"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?'}{' '}<span className="font-medium text-emerald-600 hover:underline">{isLogin ? "S'inscrire" : 'Se connecter'}</span>
              </button>
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-6">Plateforme complète QR Domotik</p>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOM ICON SELECTOR
// ═══════════════════════════════════════════════════════════════════════════
function RoomIconSelector({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  const icons = ROOM_ICONS.filter(Boolean);
  return (
    <div className="grid grid-cols-7 gap-2">
      {icons.map((name) => {
        const IconComp = ROOM_ICON_MAP[name] || Square;
        const isActive = value === name;
        return (
          <button key={name} type="button" onClick={() => onChange(name)} title={name}
            className={`p-2 rounded-lg border transition-all flex items-center justify-center ${isActive ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200' : 'border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700'}`}>
            <IconComp className="w-5 h-5" />
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// QR TYPE SELECTOR
// ═══════════════════════════════════════════════════════════════════════════
function QrTypeSelector({ value, onChange }: { value: string; onChange: (type: string) => void }) {
  const types: QrType[] = ['wifi', 'link', 'info', 'postit', 'shopping_list', 'doorman', 'medication', 'chores', 'stock_dlc', 'guestbook', 'energy_counter', 'keys_tracker', 'daily_menu'];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {types.map((type) => {
        const IconComp = QR_ICON_MAP[type] || Square;
        const isActive = value === type;
        return (
          <button key={type} type="button" onClick={() => onChange(type)}
            className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all text-sm ${
              isActive
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200'
                : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}>
            <IconComp className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
            <div className="min-w-0">
              <p className="font-medium text-xs">{QR_TYPE_LABELS[type]}</p>
              <p className="text-[10px] text-muted-foreground truncate">{QR_TYPE_DESCRIPTIONS[type]}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
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
  const [deleteQrId, setDeleteQrId] = useState<string | null>(null);
  const [editingRoom, setEditingRoom] = useState<{ id: string; name: string; icon: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // QR creation state
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrName, setQrName] = useState('');
  const [qrType, setQrType] = useState<string>('wifi');
  const [qrRoomId, setQrRoomId] = useState<string>('');
  const [qrPin, setQrPin] = useState('');

  // QR preview state
  const [previewQr, setPreviewQr] = useState<QrCodeInfo | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [slugCopied, setSlugCopied] = useState(false);

  // QR content editor state
  const [editQr, setEditQr] = useState<QrCodeInfo | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Activity logs & Stock & Members panel
  const [showLogs, setShowLogs] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => { store.refreshHomes(); }, []);

  // ─── Home handlers ───
  const handleCreateHome = async () => {
    if (!homeName.trim()) return;
    const res = await fetch('/api/homes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: homeName, address: homeAddress || undefined }) });
    const data = await res.json();
    if (data.success) { toast.success(`Maison « ${data.data.name} » créée`); setHomeName(''); setHomeAddress(''); setHomeDialogOpen(false); store.refreshHomes(); }
    else toast.error(data.error);
  };

  const handleDeleteHome = async () => {
    if (!deleteHomeId) return;
    const res = await fetch(`/api/homes/${deleteHomeId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { toast.success('Maison supprimée'); store.refreshHomes(); }
    else toast.error(data.error);
    setDeleteHomeId(null);
  };

  // ─── Room handlers ───
  const handleCreateRoom = async () => {
    if (!roomName.trim() || !store.selectedHomeId) return;
    const res = await fetch('/api/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ homeId: store.selectedHomeId, name: roomName, icon: roomIcon }) });
    const data = await res.json();
    if (data.success) { toast.success(`Pièce « ${data.data.name} » créée`); setRoomName(''); setRoomIcon('Square'); setRoomDialogOpen(false); store.refreshRooms(); store.refreshHomes(); }
    else toast.error(data.error);
  };

  const handleUpdateRoom = async () => {
    if (!editingRoom || !editingRoom.name.trim()) return;
    const res = await fetch(`/api/rooms/${editingRoom.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editingRoom.name, icon: editingRoom.icon }) });
    const data = await res.json();
    if (data.success) { toast.success('Pièce mise à jour'); setEditingRoom(null); store.refreshRooms(); store.refreshHomes(); }
    else toast.error(data.error);
  };

  const handleDeleteRoom = async () => {
    if (!deleteRoomId) return;
    const res = await fetch(`/api/rooms/${deleteRoomId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { toast.success('Pièce supprimée'); store.refreshRooms(); store.refreshHomes(); }
    else toast.error(data.error);
    setDeleteRoomId(null);
  };

  // ─── QR Code handlers ───
  const handleCreateQr = async () => {
    if (!qrName.trim() || !store.selectedHomeId) return;
    const res = await fetch('/api/qr-codes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        homeId: store.selectedHomeId,
        name: qrName,
        type: qrType,
        roomId: qrRoomId || null,
        pinCode: qrPin || undefined,
        contentJson: DEFAULT_CONTENT[qrType] || '{}',
      }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(`QR code « ${data.data.name} » créé`);
      setQrName(''); setQrType('wifi'); setQrRoomId(''); setQrPin('');
      setQrDialogOpen(false);
      store.refreshQrCodes(); store.refreshHomes(); store.refreshRooms();
      // Auto-open preview
      setPreviewQr(data.data);
      setPreviewDialogOpen(true);
    } else toast.error(data.error);
  };

  const handleToggleQr = async (qr: QrCodeInfo) => {
    const res = await fetch(`/api/qr-codes/${qr.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !qr.isActive }),
    });
    const data = await res.json();
    if (data.success) { toast.success(qr.isActive ? 'QR code désactivé' : 'QR code activé'); store.refreshQrCodes(); }
    else toast.error(data.error);
  };

  const handleDeleteQr = async () => {
    if (!deleteQrId) return;
    const res = await fetch(`/api/qr-codes/${deleteQrId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { toast.success('QR code supprimé'); store.refreshQrCodes(); store.refreshHomes(); }
    else toast.error(data.error);
    setDeleteQrId(null);
  };

  const handleCopySlug = useCallback((slug: string) => {
    navigator.clipboard.writeText(`https://qrdomotik.com/r/${slug}`);
    setSlugCopied(true);
    setTimeout(() => setSlugCopied(false), 2000);
  }, []);

  // ─── Content Editor ───
  const handleOpenEditor = (qr: QrCodeInfo) => {
    setEditQr(qr);
    setEditDialogOpen(true);
  };

  const handleSaveContent = async (contentJson: string) => {
    if (!editQr) return;
    const res = await fetch(`/api/qr-codes/${editQr.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentJson }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success('Contenu mis à jour');
      store.refreshQrCodes();
    } else {
      toast.error(data.error);
    }
  };

  // ─── Doorman Toggle ───
  const handleToggleDoorman = async (qr: QrCodeInfo) => {
    const res = await fetch(`/api/qr-codes/${qr.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPresentMode: !qr.isPresentMode }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(qr.isPresentMode ? 'Mode Absent activé' : 'Mode Présent activé');
      store.refreshQrCodes();
    } else {
      toast.error(data.error);
    }
  };

  const selectedHome = store.getSelectedHome();
  const memberRole = selectedHome?.role;
  const canManage = memberRole === 'owner' || memberRole === 'admin';

  const filteredQrCodes = store.selectedRoomId
    ? store.qrCodes.filter((q) => q.roomId === store.selectedRoomId)
    : store.qrCodes;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* ─── Top Nav ─── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <Image src="/qr-domotik-logo.png" alt="QR Domotik" width={28} height={28} className="rounded-md" />
              <span className="font-bold text-lg hidden sm:inline">QR <span className="text-emerald-600">Domotik</span></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Badge variant="secondary" className="hidden sm:flex items-center gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </Badge>
            <span className="hidden md:inline text-sm text-muted-foreground">{session?.user?.name}</span>
            <Button variant="ghost" size="icon" onClick={() => signOut()} title="Déconnexion"><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* ─── Sidebar ─── */}
        <aside className={`fixed inset-y-0 left-0 top-14 z-30 w-72 bg-white border-r border-slate-200 transform transition-transform duration-200 md:static md:transform-none ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Maisons</h2>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setHomeName(''); setHomeAddress(''); setHomeDialogOpen(true); }}><Plus className="w-4 h-4" /></Button>
            </div>
            <ScrollArea className="flex-1 max-h-[40vh]">
              <div className="p-2 space-y-1">
                {store.homes.map((home) => (
                  <button key={home.id} onClick={() => { store.selectHome(home.id); setMobileMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all ${store.selectedHomeId === home.id ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'hover:bg-slate-50 text-slate-700 border border-transparent'}`}>
                    <Home className={`w-4 h-4 flex-shrink-0 ${store.selectedHomeId === home.id ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{home.name}</p>
                      <p className="text-xs text-muted-foreground">{home.roomsCount} pièce{home.roomsCount > 1 ? 's' : ''} · {home.qrCodesCount} QR</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>

            {/* Rooms section in sidebar */}
            {selectedHome && (
              <>
                <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                  <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Pièces</h2>
                  {canManage && (
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setRoomName(''); setRoomIcon('Square'); setRoomDialogOpen(true); }}><Plus className="w-4 h-4" /></Button>
                  )}
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    <button onClick={() => store.selectRoom(null)}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-all ${!store.selectedRoomId ? 'bg-slate-100 font-medium text-foreground' : 'text-muted-foreground hover:bg-slate-50'}`}>
                      <QrCode className="w-4 h-4" /> Toutes les pièces
                    </button>
                    {store.rooms.map((room) => {
                      const IconComp = ROOM_ICON_MAP[room.icon] || Square;
                      return (
                        <button key={room.id} onClick={() => store.selectRoom(room.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-all group ${store.selectedRoomId === room.id ? 'bg-slate-100 font-medium text-foreground' : 'text-muted-foreground hover:bg-slate-50'}`}>
                          <IconComp className="w-4 h-4" /> <span className="truncate flex-1">{room.name}</span>
                          <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">{room._count.qrCodes}</span>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        </aside>

        {mobileMenuOpen && <div className="fixed inset-0 top-14 z-20 bg-black/20 md:hidden" onClick={() => setMobileMenuOpen(false)} />}

        {/* ─── Main Content ─── */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <NotificationPermission />
          {!selectedHome ? (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-sm">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center"><Home className="w-8 h-8 text-emerald-500" /></div>
                <h2 className="text-xl font-semibold mb-2">Bienvenue !</h2>
                <p className="text-muted-foreground mb-6">{store.homes.length === 0 ? 'Créez votre première maison.' : 'Sélectionnez une maison.'}</p>
                {store.homes.length === 0 && <Button onClick={() => setHomeDialogOpen(true)}><Plus className="w-4 h-4 mr-2" /> Créer ma maison</Button>}
              </motion.div>
            </div>
          ) : (
            <motion.div key={selectedHome.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Home className="w-6 h-6 text-emerald-600" />{selectedHome.name}
                  </h1>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">{store.rooms.length} pièce{store.rooms.length > 1 ? 's' : ''}</Badge>
                    <Badge variant="secondary" className="text-xs">{filteredQrCodes.length} QR code{filteredQrCodes.length > 1 ? 's' : ''}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  {canManage && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setHomeDialogOpen(true)}><Pencil className="w-4 h-4 mr-1.5" /> Modifier</Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteHomeId(selectedHome.id)}><Trash2 className="w-4 h-4 mr-1.5" /></Button>
                    </>
                  )}
                </div>
              </div>
              <Separator className="mb-6" />

              {/* Rooms grid (compact, inline) */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Pièces</h2>
                {canManage && <Button size="sm" variant="outline" onClick={() => { setRoomName(''); setRoomIcon('Square'); setRoomDialogOpen(true); }}><Plus className="w-4 h-4 mr-1.5" /> Pièce</Button>}
              </div>
              {store.rooms.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
                  {store.rooms.map((room) => {
                    const IconComp = ROOM_ICON_MAP[room.icon] || Square;
                    return (
                      <button key={room.id} onClick={() => store.selectRoom(room.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm whitespace-nowrap transition-all ${store.selectedRoomId === room.id ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                        <IconComp className="w-4 h-4" /> {room.name}
                        <Badge variant="secondary" className="text-[10px] ml-1">{room._count.qrCodes}</Badge>
                      </button>
                    );
                  })}
                </div>
              )}
              {store.rooms.length === 0 && (
                <p className="text-sm text-muted-foreground mb-6">Aucune pièce. Ajoutez-en pour organiser vos QR codes.</p>
              )}

              {/* QR Codes Section */}
              <Separator className="mb-6" />
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  QR Codes
                  {store.selectedRoomId && <Badge variant="outline" className="ml-1 text-xs">{store.rooms.find(r => r.id === store.selectedRoomId)?.name}</Badge>}
                </h2>
                {canManage && (
                  <Button size="sm" onClick={() => { setQrName(''); setQrType('wifi'); setQrRoomId(store.selectedRoomId || ''); setQrPin(''); setQrDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-1.5" /> Nouveau QR
                  </Button>
                )}
              </div>

              {filteredQrCodes.length === 0 ? (
                <Card className="border-dashed border-2">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3"><QrCode className="w-7 h-7 text-slate-400" /></div>
                    <p className="font-medium text-muted-foreground">Aucun QR code</p>
                    <p className="text-sm text-muted-foreground mb-4">Créez votre premier QR code dynamique</p>
                    {canManage && <Button size="sm" onClick={() => setQrDialogOpen(true)}><Plus className="w-4 h-4 mr-1.5" /> Créer un QR code</Button>}
                  </CardContent>
                </Card>
              ) : (
                <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredQrCodes.map((qr) => {
                    const IconComp = QR_ICON_MAP[qr.type] || Square;
                    const colorClass = QR_COLOR_MAP[qr.type] || 'bg-slate-50 text-slate-700 border-slate-200';
                    return (
                      <motion.div key={qr.id} variants={fadeIn}>
                        <Card className={`group hover:shadow-md transition-all ${!qr.isActive ? 'opacity-60' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg border ${colorClass}`}><IconComp className="w-5 h-5" /></div>
                                <div>
                                  <p className="font-medium text-sm">{qr.name}</p>
                                  <p className="text-xs text-muted-foreground">{QR_TYPE_LABELS[qr.type as QrType] || qr.type}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {qr.type === 'doorman' && canManage && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleDoorman(qr)} title={qr.isPresentMode ? 'Passer en mode Absent' : 'Passer en mode Présent'}>
                                    {qr.isPresentMode ? <ToggleRight className="w-3.5 h-3.5 text-emerald-600" /> : <ToggleLeft className="w-3.5 h-3.5 text-orange-500" />}
                                  </Button>
                                )}
                                {canManage && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEditor(qr)} title="Modifier le contenu"><Settings className="w-3.5 h-3.5" /></Button>
                                )}
                                {canManage && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleQr(qr)} title={qr.isActive ? 'Désactiver' : 'Activer'}>
                                    {qr.isActive ? <Power className="w-3.5 h-3.5 text-emerald-600" /> : <PowerOff className="w-3.5 h-3.5 text-slate-400" />}
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setPreviewQr(qr); setPreviewDialogOpen(true); }}><Eye className="w-3.5 h-3.5" /></Button>
                                {canManage && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteQrId(qr.id)}><Trash2 className="w-3.5 h-3.5" /></Button>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {qr.room && <Badge variant="outline" className="text-[10px]">{qr.room.name}</Badge>}
                              <span className="font-mono">qrdomotik.com/r/{qr.publicSlug}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {!qr.isActive && <Badge variant="secondary" className="text-[10px] bg-red-50 text-red-600">Désactivé</Badge>}
                              {qr.pinCode && <Badge variant="secondary" className="text-[10px]">PIN: ••••</Badge>}
                              {qr.type === 'doorman' && (
                                <Badge variant="secondary" className={qr.isPresentMode ? 'text-[10px] bg-emerald-50 text-emerald-700' : 'text-[10px] bg-orange-50 text-orange-700'}>
                                  {qr.isPresentMode ? 'Présent' : 'Absent'}
                                </Badge>
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

          {/* Activity Logs & Stock sections */}
          {selectedHome && (
            <div className="mt-8 space-y-6">
              <Separator />

              {/* Quick actions bar */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowMembers(!showMembers)} className={showMembers ? 'bg-violet-50 border-violet-300 text-violet-700' : ''}>
                  <Users className="w-4 h-4 mr-1.5" /> Membres
                  {store.members.length > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px]">{store.members.length}</Badge>}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowLogs(!showLogs)} className={showLogs ? 'bg-slate-100' : ''}>
                  <Bell className="w-4 h-4 mr-1.5" /> Activité
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowStock(!showStock)} className={showStock ? 'bg-lime-50 border-lime-300 text-lime-700' : ''}>
                  <PackageSearch className="w-4 h-4 mr-1.5" /> Stock & DLC
                </Button>
              </div>

              {/* Activity Logs */}
              {showLogs && (
                <Card>
                  <CardContent className="p-4">
                    <ActivityLogs homeId={selectedHome.id} />
                  </CardContent>
                </Card>
              )}

              {/* Members */}
              {showMembers && (
                <Card className="border-violet-200">
                  <CardContent className="p-4">
                    <MembersPanel />
                  </CardContent>
                </Card>
              )}

              {/* Stock & DLC */}
              {showStock && (
                <Card className="border-lime-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <PackageSearch className="w-5 h-5 text-lime-600" />
                      Stock & Dates de péremption
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StockDlcPanel homeId={selectedHome.id} />
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ═══ DIALOGS ═══ */}

      {/* Create/Edit Home */}
      <Dialog open={homeDialogOpen} onOpenChange={setHomeDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selectedHome ? 'Modifier' : 'Nouvelle'} maison</DialogTitle><DialogDescription>Nom et adresse optionnelle.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Nom</Label><Input placeholder="Maison Famille..." value={homeName} onChange={(e) => setHomeName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateHome()} /></div>
            <div className="space-y-2"><Label>Adresse</Label><Input placeholder="12 rue de la Paix, Paris" value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateHome()} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setHomeDialogOpen(false)}>Annuler</Button><Button onClick={handleCreateHome}>Créer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Room */}
      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle pièce</DialogTitle><DialogDescription>Ajoutez une pièce à votre maison.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Nom</Label><Input placeholder="Cuisine, Chambre, Salon..." value={roomName} onChange={(e) => setRoomName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()} /></div>
            <div className="space-y-2"><Label>Icône</Label><RoomIconSelector value={roomIcon} onChange={setRoomIcon} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setRoomDialogOpen(false)}>Annuler</Button><Button onClick={handleCreateRoom}>Ajouter</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Room */}
      <Dialog open={!!editingRoom} onOpenChange={(open) => !open && setEditingRoom(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifier la pièce</DialogTitle></DialogHeader>
          {editingRoom && (<div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Nom</Label><Input value={editingRoom.name} onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Icône</Label><RoomIconSelector value={editingRoom.icon} onChange={(icon) => setEditingRoom({ ...editingRoom, icon })} /></div>
          </div>)}
          <DialogFooter><Button variant="outline" onClick={() => setEditingRoom(null)}>Annuler</Button><Button onClick={handleUpdateRoom}>Enregistrer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create QR Code */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nouveau QR Code</DialogTitle><DialogDescription>Choisissez un type et configurez le contenu dynamique.</DialogDescription></DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2"><Label>Nom du QR code</Label><Input placeholder="Ex: Wi-Fi Cuisine, Portier Entrée..." value={qrName} onChange={(e) => setQrName(e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Type de module</Label>
              <QrTypeSelector value={qrType} onChange={setQrType} />
            </div>
            <div className="space-y-2">
              <Label>Pièce (optionnel)</Label>
              <select
                value={qrRoomId}
                onChange={(e) => setQrRoomId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Aucune</option>
                {store.rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Code PIN (optionnel — 4 chiffres)</Label>
              <Input placeholder="Ex: 1234" value={qrPin} onChange={(e) => setQrPin(e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength={4} className="max-w-[120px]" />
              <p className="text-xs text-muted-foreground">Protège l\'accès au QR code (ex: Portier Virtuel)</p>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setQrDialogOpen(false)}>Annuler</Button><Button onClick={handleCreateQr} disabled={!qrName.trim()}><QrCode className="w-4 h-4 mr-1.5" /> Créer le QR code</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content Editor Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) { setEditQr(null); store.refreshQrCodes(); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le contenu — {editQr?.name}</DialogTitle>
            <DialogDescription>{editQr && (QR_TYPE_LABELS[editQr.type as QrType] || editQr.type)}</DialogDescription>
          </DialogHeader>
          {editQr && (
            <ContentEditor
              qrId={editQr.id}
              type={editQr.type as QrType}
              initialContent={editQr.content?.contentJson || '{}'}
              onSave={handleSaveContent}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* QR Preview & Download */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>QR Code — {previewQr?.name}</DialogTitle><DialogDescription>Imprimez ce code et collez-le dans votre maison.</DialogDescription></DialogHeader>
          {previewQr && (
            <div className="space-y-4 py-2">
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-xl border-2 border-slate-200 shadow-sm">
                <img src={`/api/qr-codes/generate?slug=${previewQr.publicSlug}&size=280`} alt="QR Code" width={280} height={280} className="block" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">qrdomotik.com/r/{previewQr.publicSlug}</code>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopySlug(previewQr.publicSlug)}>
                    {slugCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
                <Badge variant={previewQr.isActive ? 'default' : 'secondary'} className={previewQr.isActive ? 'bg-emerald-100 text-emerald-700' : ''}>
                  {previewQr.isActive ? 'Actif' : 'Désactivé'}
                </Badge>
                {previewQr.room && <p className="text-xs text-muted-foreground">Pièce : {previewQr.room.name}</p>}
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" asChild>
                  <a href={`/api/qr-codes/generate?slug=${previewQr.publicSlug}&size=600`} download={`qr-${previewQr.publicSlug}.png`}>
                    <Download className="w-4 h-4 mr-1.5" /> Télécharger PNG
                  </a>
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => handleCopySlug(previewQr.publicSlug)}>
                  <Copy className="w-4 h-4 mr-1.5" /> Copier le lien
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmations */}
      <AlertDialog open={!!deleteHomeId} onOpenChange={(open) => !open && setDeleteHomeId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Supprimer cette maison ?</AlertDialogTitle><AlertDialogDescription>Action irréversible. Tous les QR codes et pièces seront supprimés.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleDeleteHome} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!deleteRoomId} onOpenChange={(open) => !open && setDeleteRoomId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Supprimer cette pièce ?</AlertDialogTitle><AlertDialogDescription>Les QR codes seront dissociés.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleDeleteRoom} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!deleteQrId} onOpenChange={(open) => !open && setDeleteQrId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Supprimer ce QR code ?</AlertDialogTitle><AlertDialogDescription>Le lien public sera définitivement cassé.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleDeleteQr} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <QrCode className="w-3.5 h-3.5" />
              <span className="font-semibold text-foreground">QR Domotik</span>
              <span>— Plateforme complète</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 13 modules</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Multi-utilisateurs</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Rôles & Permissions</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> PWA</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────
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
