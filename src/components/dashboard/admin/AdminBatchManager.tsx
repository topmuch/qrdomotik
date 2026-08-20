'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import QRCodeStyling from 'qr-code-styling';
import { jsPDF } from 'jspdf';
import {
  Layers, Eye, Download, Trash2, Loader2, Package,
  Clock, User, Palette, QrCode, Inbox,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  PHYSICAL_QR_STATUS_LABELS, PHYSICAL_QR_STATUS_COLORS,
  type PhysicalQrStatus, type DesignConfig,
} from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────

interface BatchQrCode {
  id: string;
  activationCode: string;
  status: string;
  activatedAt?: string | null;
  activatedByUserId?: string | null;
}

interface BatchItem {
  id: string;
  quantity: number;
  designConfigJson: string;
  createdAt: string;
  _count: { qrCodes: number };
  creator: { fullName: string | null; email: string } | null;
}

interface BatchDetail extends BatchItem {
  qrCodes: BatchQrCode[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function parseDesignConfig(json: string): DesignConfig {
  try {
    return JSON.parse(json);
  } catch {
    return { color: '#000000', dotStyle: 'rounded' };
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
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

export function AdminBatchManager() {
  const { data: session } = useSession();
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Detail dialog
  const [detailBatch, setDetailBatch] = useState<BatchDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // PDF generation
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/qr-batches');
      const data = await res.json();
      if (data.success) {
        setBatches(data.data);
      } else {
        toast.error(data.error || 'Erreur de chargement');
      }
    } catch {
      toast.error('Erreur serveur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) fetchBatches();
  }, [session, fetchBatches]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/batches/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Lot supprimé avec succès');
        setBatches((prev) => prev.filter((b) => b.id !== id));
      } else {
        toast.error(data.error || 'Erreur lors de la suppression');
      }
    } catch {
      toast.error('Erreur serveur');
    } finally {
      setDeleting(null);
    }
  };

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/batches/${id}`);
      const data = await res.json();
      if (data.success) {
        setDetailBatch(data.data);
      } else {
        toast.error(data.error || 'Erreur de chargement');
      }
    } catch {
      toast.error('Erreur serveur');
    } finally {
      setDetailLoading(false);
    }
  };

  const downloadPdf = async (batch: BatchItem) => {
    setGeneratingPdf(true);
    toast.info('Génération du PDF en cours…');

    try {
      // Fetch batch detail for QR codes
      const res = await fetch(`/api/admin/batches/${batch.id}`);
      const data = await res.json();
      if (!data.success) {
        toast.error('Impossible de récupérer les codes du lot');
        return;
      }

      const detail = data.data as BatchDetail;
      const config = parseDesignConfig(batch.designConfigJson);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const cols = batch.quantity <= 10 ? 2 : batch.quantity <= 15 ? 3 : 4;
      const cellW = (pageW - 20) / cols;
      const cellH = 50;
      const qrSize = 28;

      // Title
      pdf.setFontSize(14);
      pdf.setTextColor(30, 30, 30);
      pdf.text('QR Domotik — Lot d\'impression', pageW / 2, 8, { align: 'center' });

      let idx = 0;
      let y = 16;

      while (idx < detail.qrCodes.length) {
        if (y + cellH > pageH - 10) {
          pdf.addPage();
          y = 15;
        }
        for (let col = 0; col < cols && idx < detail.qrCodes.length; col++, idx++) {
          const x = 10 + col * cellW;
          const code = detail.qrCodes[idx];

          // Render QR to temp canvas
          const canvas = document.createElement('canvas');
          const qr = new QRCodeStyling({
            width: 200,
            height: 200,
            data: `https://qrdomotik.com/?activate=${code.activationCode}`,
            dotsOptions: { color: config.color, type: config.dotStyle || 'rounded' },
            backgroundOptions: { color: config.backgroundColor || '#FFFFFF' },
            qrOptions: { errorCorrectionLevel: 'M' },
          });
          qr.append(canvas);
          // Small delay to let QR render
          await new Promise((r) => setTimeout(r, 50));
          const imgData = canvas.toDataURL('image/png');

          const qrX = x + (cellW - qrSize) / 2;
          pdf.addImage(imgData, 'PNG', qrX, y + 2, qrSize, qrSize);

          pdf.setFontSize(7);
          pdf.setTextColor(100, 100, 100);
          pdf.text(code.activationCode, x + cellW / 2, y + qrSize + 7, { align: 'center' });

          pdf.setFontSize(6);
          pdf.setTextColor(180, 180, 180);
          pdf.text('Non activé', x + cellW / 2, y + qrSize + 12, { align: 'center' });
        }
        y += cellH;
      }

      pdf.save(`qr-domotik-lot-${batch.id.slice(0, 8)}.pdf`);
      toast.success('PDF téléchargé avec succès !');
    } catch {
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (!session) return null;

  // Compute active count for a batch (from detail or unknown)
  const getActivatedBadge = (batch: BatchItem) => {
    if (!detailBatch || detailBatch.id !== batch.id) {
      // For the listing, we show the total count
      return (
        <Badge variant="outline" className="text-xs">
          {batch._count.qrCodes} codes
        </Badge>
      );
    }
    const active = detailBatch.qrCodes.filter((q) => q.status === 'active').length;
    const total = detailBatch.qrCodes.length;
    const isActiveAll = active === total && total > 0;
    return (
      <Badge
        variant="outline"
        className={`text-xs ${
          isActiveAll
            ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
            : active > 0
              ? 'border-amber-300 text-amber-700 bg-amber-50'
              : 'border-gray-300 text-gray-600 bg-gray-50'
        }`}
      >
        {active}/{total} activés
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600" />
            Lots générés
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Historique et gestion des lots de QR codes physiques
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchBatches}
          disabled={loading}
          className="gap-1.5"
        >
          Actualiser
        </Button>
      </div>

      {/* Content */}
      <motion.div variants={containerVariants} initial="hidden" animate="show">
        {loading ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : batches.length === 0 ? (
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Inbox className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700">Aucun lot généré</p>
                <p className="text-xs text-gray-400 mt-1">
                  Les lots créés depuis le générateur apparaîtront ici
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-gray-50/80 sticky top-0">
                    <TableRow>
                      <TableHead className="pl-4">Lot ID</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Design</TableHead>
                      <TableHead>Créé par</TableHead>
                      <TableHead>Créé le</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="pr-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch) => {
                      const config = parseDesignConfig(batch.designConfigJson);
                      return (
                        <TableRow key={batch.id}>
                          <TableCell className="pl-4">
                            <code className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                              {batch.id.slice(0, 8)}
                            </code>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium text-gray-900">
                              {batch.quantity}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-5 h-5 rounded border border-gray-200 shadow-sm"
                                style={{ backgroundColor: config.color }}
                              />
                              <span className="text-xs text-gray-500 font-mono">
                                {config.color}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-sm text-gray-700">
                                {batch.creator?.fullName || '—'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {formatShortDate(batch.createdAt)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getActivatedBadge(batch)}
                          </TableCell>
                          <TableCell className="pr-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs gap-1 text-gray-600 hover:text-gray-900"
                                onClick={() => openDetail(batch.id)}
                                disabled={detailLoading}
                              >
                                {detailLoading ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                                Détails
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs gap-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                                onClick={() => downloadPdf(batch)}
                                disabled={generatingPdf}
                              >
                                {generatingPdf ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5" />
                                )}
                                PDF
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs gap-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    disabled={deleting === batch.id}
                                  >
                                    {deleting === batch.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                    Supprimer
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Supprimer ce lot ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Cette action supprimera définitivement le lot
                                      <code className="mx-1 text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                                        {batch.id.slice(0, 8)}
                                      </code>
                                      et ses {batch._count.qrCodes} QR codes associés. Cette action est irréversible.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700"
                                      onClick={() => handleDelete(batch.id)}
                                    >
                                      Supprimer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </motion.div>
        )}
      </motion.div>

      {/* Detail Dialog */}
      <Dialog open={!!detailBatch} onOpenChange={(open) => !open && setDetailBatch(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          {detailBatch && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  Détails du lot
                  <code className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">
                    {detailBatch.id.slice(0, 8)}
                  </code>
                </DialogTitle>
                <DialogDescription>
                  Créé le {formatDate(detailBatch.createdAt)} par{' '}
                  {detailBatch.creator?.fullName || detailBatch.creator?.email || '—'}
                </DialogDescription>
              </DialogHeader>

              {/* Design Info */}
              <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-3">
                <Palette className="w-4 h-4 text-gray-400" />
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border border-gray-200"
                    style={{ backgroundColor: parseDesignConfig(detailBatch.designConfigJson).color }}
                  />
                  <span className="text-sm text-gray-600">
                    {detailBatch.quantity} codes • Design {parseDesignConfig(detailBatch.designConfigJson).dotStyle}
                  </span>
                </div>
              </div>

              {/* QR Codes List */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">
                  Codes du lot ({detailBatch.qrCodes.length})
                </h4>
                <div className="max-h-64 overflow-y-auto space-y-1.5">
                  {detailBatch.qrCodes.map((qr) => (
                    <div
                      key={qr.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-gray-400" />
                        <code className="text-xs font-mono text-gray-800">
                          {qr.activationCode}
                        </code>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          PHYSICAL_QR_STATUS_COLORS[qr.status as PhysicalQrStatus] || ''
                        }`}
                      >
                        {PHYSICAL_QR_STATUS_LABELS[qr.status as PhysicalQrStatus] || qr.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
