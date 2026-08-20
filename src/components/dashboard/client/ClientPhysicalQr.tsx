'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanLine, CheckCircle, XCircle, AlertCircle, Loader2, Trash2,
  Wifi, ExternalLink, BookOpen, StickyNote, ShoppingBag, DoorOpen,
  Pill, Zap, Package, MessageSquare, KeyRound, UtensilsCrossed, Siren, MapPin, QrCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { QR_TYPE_LABELS, PHYSICAL_QR_STATUS_LABELS, PHYSICAL_QR_STATUS_COLORS, type QrType } from '@/types';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────

interface HomeData { id: string; name: string; }
interface RoomData { id: string; name: string; }

interface LookupResult {
  status: 'inactive' | 'active' | 'lost' | 'cancelled';
  activationCode: string;
  activatedByName: string | null;
  activatedAt: string | null;
}

type LookupStatus = 'idle' | 'loading' | 'not_found' | 'already_activated' | 'available';

interface ActivatedCode {
  id: string;
  activationCode: string;
  status: string;
  activatedAt: string | null;
  dynamicQrCode: {
    id: string;
    name: string;
    type: string;
    publicSlug: string;
    room: { name: string } | null;
  } | null;
}

// ─── Animation ────────────────────────────────────────────────────────────

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

// ─── Component ────────────────────────────────────────────────────────────

