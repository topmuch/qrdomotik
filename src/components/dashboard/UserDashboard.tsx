'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  QrCode, Home, Plus, Settings, LogOut, ShieldCheck,
  Tag, Activity, ArrowRight, Layers, ScanLine, ChevronRight,
  Wifi, ShoppingBag, MessageSquare, Zap, KeyRound, UtensilsCrossed,
  DoorOpen, StickyNote, Package, Pill,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePanelStore } from '@/store/panel-store';
import { QR_TYPE_LABELS } from '@/types';

interface HomeData { id: string; name: string; _count: { rooms: number; qrCodes: number; members: number }; }
interface QrData { id: string; name: string; type: string; isActive: boolean; room?: { name: string } | null; }
interface Stats { homes: number; qrCodes: number; members: number; physicalQr: number; }

const MODULE_ICONS: Record<string, React.ElementType> = {
  wifi: Wifi, link: ArrowRight, info: Activity, postit: StickyNote,
  shopping_list: ShoppingBag, doorman: DoorOpen, medication: Pill,
  chores: Zap, guestbook: MessageSquare, daily_menu: UtensilsCrossed,
  keys_tracker: KeyRound, stock_dlc: Package,
};

export function UserDashboard() {
  const { data: session } = useSession();
  const user = session?.user;
  const isAdmin = (session?.user as Record<string, unknown>)?.role === 'superadmin';
  const { openAdmin, openUserPanel } = usePanelStore();

  const [stats, setStats] = useState<Stats>({ homes: 0, qrCodes: 0, members: 0, physicalQr: 0 });
  const [homes, setHomes] = useState<HomeData[]>([]);
  const [recentQrs, setRecentQrs] = useState<QrData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [homesRes, qrsRes, physRes] = await Promise.all([
        fetch('/api/homes').then(r => r.json()),
        fetch('/api/qr-codes').then(r => r.json()),
        fetch('/api/physical-qr/my-codes').then(r => r.json().catch(() => ({ data: [] }))),
      ]);
      const homesData: HomeData[] = homesRes.success ? homesRes.data : [];
      const qrsAll = qrsRes.success ? qrsRes.data : [];
      const qrsData: QrData[] = Array.isArray(qrsAll) ? qrsAll.slice(0, 6) : [];
      const physData = physRes?.data || [];
      setHomes(homesData);
      setRecentQrs(qrsData);
      setStats({
        homes: homesData.length,
        qrCodes: Array.isArray(qrsAll) ? qrsAll.length : 0,
        members: homesData.reduce((acc: number, h: HomeData) => acc + h._count.members, 0),
        physicalQr: Array.isArray(physData) ? physData.length : 0,
      });
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    window.location.href = '/';
  };

  if (!user) return null;

  const firstName = user.name?.split(' ')[0] || 'Utilisateur';
  const StatIcon = ({ stat }: { stat: { icon: React.ElementType; color: string; bg: string } }) => {
    const c = stat.color.includes('blue') ? '#2563eb' : stat.color.includes('emerald') ? '#059669' : stat.color.includes('purple') ? '#7c3aed' : '#d97706';
    return <stat.icon className="w-5 h-5" style={{ color: c }} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <QrCode className="w-7 h-7 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">QR Domotik</span>
            <Badge variant="outline" className="hidden sm:inline-flex text-xs bg-blue-50 text-blue-600 border-blue-200">Dashboard</Badge>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={openAdmin} className="text-xs gap-1 hidden sm:flex">
                <ShieldCheck className="w-3.5 h-3.5" /> Administration
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={openUserPanel} className="text-xs gap-1">
              <Tag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mes QR</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs gap-1 text-gray-500">
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Bonjour, <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">{firstName}</span>
          </h1>
          <p className="text-gray-500 mt-1">Voici un aperçu de votre espace QR Domotik.</p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Maisons', value: stats.homes, icon: Home, color: 'blue', bg: 'bg-blue-50' },
            { label: 'QR Codes', value: stats.qrCodes, icon: QrCode, color: 'emerald', bg: 'bg-emerald-50' },
            { label: 'Membres', value: stats.members, icon: Layers, color: 'purple', bg: 'bg-purple-50' },
            { label: 'QR Physiques', value: stats.physicalQr, icon: ScanLine, color: 'amber', bg: 'bg-amber-50' },
          ].map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-3`}>
                    <StatIcon stat={item} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{loading ? '...' : item.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Actions rapides */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> Actions rapides
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Button variant="outline" onClick={openUserPanel} className="h-auto py-3 flex-col gap-1.5 border-dashed hover:border-blue-300 hover:bg-blue-50/50">
                    <ScanLine className="w-5 h-5 text-blue-600" />
                    <span className="text-xs font-medium">Activer un QR</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col gap-1.5 border-dashed hover:border-emerald-300 hover:bg-emerald-50/50">
                    <Plus className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-medium">Nouvelle maison</span>
                  </Button>
                  {isAdmin && (
                    <Button variant="outline" onClick={openAdmin} className="h-auto py-3 flex-col gap-1.5 border-dashed hover:border-purple-300 hover:bg-purple-50/50">
                      <Layers className="w-5 h-5 text-purple-600" />
                      <span className="text-xs font-medium">Générer lot QR</span>
                    </Button>
                  )}
                  <Button variant="outline" className="h-auto py-3 flex-col gap-1.5 border-dashed hover:border-gray-300 hover:bg-gray-50">
                    <Settings className="w-5 h-5 text-gray-600" />
                    <span className="text-xs font-medium">Paramètres</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Mes maisons */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Home className="w-4 h-4 text-blue-600" /> Mes maisons
                </CardTitle>
              </CardHeader>
              <CardContent>
                {homes.length === 0 ? (
                  <div className="text-center py-8">
                    <Home className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-3">Aucune maison créée</p>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-1" /> Créer ma première maison
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {homes.map((home) => (
                      <div key={home.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                            <Home className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">{home.name}</p>
                            <p className="text-xs text-gray-400">{home._count.rooms} pièce{home._count.rooms > 1 ? 's' : ''} · {home._count.qrCodes} QR · {home._count.members} membre{home._count.members > 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* QR codes récents */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-emerald-600" /> QR Codes récents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentQrs.length === 0 ? (
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
                            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                              <IconComp className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate">{qr.name}</p>
                              <p className="text-xs text-gray-400">{QR_TYPE_LABELS[qr.type as keyof typeof QR_TYPE_LABELS] || qr.type}{qr.room ? ` · ${qr.room.name}` : ''}</p>
                            </div>
                          </div>
                          <Badge variant={qr.isActive ? 'default' : 'secondary'} className={qr.isActive ? 'bg-emerald-100 text-emerald-700 text-[10px]' : 'text-[10px]'}>
                            {qr.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                    {firstName[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{user.name || 'Utilisateur'}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                {isAdmin ? (
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200">Superadmin</Badge>
                ) : (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">Utilisateur</Badge>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Modules disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                  {Object.entries(QR_TYPE_LABELS).slice(0, 12).map(([type, label]) => {
                    const IconComp = MODULE_ICONS[type] || QrCode;
                    return (
                      <div key={type} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <IconComp className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-600 truncate">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {isAdmin && (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-5 h-5 text-purple-600" />
                    <p className="font-semibold text-sm text-gray-900">Espace Admin</p>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">Générez des lots de QR physiques, gérez les codes et consultez les logs.</p>
                  <Button size="sm" onClick={openAdmin} className="w-full bg-purple-600 hover:bg-purple-700">
                    Accéder au back-office <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-gray-400">
          <span>© 2025 QR Domotik</span>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500">
            <LogOut className="w-3 h-3 mr-1" /> Se déconnecter
          </Button>
        </div>
      </footer>
    </div>
  );
}
