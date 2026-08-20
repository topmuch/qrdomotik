'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { QrCode, Plus, Power, RefreshCw, Tag, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PHYSICAL_QR_STATUS_LABELS, PHYSICAL_QR_STATUS_COLORS, QR_TYPE_LABELS } from '@/types';
import type { QrType } from '@/types';

interface MyQr {
  id: string;
  activationCode: string;
  status: string;
  activatedAt: string;
  dynamicQrCode: { id: string; name: string; type: string; publicSlug: string; room: { name: string } | null } | null;
}

export function UserPhysicalQrPanel() {
  const { data: session } = useSession();
  const [myCodes, setMyCodes] = useState<MyQr[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [batchCodes, setBatchCodes] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [tab, setTab] = useState('single');

  const fetchMyCodes = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const res = await fetch('/api/physical-qr/my-codes');
      const data = await res.json();
      if (data.success) setMyCodes(data.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [session?.user?.id]);

  useEffect(() => { fetchMyCodes(); }, [fetchMyCodes]);

  const handleManualActivate = async () => {
    const code = manualCode.toUpperCase().trim();
    if (!code.startsWith('QR-')) { toast.error('Format invalide (QR-XXXXXXXX)'); return; }
    setManualLoading(true);
    window.location.href = `/?activate=${code}`;
    setManualLoading(false);
  };

  const handleBatchActivate = async () => {
    const codes = batchCodes.split(/[\n,]+/).map((c) => c.trim().toUpperCase()).filter(Boolean);
    if (codes.length === 0) { toast.error('Entrez au moins un code'); return; }
    setBatchLoading(true);
    try {
      const res = await fetch('/api/physical-qr/batch-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes, homeId: myCodes[0]?.dynamicQrCode?.id ? '' : '', type: 'link' }),
      });
      const data = await res.json();
      if (data.success) { toast.success(data.message); fetchMyCodes(); setBatchCodes(''); }
      else toast.error(data.error);
    } catch { toast.error('Erreur serveur'); }
    finally { setBatchLoading(false); }
  };

  const handleDeactivate = async (code: string) => {
    if (!confirm(`Désactiver ${code} ? Il pourra être réactivé par n'importe qui.`)) return;
    try {
      const res = await fetch('/api/physical-qr/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activationCode: code }),
      });
      const data = await res.json();
      if (data.success) { toast.success('Code désactivé'); fetchMyCodes(); }
      else toast.error(data.error);
    } catch { toast.error('Erreur serveur'); }
  };

  if (!session) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <QrCode className="w-5 h-5 text-blue-600" />
        Mes QR Codes Physiques
      </h2>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single" className="text-xs"><Plus className="w-3.5 h-3.5 mr-1" /> Activer</TabsTrigger>
          <TabsTrigger value="batch" className="text-xs"><ListChecks className="w-3.5 h-3.5 mr-1" /> Par lot</TabsTrigger>
          <TabsTrigger value="list" className="text-xs"><Tag className="w-3.5 h-3.5 mr-1" /> Mes codes</TabsTrigger>
        </TabsList>

        {/* Activation manuelle */}
        <TabsContent value="single" className="space-y-3">
          <p className="text-sm text-gray-500">Scannez un QR physique ou entrez le code manuellement.</p>
          <div className="flex gap-2">
            <Input placeholder="QR-A7K9M2P3" value={manualCode} onChange={(e) => setManualCode(e.target.value)} className="font-mono" />
            <Button onClick={handleManualActivate} disabled={manualLoading || !manualCode.trim()}>
              {manualLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
              <span className="ml-1">Activer</span>
            </Button>
          </div>
        </TabsContent>

        {/* Activation par lot */}
        <TabsContent value="batch" className="space-y-3">
          <p className="text-sm text-gray-500">Collez plusieurs codes séparés par des virgules ou retours à la ligne.</p>
          <textarea value={batchCodes} onChange={(e) => setBatchCodes(e.target.value)} placeholder={"QR-A1B2C3D4\nQR-E5F6G7H8\nQR-I9J0K1L2"}
            className="w-full h-32 rounded-xl border border-gray-200 p-3 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
          <Button onClick={handleBatchActivate} disabled={batchLoading || !batchCodes.trim()}>
            {batchLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
            Activer le lot ({batchCodes.split(/[\n,]+/).filter(Boolean).length} codes)
          </Button>
        </TabsContent>

        {/* Mes codes activés */}
        <TabsContent value="list">
          {loading ? (
            <div className="text-center py-8"><RefreshCw className="w-5 h-5 animate-spin mx-auto text-gray-400" /></div>
          ) : myCodes.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Aucun QR physique activé</div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {myCodes.map((qr) => (
                <div key={qr.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-medium truncate">{qr.activationCode}</p>
                    <p className="text-xs text-gray-500">{qr.dynamicQrCode ? `${QR_TYPE_LABELS[qr.dynamicQrCode.type as keyof typeof QR_TYPE_LABELS] || qr.dynamicQrCode.type} — ${qr.dynamicQrCode.name}` : '—'}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2 text-xs" onClick={() => handleDeactivate(qr.activationCode)}>
                    Désactiver
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
