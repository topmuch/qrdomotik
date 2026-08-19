'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Zap, Clock, Store, Percent, Plus, X, Flame, Navigation, Timer, Eye,
} from 'lucide-react';
import { DEFAULT_MAP_CENTER, FLASH_SALE_PUSH_RADIUS_KM, FLASH_SALE_DURATIONS, FLASH_SALE_DEFAULT_DURATION, PRICING } from '@/lib/constants';

type FlashSale = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  originalPrice: number | null;
  promoPrice: number | null;
  merchantName: string;
  merchantCategory: string | null;
  distanceKm: number;
  distanceText: string;
  discountPct: number;
  remainingSeconds: number;
  totalSeconds: number;
  timeRemaining: string;
  progressPct: number;
  isFlashSale: boolean;
  flashSaleExpiresAt: string | null;
  redemptionsCount: number;
  viewsCount: number;
};

export function FlashSaleView() {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedFlash, setSelectedFlash] = useState<FlashSale | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Create form
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formOriginal, setFormOriginal] = useState('');
  const [formPromo, setFormPromo] = useState('');
  const [formDuration, setFormDuration] = useState(String(FLASH_SALE_DEFAULT_DURATION));

  const fetchFlashSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        latitude: String(DEFAULT_MAP_CENTER.latitude),
        longitude: String(DEFAULT_MAP_CENTER.longitude),
        radiusKm: String(FLASH_SALE_PUSH_RADIUS_KM * 10), // larger radius for flash sales
      });
      const res = await fetch(`/api/flash-sales?${params}`);
      const json = await res.json();
      if (json.success) setFlashSales(json.data);
    } catch {
      toast.error('Erreur chargement ventes flash');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlashSales();
  }, [fetchFlashSales]);

  // Auto-refresh timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setFlashSales((prev) =>
        prev
          .map((fs) => {
            const remaining = Math.max(0, fs.remainingSeconds - 1);
            const total = fs.totalSeconds;
            const progress = total > 0 ? Math.min(100, ((total - remaining) / total) * 100) : 0;
            const h = Math.floor(remaining / 3600);
            const m = Math.floor((remaining % 3600) / 60);
            const s = remaining % 60;
            let timeStr: string;
            if (remaining <= 0) timeStr = 'Terminée';
            else if (h > 0) timeStr = `${h}h ${String(m).padStart(2, '0')}m`;
            else if (m > 0) timeStr = `${m}m ${String(s).padStart(2, '0')}s`;
            else timeStr = `${s}s`;
            return { ...fs, remainingSeconds: remaining, progressPct: progress, timeRemaining: timeStr };
          })
          .filter((fs) => fs.remainingSeconds > 0)
      );
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const createFlashSale = async () => {
    if (!formTitle || !formPromo) {
      toast.error('Titre et prix promo requis');
      return;
    }
    try {
      const res = await fetch('/api/flash-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: 'demo-merchant',
          title: formTitle,
          description: formDesc,
          originalPrice: formOriginal ? parseFloat(formOriginal) : null,
          promoPrice: parseFloat(formPromo),
          durationHours: parseInt(formDuration),
          userId: 'demo-user',
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Vente flash créée !');
        setShowCreate(false);
        setFormTitle('');
        setFormDesc('');
        setFormOriginal('');
        setFormPromo('');
        fetchFlashSales();
      } else {
        toast.error(json.error || 'Erreur création');
      }
    } catch {
      toast.error('Erreur réseau');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Ventes Flash
          </h2>
          <p className="text-sm text-muted-foreground">
            Promotions limitées dans votre quartier
          </p>
        </div>
        <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Lancer une vente flash
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        💡 Frais de lancement : {PRICING.flash_sale_trigger.amount.toFixed(2)}€ par vente flash
      </p>

      {/* Flash Sales List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="animate-pulse border-orange-200"><CardContent className="p-4"><div className="h-24 bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
      ) : flashSales.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Aucune vente flash active</p>
            <p className="text-xs text-muted-foreground mt-1">Lancez-en une pour attirer les clients du quartier !</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {flashSales.map((fs, i) => (
              <motion.div
                key={fs.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`border-orange-200 hover:shadow-lg transition-shadow cursor-pointer overflow-hidden ${
                  fs.remainingSeconds < 300 ? 'animate-pulse border-red-300' : ''
                }`}
                  onClick={() => setSelectedFlash(fs)}
                >
                  <CardContent className="p-0">
                    {/* Urgent bar for last 5 minutes */}
                    {fs.remainingSeconds < 300 && fs.remainingSeconds > 0 && (
                      <div className="bg-red-500 text-white text-center py-1 text-xs font-bold animate-pulse">
                        🔥 DERNIÈRES MINUTES !
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Flame className="h-4 w-4 text-orange-500" />
                            <Badge variant="destructive" className="text-xs">
                              <Zap className="h-3 w-3 mr-0.5" /> Flash
                            </Badge>
                            {fs.discountPct > 0 && (
                              <Badge className="bg-red-100 text-red-700 text-xs">-{fs.discountPct}%</Badge>
                            )}
                          </div>
                          <h3 className="font-bold text-base">{fs.title}</h3>
                          {fs.merchantName && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Store className="h-3.5 w-3.5" /> {fs.merchantName}
                            </p>
                          )}
                          {fs.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{fs.description}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {/* Countdown */}
                          <div className={`font-mono font-bold text-lg ${
                            fs.remainingSeconds < 300 ? 'text-red-600' : 'text-orange-600'
                          }`}>
                            {fs.timeRemaining}
                          </div>
                          <Timer className="h-3.5 w-3.5 mx-auto text-muted-foreground" />
                          {/* Prices */}
                          <div className="mt-2">
                            {fs.originalPrice != null && (
                              <span className="text-xs text-muted-foreground line-through block">
                                {fs.originalPrice.toFixed(2)}€
                              </span>
                            )}
                            {fs.promoPrice != null && (
                              <span className="text-xl font-bold text-emerald-600">
                                {fs.promoPrice.toFixed(2)}€
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-3">
                        <Progress value={fs.progressPct} className="h-1.5" />
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                          <span>{fs.distanceText || 'En ligne'}</span>
                          <span>{fs.viewsCount} vues · {fs.redemptionsCount} utilisations</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Flash Sale Dialog */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-orange-500" />
                    Nouvelle Vente Flash
                  </h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Titre *</Label>
                    <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ex: Pain frais -50%" />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Détails de l'offre..." rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Prix original</Label>
                      <Input type="number" step="0.01" value={formOriginal} onChange={(e) => setFormOriginal(e.target.value)} placeholder="0.00" />
                    </div>
                    <div>
                      <Label>Prix promo *</Label>
                      <Input type="number" step="0.01" value={formPromo} onChange={(e) => setFormPromo(e.target.value)} placeholder="0.00" />
                    </div>
                  </div>
                  <div>
                    <Label>Durée</Label>
                    <Select value={formDuration} onValueChange={setFormDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FLASH_SALE_DURATIONS.map((d) => (
                          <SelectItem key={d} value={String(d)}>{d} heure{d > 1 ? 's' : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-sm text-orange-700">
                    💰 Coût : {PRICING.flash_sale_trigger.amount.toFixed(2)}€ pour lancer la vente flash
                  </div>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={createFlashSale}>
                    <Zap className="h-4 w-4 mr-2" />
                    Lancer la vente flash
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flash Detail Modal */}
      <AnimatePresence>
        {selectedFlash && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setSelectedFlash(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge variant="destructive" className="mb-2"><Zap className="h-3 w-3 mr-1" /> Vente Flash</Badge>
                    <h3 className="font-bold text-xl">{selectedFlash.title}</h3>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedFlash(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {selectedFlash.description && (
                  <p className="text-sm text-muted-foreground mt-2">{selectedFlash.description}</p>
                )}
                <Separator className="my-4" />
                <div className="text-center">
                  <div className={`font-mono font-bold text-3xl ${selectedFlash.remainingSeconds < 300 ? 'text-red-600' : 'text-orange-600'}`}>
                    {selectedFlash.timeRemaining}
                  </div>
                  <Progress value={selectedFlash.progressPct} className="h-2 mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedFlash.remainingSeconds < 300 ? '🔥 Bientôt terminée !' : 'Temps restant'}
                  </p>
                </div>
                <Separator className="my-4" />
                <div className="flex items-end justify-center gap-3">
                  {selectedFlash.originalPrice != null && (
                    <span className="text-2xl text-muted-foreground line-through">
                      {selectedFlash.originalPrice.toFixed(2)}€
                    </span>
                  )}
                  {selectedFlash.promoPrice != null && (
                    <span className="text-4xl font-bold text-emerald-600">
                      {selectedFlash.promoPrice.toFixed(2)}€
                    </span>
                  )}
                  {selectedFlash.discountPct > 0 && (
                    <Badge className="bg-red-100 text-red-700 text-sm px-2">-{selectedFlash.discountPct}%</Badge>
                  )}
                </div>
                {selectedFlash.merchantName && (
                  <p className="text-center text-sm text-muted-foreground mt-3 flex items-center justify-center gap-1">
                    <Store className="h-3.5 w-3.5" /> {selectedFlash.merchantName}
                    {selectedFlash.distanceText && ` · ${selectedFlash.distanceText}`}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
