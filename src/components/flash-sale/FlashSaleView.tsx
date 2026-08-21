'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Card, CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Zap, Store, X, Flame, Timer, Copy, Check, Ticket,
} from 'lucide-react';
import { DEFAULT_MAP_CENTER, FLASH_SALE_PUSH_RADIUS_KM, PRICING } from '@/lib/constants';

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

function formatCountdown(totalSec: number): string {
  if (totalSec <= 0) return 'Expirée';
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function FlashSaleView() {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFlash, setSelectedFlash] = useState<FlashSale | null>(null);
  const [couponMap, setCouponMap] = useState<Record<string, string>>({}); // fs.id -> redemptionId
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [obtainingId, setObtainingId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const fetchFlashSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        latitude: String(DEFAULT_MAP_CENTER.latitude),
        longitude: String(DEFAULT_MAP_CENTER.longitude),
        radiusKm: String(FLASH_SALE_PUSH_RADIUS_KM * 10),
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

  // Auto-refresh timer — keeps expired items, marks them
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setFlashSales((prev) =>
        prev.map((fs) => {
          const remaining = Math.max(0, fs.remainingSeconds - 1);
          const total = fs.totalSeconds;
          const progress = total > 0 ? Math.min(100, ((total - remaining) / total) * 100) : 0;
          return { ...fs, remainingSeconds: remaining, progressPct: progress, timeRemaining: formatCountdown(remaining) };
        })
      );
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const obtainCoupon = async (fs: FlashSale) => {
    if (couponMap[fs.id]) return;
    setObtainingId(fs.id);
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoId: fs.id, userId: 'demo-user' }),
      });
      const json = await res.json();
      if (json.success) {
        const rid = json.data.redemptionId;
        setCouponMap((prev) => ({ ...prev, [fs.id]: rid }));
        toast.success('Coupon obtenu !');
      } else {
        toast.error(json.error || 'Erreur');
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setObtainingId(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(code);
      toast.success('Code copié !');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const isExpired = (fs: FlashSale) => fs.remainingSeconds <= 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-500" />
          Ventes Flash
        </h2>
        <p className="text-sm text-muted-foreground">
          Promotions limitées dans votre quartier
        </p>
      </div>

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
            <p className="text-xs text-muted-foreground mt-1">Les ventes flash apparaîtront ici lorsqu'elles seront lancées.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {flashSales.map((fs, i) => {
              const expired = isExpired(fs);
              const hasCoupon = !!couponMap[fs.id];
              return (
                <motion.div
                  key={fs.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`border-orange-200 hover:shadow-lg transition-all overflow-hidden ${
                    expired
                      ? 'opacity-60 border-gray-200'
                      : fs.remainingSeconds < 300
                        ? 'border-red-300'
                        : ''
                  }`}
                    onClick={() => setSelectedFlash(fs)}
                  >
                    <CardContent className="p-0">
                      {/* Urgent bar */}
                      {!expired && fs.remainingSeconds < 300 && (
                        <div className="bg-red-500 text-white text-center py-1 text-xs font-bold animate-pulse">
                          DERNIÈRES MINUTES !
                        </div>
                      )}
                      {/* Expired bar */}
                      {expired && (
                        <div className="bg-gray-400 text-white text-center py-1 text-xs font-semibold">
                          Expirée
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <Flame className={`h-4 w-4 ${expired ? 'text-gray-400' : 'text-orange-500'}`} />
                              <Badge
                                variant={expired ? 'secondary' : 'destructive'}
                                className={`text-xs ${!expired ? 'animate-pulse' : ''}`}
                              >
                                <Zap className="h-3 w-3 mr-0.5" /> Flash
                              </Badge>
                              {fs.discountPct > 0 && (
                                <Badge className="bg-red-100 text-red-700 text-xs">-{fs.discountPct}%</Badge>
                              )}
                            </div>
                            <h3 className={`font-bold text-base ${expired ? 'line-through text-muted-foreground' : ''}`}>
                              {fs.title}
                            </h3>
                            {fs.merchantName && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Store className="h-3.5 w-3.5" /> {fs.merchantName}
                              </p>
                            )}
                            {fs.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{fs.description}</p>
                            )}

                            {/* Coupon section */}
                            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                              {hasCoupon ? (
                                <Badge
                                  variant="outline"
                                  className="cursor-pointer select-all font-mono text-xs gap-1 hover:bg-accent"
                                  onClick={() => copyCode(couponMap[fs.id])}
                                >
                                  {copiedId === couponMap[fs.id] ? (
                                    <><Check className="h-3 w-3" /> Copié</>
                                  ) : (
                                    <><Copy className="h-3 w-3" /> {couponMap[fs.id].slice(0, 12)}...</>
                                  )}
                                </Badge>
                              ) : !expired ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-orange-600 border-orange-300 hover:bg-orange-50 text-xs h-7"
                                  disabled={obtainingId === fs.id}
                                  onClick={() => obtainCoupon(fs)}
                                >
                                  {obtainingId === fs.id ? (
                                    <span className="animate-pulse">Chargement...</span>
                                  ) : (
                                    <><Ticket className="h-3 w-3 mr-1" /> Obtenir le coupon</>
                                  )}
                                </Button>
                              ) : null}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {/* Countdown HH:MM:SS */}
                            <div className={`font-mono font-bold text-lg ${
                              expired ? 'text-gray-400' : fs.remainingSeconds < 300 ? 'text-red-600' : 'text-orange-600'
                            }`}>
                              {fs.timeRemaining}
                            </div>
                            <div className="flex items-center justify-end gap-1">
                              <Timer className={`h-3.5 w-3.5 ${expired ? 'text-gray-400' : 'text-muted-foreground'}`} />
                              {!expired && <span className="text-[10px] text-muted-foreground">restantes</span>}
                            </div>
                            {/* Prices */}
                            <div className="mt-2">
                              {fs.originalPrice != null && (
                                <span className={`text-xs block ${expired ? 'text-gray-400' : 'text-muted-foreground'} ${expired ? 'line-through' : ''}`}>
                                  {fs.originalPrice.toFixed(2)}€
                                </span>
                              )}
                              {fs.promoPrice != null && (
                                <span className={`text-xl font-bold ${expired ? 'text-gray-400 line-through' : 'text-emerald-600'}`}>
                                  {fs.promoPrice.toFixed(2)}€
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-3">
                          <Progress value={expired ? 100 : fs.progressPct} className={`h-1.5 ${expired ? 'opacity-40' : ''}`} />
                          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                            <span>{fs.distanceText || 'En ligne'}</span>
                            <span>{fs.viewsCount} vues · {fs.redemptionsCount} utilisations</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Flash Detail Modal */}
      <AnimatePresence>
        {selectedFlash && (() => {
          const fs = selectedFlash;
          const expired = isExpired(fs);
          const hasCoupon = !!couponMap[fs.id];
          return (
            <motion.div
              key="detail-modal"
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
                      <Badge variant={expired ? 'secondary' : 'destructive'} className="mb-2">
                        <Zap className="h-3 w-3 mr-1" /> {expired ? 'Expirée' : 'Vente Flash'}
                      </Badge>
                      <h3 className={`font-bold text-xl ${expired ? 'line-through text-muted-foreground' : ''}`}>{fs.title}</h3>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedFlash(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {fs.description && (
                    <p className="text-sm text-muted-foreground mt-2">{fs.description}</p>
                  )}
                  <div className="my-4" />
                  <div className="text-center">
                    <div className={`font-mono font-bold text-3xl ${
                      expired ? 'text-gray-400' : fs.remainingSeconds < 300 ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {fs.timeRemaining}
                    </div>
                    <Progress value={expired ? 100 : fs.progressPct} className="h-2 mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {expired ? 'Cette vente flash est terminée' : fs.remainingSeconds < 300 ? 'Bientôt terminée !' : 'Temps restant'}
                    </p>
                  </div>
                  <div className="my-4" />
                  <div className="flex items-end justify-center gap-3">
                    {fs.originalPrice != null && (
                      <span className={`text-2xl ${expired ? 'text-gray-400 line-through' : 'text-muted-foreground line-through'}`}>
                        {fs.originalPrice.toFixed(2)}€
                      </span>
                    )}
                    {fs.promoPrice != null && (
                      <span className={`text-4xl font-bold ${expired ? 'text-gray-400 line-through' : 'text-emerald-600'}`}>
                        {fs.promoPrice.toFixed(2)}€
                      </span>
                    )}
                    {fs.discountPct > 0 && (
                      <Badge className="bg-red-100 text-red-700 text-sm px-2">-{fs.discountPct}%</Badge>
                    )}
                  </div>
                  {fs.merchantName && (
                    <p className="text-center text-sm text-muted-foreground mt-3 flex items-center justify-center gap-1">
                      <Store className="h-3.5 w-3.5" /> {fs.merchantName}
                      {fs.distanceText && ` · ${fs.distanceText}`}
                    </p>
                  )}

                  {/* Coupon button in modal */}
                  <div className="mt-4">
                    {hasCoupon ? (
                      <div className="flex items-center justify-center gap-2">
                        <Badge variant="outline" className="cursor-pointer select-all font-mono text-sm px-3 py-1.5 gap-1.5 hover:bg-accent"
                          onClick={() => copyCode(couponMap[fs.id])}
                        >
                          {copiedId === couponMap[fs.id] ? (
                            <><Check className="h-4 w-4" /> Copié !</>
                          ) : (
                            <><Copy className="h-4 w-4" /> {couponMap[fs.id]}</>
                          )}
                        </Badge>
                      </div>
                    ) : !expired ? (
                      <Button
                        className="w-full bg-orange-500 hover:bg-orange-600"
                        disabled={obtainingId === fs.id}
                        onClick={() => obtainCoupon(fs)}
                      >
                        {obtainingId === fs.id ? (
                          <span className="animate-pulse">Génération en cours...</span>
                        ) : (
                          <><Ticket className="h-4 w-4 mr-2" /> Obtenir le coupon</>
                        )}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
