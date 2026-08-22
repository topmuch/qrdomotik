'use client';

import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, QrCode, Layers, Settings, LogOut, ShieldCheck,
  Home, ScanLine, BarChart3, Users, Activity, ChevronLeft,
  ChevronRight, Menu, Zap, DoorOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStore, type DashboardPage } from '@/store/dashboard-store';

// ─── Lazy-loaded pages (avoid heavy upfront compilation) ────────────────

const AdminOverview = dynamic(
  () => import('@/components/dashboard/admin/AdminOverview').then(m => ({ default: m.AdminOverview })),
  { loading: () => <PageSkeleton />, ssr: false }
);
const AdminBatchGenerator = dynamic(
  () => import('@/components/dashboard/admin/AdminBatchGenerator').then(m => ({ default: m.AdminBatchGenerator })),
  { loading: () => <PageSkeleton />, ssr: false }
);
const AdminBatchManager = dynamic(
  () => import('@/components/dashboard/admin/AdminBatchManager').then(m => ({ default: m.AdminBatchManager })),
  { loading: () => <PageSkeleton />, ssr: false }
);
const AdminQrManager = dynamic(
  () => import('@/components/dashboard/admin/AdminQrManager').then(m => ({ default: m.AdminQrManager })),
  { loading: () => <PageSkeleton />, ssr: false }
);
const AdminUsers = dynamic(
  () => import('@/components/dashboard/admin/AdminUsers').then(m => ({ default: m.AdminUsers })),
  { loading: () => <PageSkeleton />, ssr: false }
);

const ClientOverview = dynamic(
  () => import('@/components/dashboard/client/ClientOverview').then(m => ({ default: m.ClientOverview })),
  { loading: () => <PageSkeleton />, ssr: false }
);
const ClientPhysicalQr = dynamic(
  () => import('@/components/dashboard/client/ClientPhysicalQr').then(m => ({ default: m.ClientPhysicalQr })),
  { loading: () => <PageSkeleton />, ssr: false }
);
const ClientHomes = dynamic(
  () => import('@/components/dashboard/client/ClientHomes').then(m => ({ default: m.ClientHomes })),
  { loading: () => <PageSkeleton />, ssr: false }
);
const ClientRooms = dynamic(
  () => import('@/components/dashboard/client/ClientRooms').then(m => ({ default: m.ClientRooms })),
  { loading: () => <PageSkeleton />, ssr: false }
);
const ClientActivity = dynamic(
  () => import('@/components/dashboard/client/ClientActivity').then(m => ({ default: m.ClientActivity })),
  { loading: () => <PageSkeleton />, ssr: false }
);
const ClientSettings = dynamic(
  () => import('@/components/dashboard/client/ClientSettings').then(m => ({ default: m.ClientSettings })),
  { loading: () => <PageSkeleton />, ssr: false }
);

// ─── Placeholder pages ────────────────────────────────────────────────────

function ClientQrCodes() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <QrCode className="w-5 h-5 text-emerald-600" />
          QR Codes Dynamiques
        </h2>
        <p className="text-sm text-gray-500 mt-1">Créez et gérez vos QR codes numériques</p>
      </div>
      <div className="text-center py-16">
        <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Bientôt disponible</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          La gestion des QR codes dynamiques sera disponible dans la prochaine version.
        </p>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}

// ─── Nav Items ────────────────────────────────────────────────────────────

interface NavItem {
  id: DashboardPage;
  label: string;
  icon: React.ElementType;
  section?: 'main' | 'manage' | 'system';
}

const ADMIN_NAV: NavItem[] = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard, section: 'main' },
  { id: 'generate-batch', label: 'Générer un lot', icon: QrCode, section: 'main' },
  { id: 'manage-batches', label: 'Gestion des lots', icon: Layers, section: 'manage' },
  { id: 'manage-qr', label: 'QR Codes individuels', icon: ScanLine, section: 'manage' },
  { id: 'users', label: 'Utilisateurs', icon: Users, section: 'system' },
  { id: 'stats', label: 'Statistiques', icon: BarChart3, section: 'system' },
];

const CLIENT_NAV: NavItem[] = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard, section: 'main' },
  { id: 'physical-qr', label: 'QR Physiques', icon: ScanLine, section: 'main' },
  { id: 'qr-codes', label: 'QR Codes dynamiques', icon: QrCode, section: 'main' },
  { id: 'homes', label: 'Mes Maisons', icon: Home, section: 'manage' },
  { id: 'rooms', label: 'Pièces', icon: DoorOpen, section: 'manage' },
  { id: 'activity', label: 'Journal d\'activité', icon: Activity, section: 'system' },
  { id: 'settings', label: 'Paramètres', icon: Settings, section: 'system' },
];

