'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Search, AlertTriangle, XCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PHYSICAL_QR_STATUS_LABELS, PHYSICAL_QR_STATUS_COLORS } from '@/types';

type CodeStatus = 'inactive' | 'active' | 'lost' | 'cancelled';

interface PhysicalQr {
  id: string;
  activationCode: string;
  status: CodeStatus;
  activatedAt: string | null;
  activatedBy: { fullName: string; email: string } | null;
  batch: { id: string; quantity: number; createdAt: string };
}

export function PhysicalQrManager() {
  const { data: session } = useSession();
  const [codes, setCodes] = useState<PhysicalQr[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/physical-qr-codes?${params}`);
      const data = await res.json();
      if (data.success) {
        setCodes(data.data);
        setTotalPages(data.totalPages);
      }
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  }, [search, statusFilter, page]);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const handleAction = async (codeId: string, status: 'lost' | 'cancelled') => {
    setActionLoading(codeId);
    try {
      const res = await fetch('/api/admin/physical-qr-codes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeId, status }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(`Code ${status === 'lost' ? 'marqué perdu' : 'annulé'}`);
      fetchCodes();
    } catch { toast.error('Erreur serveur'); }
    finally { setActionLoading(null); }
  };

  if (!session) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Gestion des QR Codes Physiques</h2>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Rechercher un code (ex: QR-A7K9)" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <div className="flex gap-1.5">
          {[{ v: '', l: 'Tous' }, { v: 'inactive', l: 'Inactif' }, { v: 'active', l: 'Actif' }, { v: 'lost', l: 'Perdu' }, { v: 'cancelled', l: 'Annulé' }].map((s) => (
            <button key={s.v} onClick={() => { setStatusFilter(s.v); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${statusFilter === s.v ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {s.l}
            </button>
          ))}
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Activé par</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400"><RefreshCw className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : codes.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Aucun code trouvé</td></tr>
              ) : codes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-sm font-medium">{c.activationCode}</td>
                  <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${PHYSICAL_QR_STATUS_COLORS[c.status]}`}>{PHYSICAL_QR_STATUS_LABELS[c.status]}</span></td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{c.activatedBy?.fullName || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{c.activatedAt ? new Date(c.activatedAt).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {c.status === 'inactive' || c.status === 'active' ? (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleAction(c.id, 'lost')} disabled={actionLoading === c.id}
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-7 px-2">
                          <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Perdu
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleAction(c.id, 'cancelled')} disabled={actionLoading === c.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2">
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Annuler
                        </Button>
                      </div>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-sm text-gray-600">Page {page}/{totalPages}</span>
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      )}
    </div>
  );
}
