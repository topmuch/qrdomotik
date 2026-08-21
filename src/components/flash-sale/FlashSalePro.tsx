'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Zap, Clock, Plus, Flame, Timer, AlertTriangle, RefreshCw, ImageIcon, CheckCircle, XCircle,
} from 'lucide-react';
import { PRICING } from '@/lib/constants';

const PRO_DURATIONS = [
  { value: '1', label: '1 heure' },
  { value: '2', label: '2 heures' },
  { value: '4', label: '4 heures' },
  { value: '8', label: '8 heures' },
];

type MerchantFlashSale = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  originalPrice: number | null;
  promoPrice: number;
  isFlashSale: boolean;
  flashSaleExpiresAt: string | null;
  validUntil: string;
  viewsCount: number;
  redemptionsCount: number;
  createdAt: string;
};

function formatCountdown(targetDate: string): { text: string; seconds: number; expired: boolean } {
  const remaining = Math.max(0, Math.floor((new Date(targetDate).getTime() - Date.now()) / 1000));
  const expired = remaining <= 0;
  if (expired) return { text: 'Expirée', seconds: 0, expired: true };
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  return {
    text: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
    seconds: remaining,
    expired: false,
  };
}

type Props = {
  merchantId: string;
};

export function FlashSalePro({ merchantId }: Props) {
  const [flashSales, setFlashSales] = useState<MerchantFlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formPromoPrice, setFormPromoPrice] = useState('');
  const [formDuration, setFormDuration] = useState('2');
  const [formImageUrl, setFormImageUrl] = useState('');

  const fetchFlashSales = useCallback(async () => {
    try {
      const res = await fetch(`/api/merchants/${merchantId}/promos?active=true`);
      const json = await res.json();
      if (json.success) {
        const flash = (json.data ?? []).filter((p: MerchantFlashSale) => p.isFlashSale);
        setFlashSales(flash);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    fetchFlashSales();
  }, [fetchFlashSales]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval30 = setInterval(fetchFlashSales, 30000);
    return () => clearInterval(interval30);
  }, [fetchFlashSales]);

  const handleCreate = async () => {
    if (!formTitle.trim() || !formPromoPrice) {
      toast.error('Titre et prix promo requis');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/flash-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          title: formTitle.trim(),
          promoPrice: parseFloat(formPromoPrice),
          durationHours: parseInt(formDuration),
          imageUrl: formImageUrl.trim() || undefined,
          userId: merchantId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Vente flash lancée !');
        setShowConfirm(false);
        resetForm();
        fetchFlashSales();
      } else {
        toast.error(json.error || 'Erreur');
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormPromoPrice('');
    setFormDuration('2');
    setFormImageUrl('');
  };

  const activeFlashSales = flashSales.filter((fs) => fs.flashSaleExpiresAt && new Date(fs.flashSaleExpiresAt) > new Date());
  const endedFlashSales = flashSales.filter((fs) => !fs.flashSaleExpiresAt || new Date(fs.flashSaleExpiresAt) <= new Date());

  return (
    <div className="space-y-6">
      {/* Header + Launch Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-amber-700">
            <Flame className="h-5 w-5 text-orange-500" />
            Ventes Flash Pro
          </h2>
          <p className="text-sm text-muted-foreground">
            Lancez des promotions limitées pour attirer les clients
          </p>
        </div>
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-white"
          onClick={() => setShowConfirm(true)}
        >
          <Zap className="h-4 w-4 mr-1.5" />
          Lancer une vente flash
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={(open) => { if (!open) { setShowConfirm(false); } }}>
        <DialogContent className="sm:max-w-lg border-amber-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              Confirmer le lancement
            </DialogTitle>
            <DialogDescription>
              Vous allez lancer une vente flash. Voici les conditions :
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-amber-800">
                Frais de lancement : {PRICING.flash_sale_trigger.amount.toFixed(2)}€
              </span>
            </div>
            <p className="text-amber-700">
              Ce montant sera débité pour diffuser votre promotion aux clients du quartier.
              La vente sera visible immédiatement et expirera à la fin de la durée choisie.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Annuler</Button>
            <Button className="bg-amber-500 hover:bg-amber-600" onClick={() => {
              setShowConfirm(false);
              // Now show the form - we just confirmed the cost
            }}>
              Continuer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Form */}
      <Card className="border-amber-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-amber-700">
            <Plus className="h-4 w-4" />
            Nouvelle vente flash
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="fs-title">Titre *</Label>
            <Input
              id="fs-title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Ex: Baguette fraîche -40%"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="fs-price">Prix promo *</Label>
              <Input
                id="fs-price"
                type="number"
                step="0.01"
                value={formPromoPrice}
                onChange={(e) => setFormPromoPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="fs-duration">Durée</Label>
              <Select value={formDuration} onValueChange={setFormDuration}>
                <SelectTrigger id="fs-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRO_DURATIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="fs-image" className="flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" /> URL de l'image
            </Label>
            <Input
              id="fs-image"
              value={formImageUrl}
              onChange={(e) => setFormImageUrl(e.target.value)}
              placeholder="https://... (optionnel)"
            />
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            Coût : {PRICING.flash_sale_trigger.amount.toFixed(2)}€ par lancement
          </div>
          <Button
            className="w-full bg-amber-500 hover:bg-amber-600"
            disabled={submitting || !formTitle.trim() || !formPromoPrice}
            onClick={handleCreate}
          >
            {submitting ? (
              <span className="animate-pulse">Lancement en cours...</span>
            ) : (
              <><Zap className="h-4 w-4 mr-2" /> Lancer la vente flash</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Active Flash Sales */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-orange-500" />
          <h3 className="font-semibold text-amber-700">Actives ({activeFlashSales.length})</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={fetchFlashSales}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse border-amber-200">
                <CardContent className="p-4"><div className="h-20 bg-muted rounded" /></CardContent>
              </Card>
            ))}
          </div>
        ) : activeFlashSales.length === 0 ? (
          <Card className="border-dashed border-amber-200">
            <CardContent className="py-8 text-center">
              <Clock className="h-8 w-8 mx-auto text-amber-300 mb-2" />
              <p className="text-sm text-muted-foreground">Aucune vente flash active</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activeFlashSales.map((fs) => {
              const cd = formatCountdown(fs.flashSaleExpiresAt!);
              return (
                <Card key={fs.id} className="border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Badge className="bg-orange-100 text-orange-700 animate-pulse text-xs border-orange-200">
                            <Zap className="h-3 w-3 mr-0.5" /> En cours
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-sm truncate">{fs.title}</h4>
                        {fs.promoPrice != null && (
                          <span className="text-lg font-bold text-emerald-600">{fs.promoPrice.toFixed(2)}€</span>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`font-mono font-bold text-lg ${cd.seconds < 300 ? 'text-red-600' : 'text-amber-600'}`}>
                          {cd.text}
                        </div>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <Timer className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">restantes</span>
                        </div>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{fs.viewsCount} vues</span>
                      <span>{fs.redemptionsCount} coupons</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Ended Flash Sales */}
      {endedFlashSales.length > 0 && (
        <div>
          <h3 className="font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Terminées ({endedFlashSales.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {endedFlashSales.map((fs) => (
              <Card key={fs.id} className="border-gray-200 opacity-60">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <h4 className="font-medium text-sm line-through text-muted-foreground truncate">{fs.title}</h4>
                      {fs.promoPrice != null && (
                        <span className="text-sm text-muted-foreground">{fs.promoPrice.toFixed(2)}€</span>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs flex-shrink-0 ml-2">
                      <CheckCircle className="h-3 w-3 mr-0.5" /> Terminée
                    </Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {fs.viewsCount} vues · {fs.redemptionsCount} coupons
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
