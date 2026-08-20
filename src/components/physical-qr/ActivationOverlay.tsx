'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { QrCode, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth-store';
import { QR_TYPE_LABELS, type QrType } from '@/types';

const ACTIVATABLE_TYPES: QrType[] = ['wifi', 'link', 'info', 'postit', 'shopping_list', 'doorman', 'medication', 'chores', 'guestbook', 'daily_menu', 'keys_tracker'];

export function ActivationOverlay() {
  const searchParams = useSearchParams();
  const activateCode = searchParams.get('activate');
  const { data: session } = useSession();
  const { openAuth } = useAuthStore();

  const [codeStatus, setCodeStatus] = useState<'loading' | 'not_found' | 'inactive' | 'active' | 'lost' | 'cancelled'>('loading');
  const [codeData, setCodeData] = useState<{ activationCode: string; activatedByName?: string } | null>(null);
  const [type, setType] = useState<QrType>('wifi');
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [homeId, setHomeId] = useState('');
  const [homes, setHomes] = useState<{ id: string; name: string }[]>([]);
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);
  const [activating, setActivating] = useState(false);

  // Fetch code status
  useEffect(() => {
    if (!activateCode) return;
    setCodeStatus('loading');
    fetch(`/api/physical-qr/lookup?code=${activateCode}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error?.status === 'not_found') { setCodeStatus('not_found'); return; }
        if (data.data) {
          setCodeStatus(data.data.status);
          setCodeData(data.data);
        }
      })
      .catch(() => setCodeStatus('not_found'));
  }, [activateCode]);

  // Fetch user homes
  useEffect(() => {
    if (!session?.user?.id) return;
    fetch('/api/homes')
      .then((r) => r.json())
      .then((data) => { if (data.success) { setHomes(data.data.map((h: { id: string; name: string }) => ({ id: h.id, name: h.name }))); if (data.data[0]?.id) setHomeId(data.data[0].id); } })
      .catch(() => {});
  }, [session?.user?.id]);

  // Fetch rooms for selected home
  useEffect(() => {
    if (!homeId) return;
    fetch(`/api/rooms?homeId=${homeId}`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setRooms(data.data.map((r: { id: string; name: string }) => ({ id: r.id, name: r.name }))); })
      .catch(() => {});
  }, [homeId]);

  const handleActivate = useCallback(async () => {
    if (!name.trim()) { toast.error('Donnez un nom au QR code'); return; }
    if (!homeId) { toast.error('Sélectionnez une maison'); return; }
    setActivating(true);
    try {
      const res = await fetch('/api/physical-qr/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activationCode: activateCode, type, name, homeId, roomId: roomId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success('QR code activé avec succès !');
      setCodeStatus('active');
      setCodeData({ activationCode: activateCode! });
    } catch { toast.error('Erreur serveur'); }
    finally { setActivating(false); }
  }, [activateCode, type, name, homeId, roomId]);

  if (!activateCode) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 shadow-lg mb-4">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">QR Domotik</h1>
            <p className="text-gray-500 mt-1">Activation du code : <span className="font-mono font-semibold text-gray-700">{activateCode}</span></p>
          </div>

          {/* Loading */}
          {codeStatus === 'loading' && (
            <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /><p className="text-gray-400 mt-3">Vérification du code...</p></div>
          )}

          {/* Not found */}
          {codeStatus === 'not_found' && (
            <div className="text-center py-12 p-6 bg-red-50 rounded-2xl border border-red-100">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-red-800">Code invalide</h2>
              <p className="text-red-600 mt-1 text-sm">Ce code n'existe pas. Vérifiez et réessayez.</p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/'}>Retour à l'accueil</Button>
            </div>
          )}

          {/* Lost or cancelled */}
          {(codeStatus === 'lost' || codeStatus === 'cancelled') && (
            <div className="text-center py-12 p-6 bg-amber-50 rounded-2xl border border-amber-100">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-amber-800">Code non disponible</h2>
              <p className="text-amber-700 mt-1 text-sm">Ce code n'est plus valable. Contactez le support.</p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/'}>Retour à l'accueil</Button>
            </div>
          )}

          {/* Already active */}
          {codeStatus === 'active' && (
            <div className="text-center py-12 p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-emerald-800">Code déjà activé</h2>
              <p className="text-emerald-700 mt-1 text-sm">{codeData?.activatedByName ? `Activé par ${codeData.activatedByName}` : 'Ce code a déjà été activé.'}</p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/'}>Retour à l'accueil</Button>
            </div>
          )}

          {/* Inactive — Activation form */}
          {codeStatus === 'inactive' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Activez votre QR Code</h2>
                <p className="text-gray-500 text-sm mt-1">Choisissez le type de module à associer.</p>
              </div>

              {!session && (
                <div className="text-center py-4 bg-blue-50 rounded-xl">
                  <p className="text-blue-800 font-medium">Connectez-vous pour activer ce code</p>
                  <Button onClick={() => openAuth('login')} className="mt-3 bg-blue-600 hover:bg-blue-700">
                    Se connecter ou créer un compte <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}

              {session && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Maison</Label>
                    <select value={homeId} onChange={(e) => setHomeId(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white">
                      {homes.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                  </div>

                  {rooms.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Pièce (optionnel)</Label>
                      <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white">
                        <option value="">— Aucune —</option>
                        {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Type de module</Label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {ACTIVATABLE_TYPES.map((t) => (
                        <button key={t} type="button" onClick={() => { setType(t); setName(QR_TYPE_LABELS[t]); }}
                          className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all text-left ${type === t ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                          {QR_TYPE_LABELS[t]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Nom du QR code</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Wi-Fi Invités" />
                  </div>

                  <Button onClick={handleActivate} disabled={activating} className="w-full bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 text-white">
                    {activating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Activer maintenant
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