export function ClientPhysicalQr() {
  const [tab, setTab] = useState('activate');
  const [myCodes, setMyCodes] = useState<ActivatedCode[]>([]);
  const [codesLoading, setCodesLoading] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<ActivatedCode | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const fetchMyCodes = useCallback(async () => {
    setCodesLoading(true);
    try {
      const res = await fetch('/api/physical-qr/my-codes');
      const data = await res.json();
      if (data.success) {
        setMyCodes(Array.isArray(data.data) ? data.data : []);
      }
    } catch {
      /* silent */
    } finally {
      setCodesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyCodes();
  }, [fetchMyCodes]);

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      const res = await fetch('/api/physical-qr/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activationCode: deactivateTarget.activationCode }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('QR code désactivé');
        setDeactivateTarget(null);
        fetchMyCodes();
      } else {
        toast.error(data.error || 'Erreur lors de la désactivation');
      }
    } catch {
      toast.error('Erreur serveur');
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-emerald-600" />
          QR Physiques
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Activez et gérez vos QR codes physiques.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="activate">Activer un QR</TabsTrigger>
            <TabsTrigger value="batch">Activer un lot</TabsTrigger>
            <TabsTrigger value="my-codes">
              Mes QR Activés {myCodes.length > 0 && `(${myCodes.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activate" className="mt-6">
            <ActivateSingleTab onActivated={fetchMyCodes} />
          </TabsContent>

          <TabsContent value="batch" className="mt-6">
            <BatchActivateTab onActivated={fetchMyCodes} />
          </TabsContent>

          <TabsContent value="my-codes" className="mt-6">
            <MyCodesTab
              codes={myCodes}
              loading={codesLoading}
              onDeactivate={setDeactivateTarget}
            />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Deactivate confirmation dialog */}
      <AlertDialog open={!!deactivateTarget} onOpenChange={(open) => !open && setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Désactiver ce QR physique ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le code <span className="font-mono font-semibold">{deactivateTarget?.activationCode}</span> sera désactivé.
              Le QR dynamique associé sera supprimé. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivating}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={deactivating}
              className="bg-red-600 hover:bg-red-700"
            >
              {deactivating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Désactiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Tab 1: Activate Single ──────────────────────────────────────────────

function ActivateSingleTab({ onActivated }: { onActivated: () => void }) {
  const [code, setCode] = useState('');
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle');
  const [lookupData, setLookupData] = useState<LookupResult | null>(null);
  const [homes, setHomes] = useState<HomeData[]>([]);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [selectedHome, setSelectedHome] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<QrType>('wifi');
  const [activating, setActivating] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch homes on mount
  useEffect(() => {
    fetch('/api/homes')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setHomes(data.data);
      })
      .catch(() => {});
  }, []);

  // Fetch rooms when home changes
  useEffect(() => {
    setSelectedRoom('');
    setRooms([]);
    if (!selectedHome) return;
    fetch(`/api/rooms?homeId=${selectedHome}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setRooms(data.data);
      })
      .catch(() => {});
  }, [selectedHome]);

  // Real-time lookup with debounce
  const handleCodeChange = (value: string) => {
    const cleaned = value.toUpperCase().trim();
    setCode(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLookupStatus('idle');
    setLookupData(null);

    if (cleaned.length < 6) return;

    debounceRef.current = setTimeout(async () => {
      setLookupStatus('loading');
      try {
        const res = await fetch(`/api/physical-qr/lookup?code=${encodeURIComponent(cleaned)}`);
        const data = await res.json();

        if (res.status === 404 || data.status === 'not_found') {
          setLookupStatus('not_found');
        } else if (data.data?.status === 'active') {
          setLookupStatus('already_activated');
          setLookupData(data.data);
        } else if (data.data?.status === 'inactive') {
          setLookupStatus('available');
          setLookupData(data.data);
        } else {
          setLookupStatus('not_found');
        }
      } catch {
        setLookupStatus('not_found');
      }
    }, 400);
  };

  const handleActivate = async () => {
    if (!code.trim() || !selectedHome || !name.trim() || !type) return;
    setActivating(true);
    try {
      const res = await fetch('/api/physical-qr/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activationCode: code.toUpperCase().trim(),
          homeId: selectedHome,
          roomId: selectedRoom || undefined,
          name: name.trim(),
          type,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('QR code activé avec succès !');
        setCode('');
        setLookupStatus('idle');
        setLookupData(null);
        setName('');
        setSelectedHome('');
        setSelectedRoom('');
        onActivated();
      } else {
        toast.error(data.error || "Erreur lors de l'activation");
      }
    } catch {
      toast.error('Erreur serveur');
    } finally {
      setActivating(false);
    }
  };

  const isFormValid = code.trim().length >= 6 && selectedHome && name.trim() && type;

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Activer un QR code physique</CardTitle>
          <CardDescription>
            Saisissez le code d&apos;activation imprimé sur votre QR physique (format QR-XXXXXXXX).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Code input + status */}
          <div className="space-y-2">
            <Label htmlFor="activation-code">Code d&apos;activation</Label>
            <div className="relative">
              <Input
                id="activation-code"
                placeholder="QR-XXXXXXXX"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="font-mono tracking-wider pr-10"
                maxLength={20}
              />
              {lookupStatus === 'loading' && (
                <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              )}
            </div>

            {/* Status indicator */}
            <AnimatePresence mode="wait">
              {lookupStatus === 'not_found' && (
                <motion.div
                  key="not-found"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3"
                >
                  <XCircle className="w-4 h-4 shrink-0" />
                  Code introuvable. Vérifiez et réessayez.
                </motion.div>
              )}
              {lookupStatus === 'already_activated' && (
                <motion.div
                  key="already-active"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg p-3"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p>Ce code est déjà activé.</p>
                    {lookupData?.activatedByName && (
                      <p className="text-xs text-amber-600 mt-0.5">
                        Activé par {lookupData.activatedByName}
                        {lookupData.activatedAt && (
                          <> le {new Date(lookupData.activatedAt).toLocaleDateString('fr-FR')}</>
                        )}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
              {lookupStatus === 'available' && (
                <motion.div
                  key="available"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg p-3"
                >
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  Code disponible — vous pouvez l&apos;activer ci-dessous.
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Activation form - shown only when code is available */}
          <AnimatePresence>
            {lookupStatus === 'available' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Separator className="my-4" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="activate-home">Maison *</Label>
                    <Select value={selectedHome} onValueChange={setSelectedHome}>
                      <SelectTrigger id="activate-home">
                        <SelectValue placeholder="Sélectionnez une maison" />
                      </SelectTrigger>
                      <SelectContent>
                        {homes.length === 0 && (
                          <SelectItem value="_empty" disabled>
                            Aucune maison
                          </SelectItem>
                        )}
                        {homes.map((h) => (
                          <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activate-room">Pièce</Label>
                    <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                      <SelectTrigger id="activate-room">
                        <SelectValue placeholder="Aucune (optionnel)" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.length === 0 && (
                          <SelectItem value="_none" disabled>
                            {selectedHome ? 'Aucune pièce' : 'Sélectionnez d\'abord une maison'}
                          </SelectItem>
                        )}
                        {rooms.map((r) => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activate-name">Nom du QR *</Label>
                    <Input
                      id="activate-name"
                      placeholder="Ex: Wi-Fi Cuisine"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={50}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activate-type">Type de QR *</Label>
                    <Select value={type} onValueChange={(v) => setType(v as QrType)}>
                      <SelectTrigger id="activate-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(QR_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  className="mt-5 bg-emerald-600 hover:bg-emerald-700"
                  disabled={!isFormValid || activating}
                  onClick={handleActivate}
                >
                  {activating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <ScanLine className="w-4 h-4 mr-2" />
                  Activer
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab 2: Batch Activate ────────────────────────────────────────────────

function BatchActivateTab({ onActivated }: { onActivated: () => void }) {
  const [codesText, setCodesText] = useState('');
  const [homes, setHomes] = useState<HomeData[]>([]);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [selectedHome, setSelectedHome] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<QrType>('wifi');
  const [step, setStep] = useState<'input' | 'validating' | 'results'>('input');
  const [validationResults, setValidationResults] = useState<
    { code: string; status: 'valid' | 'invalid' | 'taken'; detail?: string }[]
  >([]);
  const [activating, setActivating] = useState(false);
  const [batchResult, setBatchResult] = useState<{ code: string; success: boolean; error?: string }[]>([]);

  useEffect(() => {
    fetch('/api/homes')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setHomes(data.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSelectedRoom('');
    setRooms([]);
    if (!selectedHome) return;
    fetch(`/api/rooms?homeId=${selectedHome}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setRooms(data.data);
      })
      .catch(() => {});
  }, [selectedHome]);

  const parseCodes = (): string[] => {
    return codesText
      .split(/[\n,]+/)
      .map((c) => c.toUpperCase().trim())
      .filter((c) => c.length > 0);
  };

  const handleValidate = async () => {
    const codes = parseCodes();
    if (codes.length === 0) {
      toast.error('Saisissez au moins un code');
      return;
    }

    setStep('validating');
    const results: typeof validationResults = [];

    for (const code of codes) {
      try {
        const res = await fetch(`/api/physical-qr/lookup?code=${encodeURIComponent(code)}`);
        const data = await res.json();

        if (res.status === 404 || data.status === 'not_found') {
          results.push({ code, status: 'invalid', detail: 'Code introuvable' });
        } else if (data.data?.status === 'inactive') {
          results.push({ code, status: 'valid' });
        } else {
          results.push({ code, status: 'taken', detail: 'Déjà activé' });
        }
      } catch {
        results.push({ code, status: 'invalid', detail: 'Erreur de vérification' });
      }
    }

    setValidationResults(results);
    setStep('results');
  };

  const handleBatchActivate = async () => {
    const validCodes = validationResults.filter((r) => r.status === 'valid').map((r) => r.code);
    if (validCodes.length === 0) {
      toast.error('Aucun code valide à activer');
      return;
    }

    setActivating(true);
    try {
      const res = await fetch('/api/physical-qr/batch-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codes: validCodes,
          homeId: selectedHome,
          roomId: selectedRoom || undefined,
          name: name.trim() || 'QR Lot',
          type,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBatchResult(data.data);
        const successCount = data.data.filter((r: { success: boolean }) => r.success).length;
        toast.success(`${successCount}/${validCodes.length} codes activés`);
        onActivated();
      } else {
        toast.error(data.error || 'Erreur lors de l\'activation');
      }
    } catch {
      toast.error('Erreur serveur');
    } finally {
      setActivating(false);
    }
  };

  const validCount = validationResults.filter((r) => r.status === 'valid').length;
  const isFormValid = parseCodes().length > 0 && selectedHome && type;

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Activer un lot de QR codes</CardTitle>
          <CardDescription>
            Collez vos codes d&apos;activation (un par ligne ou séparés par des virgules).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="batch-codes">Codes d&apos;activation</Label>
            <Textarea
              id="batch-codes"
              placeholder={"QR-AABBCCDD\nQR-EEFFGGHH\nQR-IIJJKKLL"}
              value={codesText}
              onChange={(e) => setCodesText(e.target.value)}
              className="font-mono text-sm min-h-[120px]"
              disabled={step === 'validating' || step === 'results'}
            />
            <p className="text-xs text-gray-400">
              {parseCodes().length} code{parseCodes().length > 1 ? 's' : ''} détecté{parseCodes().length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Maison *</Label>
              <Select value={selectedHome} onValueChange={setSelectedHome}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une maison" />
                </SelectTrigger>
                <SelectContent>
                  {homes.map((h) => (
                    <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pièce</Label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="Aucune (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nom de base</Label>
              <Input
                placeholder="Ex: QR Lot Cuisine"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label>Type de QR *</Label>
              <Select value={type} onValueChange={(v) => setType(v as QrType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(QR_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {step === 'input' && (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!isFormValid}
              onClick={handleValidate}
            >
              Valider les codes
            </Button>
          )}

          {step === 'validating' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Validation en cours...
              </div>
              <Progress value={50} className="h-2" />
            </div>
          )}

          {step === 'results' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                {validCount} code{validCount > 1 ? 's' : ''} valide{validCount > 1 ? 's' : ''} sur {validationResults.length}
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-lg border p-3 bg-gray-50">
                {validationResults.map((r) => (
                  <div key={r.code} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-xs">{r.code}</span>
                    <Badge
                      variant="outline"
                      className={
                        r.status === 'valid'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]'
                          : r.status === 'taken'
                            ? 'bg-amber-100 text-amber-700 border-amber-200 text-[10px]'
                            : 'bg-red-100 text-red-700 border-red-200 text-[10px]'
                      }
                    >
                      {r.status === 'valid' ? 'Disponible' : r.status === 'taken' ? 'Pris' : r.detail}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => { setStep('input'); setValidationResults([]); setBatchResult([]); }}
                >
                  Modifier
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={validCount === 0 || activating}
                  onClick={handleBatchActivate}
                >
                  {activating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Activer {validCount} code{validCount > 1 ? 's' : ''}
                </Button>
              </div>

              {/* Batch results */}
              {batchResult.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Separator />\n                  <p className="text-sm font-medium">Résultats :</p>
                  <div className="space-y-1">
                    {batchResult.map((r) => (
                      <div key={r.code} className="flex items-center justify-between text-sm">
                        <span className="font-mono text-xs">{r.code}</span>
                        {r.success ? (
                          <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Activé</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 text-[10px]">{r.error}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab 3: My Activated Codes ───────────────────────────────────────────

function MyCodesTab({
  codes,
  loading,
  onDeactivate,
}: {
  codes: ActivatedCode[];
  loading: boolean;
  onDeactivate: (code: ActivatedCode) => void;
}) {
  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (codes.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12 text-center">
          <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucun QR physique activé</p>
          <p className="text-xs text-gray-400 mt-1">
            Utilisez l&apos;onglet &quot;Activer un QR&quot; pour commencer.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Code</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Pièce / Nom</TableHead>
                <TableHead className="text-xs">Statut</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell className="font-mono text-xs font-medium">{code.activationCode}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {QR_TYPE_LABELS[code.dynamicQrCode?.type as QrType] || code.dynamicQrCode?.type || '—'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>
                      <p className="font-medium text-gray-900 text-xs">{code.dynamicQrCode?.name || '—'}</p>
                      {code.dynamicQrCode?.room && (
                        <p className="text-[10px] text-gray-400">{code.dynamicQrCode.room.name}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={PHYSICAL_QR_STATUS_COLORS[code.status as keyof typeof PHYSICAL_QR_STATUS_COLORS] || ''}>
                      {PHYSICAL_QR_STATUS_LABELS[code.status as keyof typeof PHYSICAL_QR_STATUS_LABELS] || code.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {code.activatedAt
                      ? new Date(code.activatedAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                      onClick={() => onDeactivate(code)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
