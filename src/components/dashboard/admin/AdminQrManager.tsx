'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  QrCode, Search, AlertTriangle, XCircle, RotateCcw,
  Loader2, ChevronLeft, ChevronRight, Inbox, Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  PHYSICAL_QR_STATUS_LABELS,
  PHYSICAL_QR_STATUS_COLORS,
  type PhysicalQrStatus,
} from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────

interface QrCodeItem {
  id: string;
  activationCode: string;
  status: string;
  activatedAt?: string | null;
  activatedBy?: { id: string; fullName: string | null; email: string } | null;
  batch?: { id: string; quantity: number; createdAt: string } | null;
}

type FilterStatus = 'all' | PhysicalQrStatus;

const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'inactive', label: 'Inactif' },
  { value: 'active', label: 'Actif' },
  { value: 'lost', label: 'Perdu' },
  { value: 'cancelled', label: 'Annulé' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ─── Animation ───────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

// ─── Component ────────────────────────────────────────────────────────────

export function AdminQrManager() {
  const { data: session } = useSession();

  // Data
  const [codes, setCodes] = useState<QrCodeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [page, setPage] = useState(1);

  // UI
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const pageSize = 20;

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      params.set('page', String(page));

      const res = await fetch(`/api/admin/physical-qr-codes?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCodes(data.data);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } else {
        toast.error(data.error || 'Erreur de chargement');
      }
    } catch {
      toast.error('Erreur serveur');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    if (session) fetchCodes();
  }, [session, fetchCodes]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleMarkLost = async (codeId: string) => {
    setActionLoading(codeId);
    try {
      const res = await fetch('/api/admin/physical-qr-codes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeId, status: 'lost' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Code marqué comme perdu');
        fetchCodes();
      } else {
        toast.error(data.error || 'Erreur');
      }
    } catch {
      toast.error('Erreur serveur');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (codeId: string) => {
    setActionLoading(codeId);
    try {
      const res = await fetch('/api/admin/physical-qr-codes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeId, status: 'cancelled' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Code annulé');
        fetchCodes();
      } else {
        toast.error(data.error || 'Erreur');
      }
    } catch {
      toast.error('Erreur serveur');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReset = async (codeId: string) => {
    setActionLoading(codeId);
    try {
      const res = await fetch('/api/admin/reset-qr', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Code réinitialisé avec succès');
        fetchCodes();
      } else {
        toast.error(data.error || 'Erreur');
      }
    } catch {
      toast.error('Erreur serveur');
    } finally {
      setActionLoading(null);
    }
  };

  if (!session) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <QrCode className="w-5 h-5 text-emerald-600" />
          QR Codes Physiques
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Gestion individuelle des codes d&apos;activation
        </p>
      </div>

      {/* Filters */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Search */}
        <motion.div className="relative flex-1" variants={itemVariants}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher un code (ex: QR-A7K9…)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </motion.div>

        {/* Status Filters */}
        <motion.div className="flex items-center gap-1.5 flex-wrap" variants={itemVariants}>
          <Filter className="w-4 h-4 text-gray-400 mr-1 hidden sm:block" />
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                statusFilter === f.value
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </motion.div>
      </motion.div>

      {/* Results Info */}
      {!loading && total > 0 && (
        <p className="text-xs text-gray-400">
          {total} code{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''} • Page {page} sur {totalPages}
        </p>
      )}

      {/* Table */}
      <motion.div variants={containerVariants} initial="hidden" animate="show">
        {loading ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : codes.length === 0 ? (
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Inbox className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700">Aucun code trouvé</p>
                <p className="text-xs text-gray-400 mt-1">
                  {search || statusFilter !== 'all'
                    ? 'Essayez de modifier vos filtres'
                    : 'Aucun QR code physique n\'a été créé'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50/80 sticky top-0">
                    <TableRow>
                      <TableHead className="pl-4">Code</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Activé par</TableHead>
                      <TableHead>Date activation</TableHead>
                      <TableHead className="pr-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {codes.map((qr) => {
                      const status = qr.status as PhysicalQrStatus;
                      const isActionable = actionLoading === qr.id;
                      const canAct = !isActionable && status !== 'cancelled';

                      return (
                        <TableRow key={qr.id}>
                          <TableCell className="pl-4">
                            <code className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-800">
                              {qr.activationCode}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${PHYSICAL_QR_STATUS_COLORS[status] || ''}`}
                            >
                              {PHYSICAL_QR_STATUS_LABELS[status] || status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-700">
                              {qr.activatedBy?.fullName || '—'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-500">
                              {formatDateTime(qr.activatedAt)}
                            </span>
                          </TableCell>
                          <TableCell className="pr-4">
                            <div className="flex items-center justify-end gap-1">
                              {/* Marquer perdu */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs gap-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                                disabled={!canAct || status === 'lost'}
                                onClick={() => handleMarkLost(qr.id)}
                              >
                                {isActionable ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                )}
                                Perdu
                              </Button>

                              {/* Annuler */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs gap-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                                disabled={!canAct}
                                onClick={() => handleCancel(qr.id)}
                              >
                                {isActionable ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5" />
                                )}
                                Annuler
                              </Button>

                              {/* Réinitialiser */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs gap-1 text-sky-600 hover:text-sky-800 hover:bg-sky-50"
                                disabled={!canAct || status === 'inactive'}
                                onClick={() => handleReset(qr.id)}
                              >
                                {isActionable ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <RotateCcw className="w-3.5 h-3.5" />
                                )}
                                Réinitialiser
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    Affichage {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} sur {total}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Préc.
                    </Button>
                    <span className="text-xs text-gray-600 px-2">{page}/{totalPages}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Suiv.
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
