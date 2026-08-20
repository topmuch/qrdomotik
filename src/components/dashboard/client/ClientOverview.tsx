'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Home, QrCode, ScanLine, Layers, Plus, Zap, ChevronRight,
  Wifi, ShoppingBag, MessageSquare, Zap as ZapIcon, KeyRound,
  UtensilsCrossed, DoorOpen, StickyNote, Package, Pill, ExternalLink,
  BookOpen, Siren, MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStore } from '@/store/dashboard-store';
import { QR_TYPE_LABELS, type QrType } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────

interface HomeData {
  id: string;
  name: string;
  roomsCount?: number;
  qrCodesCount?: number;
  membersCount?: number;
  _count?: { rooms: number; qrCodes: number; members: number };
}

function hc(home: HomeData) {
  return {
    rooms: home._count?.rooms ?? home.roomsCount ?? 0,
    qrCodes: home._count?.qrCodes ?? home.qrCodesCount ?? 0,
    members: home._count?.members ?? home.membersCount ?? 0,
  };
}

interface QrData {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  room?: { name: string } | null;
  createdAt?: string;
}

interface Stats {
  homes: number;
  qrCodes: number;
  physicalQr: number;
  modules: number;
}

// ─── Icon map for QR types ────────────────────────────────────────────────

const MODULE_ICONS: Record<string, React.ElementType> = {
  wifi: Wifi,
  link: ExternalLink,
  info: BookOpen,
  postit: StickyNote,
  shopping_list: ShoppingBag,
  doorman: DoorOpen,
  medication: Pill,
  chores: ZapIcon,
  stock_dlc: Package,
  guestbook: MessageSquare,
  energy_counter: Zap,
  keys_tracker: KeyRound,
  daily_menu: UtensilsCrossed,
  emergency_service: Siren,
  neighborhood: MapPin,
};

// ─── Animation Variants ──────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

// ─── Component ────────────────────────────────────────────────────────────