const SECTION_LABELS: Record<string, string> = {
  main: 'Principal',
  manage: 'Gestion',
  system: 'Système',
};

// ─── Page Renderers ───────────────────────────────────────────────────────

function AdminPageRenderer({ page }: { page: DashboardPage }) {
  switch (page) {
    case 'overview': return <AdminOverview />;
    case 'generate-batch': return <AdminBatchGenerator />;
    case 'manage-batches': return <AdminBatchManager />;
    case 'manage-qr': return <AdminQrManager />;
    case 'users': return <AdminUsers />;
    case 'stats': return <AdminOverview />;
    default: return <AdminOverview />;
  }
}

function ClientPageRenderer({ page }: { page: DashboardPage }) {
  switch (page) {
    case 'overview': return <ClientOverview />;
    case 'physical-qr': return <ClientPhysicalQr />;
    case 'qr-codes': return <ClientQrCodes />;
    case 'homes': return <ClientHomes />;
    case 'rooms': return <ClientRooms />;
    case 'activity': return <ClientActivity />;
    case 'settings': return <ClientSettings />;
    default: return <ClientOverview />;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────

export function DashboardLayout() {
  const { data: session } = useSession();
  const user = session?.user;
  const isAdmin = (session?.user as Record<string, unknown>)?.role === 'superadmin';
  const { activePage, sidebarOpen, setActivePage, toggleSidebar } = useDashboardStore();

  const navItems = isAdmin ? ADMIN_NAV : CLIENT_NAV;
  const firstName = user?.name?.split(' ')[0] || 'Utilisateur';
  const currentPageLabel = navItems.find((n) => n.id === activePage)?.label || 'Vue d\'ensemble';

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/';
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen flex bg-gray-50/50">
        {/* ─── Sidebar ──────────────────────────────────────────────────── */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r shadow-sm transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-[68px]'}`}
        >
          {/* Logo */}
          <div className="h-16 flex items-center gap-2.5 px-4 border-b shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-bold text-gray-900 text-lg truncate"
              >
                QR Domotik
              </motion.span>
            )}
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-3">
            <nav className="space-y-1 px-3">
              {['main', 'manage', 'system'].map((section) => {
                const items = navItems.filter((n) => n.section === section);
                if (items.length === 0) return null;
                return (
                  <div key={section} className="mb-3">
                    {sidebarOpen && (
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-3 mb-1.5">
                        {SECTION_LABELS[section]}
                      </p>
                    )}
                    {items.map((item) => {
                      const isActive = activePage === item.id;
                      const Icon = item.icon;
                      return sidebarOpen ? (
                        <button
                          key={item.id}
                          onClick={() => setActivePage(item.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                          <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </button>
                      ) : (
                        <Tooltip key={item.id}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setActivePage(item.id)}
                              className={`w-full flex items-center justify-center p-2.5 rounded-lg transition-all ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
                            >
                              <Icon className="w-5 h-5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="text-xs font-medium">
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Sidebar footer */}
          <div className="border-t p-3 space-y-1">
            {sidebarOpen ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
              >
                <LogOut className="w-4.5 h-4.5" />
                Se déconnecter
              </button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center p-2.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs font-medium">Se déconnecter</TooltipContent>
              </Tooltip>
            )}
          </div>
        </aside>

        {/* ─── Main Area ────────────────────────────────────────────────── */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-[68px]'}`}>
          {/* Top bar */}
          <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-9 w-9 -ml-2">
                {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
              <h1 className="text-base font-semibold text-gray-900">{currentPageLabel}</h1>
            </div>

            <div className="flex items-center gap-3">
              {isAdmin && (
                <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-600 border-purple-200 gap-1">
                  <ShieldCheck className="w-3 h-3" /> Superadmin
                </Badge>
              )}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
                  {firstName[0]?.toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 leading-tight">{user?.name || 'Utilisateur'}</p>
                  <p className="text-[11px] text-gray-500 leading-tight truncate max-w-[160px]">{user?.email}</p>
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                {isAdmin ? <AdminPageRenderer page={activePage} /> : <ClientPageRenderer page={activePage} />}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Footer */}
          <footer className="border-t bg-white py-3 px-6 flex items-center justify-between text-xs text-gray-400">
            <span>&copy; 2025 QR Domotik &mdash; v1.0</span>
            <span className="hidden sm:inline">{isAdmin ? 'Espace Superadmin' : 'Mon espace'}</span>
          </footer>
        </div>
      </div>
    </TooltipProvider>
  );
}