export function ClientOverview() {
  const { data: session } = useSession();
  const user = session?.user;
  const { setActivePage } = useDashboardStore();

  const [stats, setStats] = useState<Stats>({ homes: 0, qrCodes: 0, physicalQr: 0, modules: 0 });
  const [homes, setHomes] = useState<HomeData[]>([]);
  const [recentQrs, setRecentQrs] = useState<QrData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [homesRes, qrsRes, physRes] = await Promise.all([
        fetch('/api/homes').then((r) => r.json()),
        fetch('/api/qr-codes').then((r) => r.json()),
        fetch('/api/physical-qr/my-codes').then((r) => r.json().catch(() => ({ data: [] }))),
      ]);

      const homesData: HomeData[] = homesRes.success ? homesRes.data : [];
      const qrsAll: QrData[] = qrsRes.success ? (Array.isArray(qrsRes.data) ? qrsRes.data : []) : [];
      const physData = physRes?.data || [];

      // Calculate unique QR types used as "modules"
      const uniqueTypes = new Set(qrsAll.map((q) => q.type));

      setHomes(homesData);
      setRecentQrs(qrsAll.slice(0, 6));
      setStats({
        homes: homesData.length,
        qrCodes: qrsAll.length,
        physicalQr: Array.isArray(physData) ? physData.length : 0,
        modules: uniqueTypes.size,
      });
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (!user) return null;

  const firstName = user.name?.split(' ')[0] || 'Utilisateur';

  // Stat cards configuration
  const statCards = [
    { label: 'Maisons', value: stats.homes, icon: Home, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-l-emerald-500' },
    { label: 'QR Codes actifs', value: stats.qrCodes, icon: QrCode, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-l-purple-500' },
    { label: 'QR Physiques', value: stats.physicalQr, icon: ScanLine, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-l-amber-500' },
    { label: 'Modules', value: stats.modules, icon: Layers, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-l-rose-500' },
  ];

  // Actions rapides
  const actions = [
    { label: 'Activer un QR code', icon: ScanLine, color: 'text-emerald-600', hoverBg: 'hover:bg-emerald-50/50', hoverBorder: 'hover:border-emerald-300', page: 'physical-qr' as const },
    { label: 'Nouvelle maison', icon: Plus, color: 'text-purple-600', hoverBg: 'hover:bg-purple-50/50', hoverBorder: 'hover:border-purple-300', page: 'homes' as const },
    { label: 'Créer QR dynamique', icon: QrCode, color: 'text-amber-600', hoverBg: 'hover:bg-amber-50/50', hoverBorder: 'hover:border-amber-300', page: 'qr-codes' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Header + Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl font-bold text-gray-900">
          Bonjour,{' '}
          <span className="bg-gradient-to-r from-emerald-600 to-purple-500 bg-clip-text text-transparent">
            {firstName}
          </span>
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Voici un aperçu de votre espace QR Domotik.
        </p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {statCards.map((card) => {
          const IconComp = card.icon;
          return (
            <motion.div key={card.label} variants={itemVariants}>
              <Card className={`border-0 shadow-sm hover:shadow-md transition-shadow border-l-4 ${card.border}`}>
                <CardContent className="p-4">
                  <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                    <IconComp className={`w-4.5 h-4.5 ${card.color}`} />
                  </div>
                  {loading ? (
                    <Skeleton className="h-7 w-12 mb-1" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900 tabular-nums">
                      {card.value}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Actions rapides */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> Actions rapides
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {actions.map((action) => {
                    const IconComp = action.icon;
                    return (
                      <Button
                        key={action.label}
                        variant="outline"
                        onClick={() => setActivePage(action.page)}
                        className={`h-auto py-4 flex-col gap-2 border-dashed ${action.hoverBg} ${action.hoverBorder}`}
                      >
                        <IconComp className={`w-5 h-5 ${action.color}`} />
                        <span className="text-xs font-medium">{action.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Mes maisons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Home className="w-4 h-4 text-emerald-600" /> Mes maisons
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-500"
                    onClick={() => setActivePage('homes')}
                  >
                    Voir tout <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-xl" />
                    ))}
                  </div>
                ) : homes.length === 0 ? (
                  <div className="text-center py-8">
                    <Home className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-3">Aucune maison créée</p>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setActivePage('homes')}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Créer ma première maison
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {homes.map((home) => (
                      <div
                        key={home.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => setActivePage('homes')}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                            <Home className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">{home.name}</p>
                            <p className="text-xs text-gray-400">
                              {hc(home).rooms} pièce{hc(home).rooms > 1 ? 's' : ''} · {hc(home).qrCodes} QR · {hc(home).members} membre{hc(home).members > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* QR Codes récents */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-purple-600" /> QR Codes récents
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-500"
                    onClick={() => setActivePage('qr-codes')}
                  >
                    Voir tout <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-xl" />
                    ))}
                  </div>
                ) : recentQrs.length === 0 ? (
                  <div className="text-center py-8">
                    <QrCode className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Aucun QR code créé</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {recentQrs.map((qr) => {
                      const IconComp = MODULE_ICONS[qr.type] || QrCode;
                      return (
                        <div key={qr.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                              <IconComp className="w-4 h-4 text-purple-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate">{qr.name}</p>
                              <p className="text-xs text-gray-400">
                                {QR_TYPE_LABELS[qr.type as QrType] || qr.type}
                                {qr.room ? ` · ${qr.room.name}` : ''}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={qr.isActive ? 'default' : 'secondary'}
                            className={qr.isActive ? 'bg-emerald-100 text-emerald-700 text-[10px]' : 'text-[10px]'}
                          >
                            {qr.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right column - Profile + Modules */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {firstName[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{user.name || 'Utilisateur'}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setActivePage('settings')}
                >
                  Paramètres du compte
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Modules disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                  {Object.entries(QR_TYPE_LABELS).map(([type, label]) => {
                    const IconComp = MODULE_ICONS[type] || QrCode;
                    return (
                      <div
                        key={type}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <IconComp className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-xs text-gray-600 truncate">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
