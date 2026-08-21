'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Card, CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Ticket, Copy, Check, Store, QrCode, Wallet, Gift, CheckCircle, Clock, XCircle,
} from 'lucide-react';

type CouponItem = {
  id: string;
  status: string;
  commissionAmount: number;
  redeemedAt: string;
  promo: {
    id: string;
    title: string;
    description: string | null;
    promoPrice: number;
    originalPrice: number | null;
    isFlashSale: boolean;
    merchant: {
      id: string;
      name: string;
      category: string | null;
      logoUrl: string | null;
    } | null;
  };
};

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  generated: { label: 'Actif', className: 'bg-blue-100 text-blue-700 border-blue-200', icon: Ticket },
  redeemed: { label: 'Utilisé', className: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  expired: { label: 'Expiré', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: Clock },
  cancelled: { label: 'Annulé', className: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
};

// Simple QR-like visual using SVG grid pattern
function QrLikeCode({ code }: { code: string }) {
  const size = 6;
  // Generate a deterministic grid based on the code
  const cells: boolean[] = [];
  for (let i = 0; i < size * size; i++) {
    const charCode = code.charCodeAt(i % code.length) || 0;
    cells.push((charCode + i) % 3 !== 0);
  }
  return (
    <div className="relative w-16 h-16 bg-white border-2 border-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
      <QrCode className="absolute h-3 w-3 text-gray-300 top-0.5 left-0.5" />
      <svg viewBox={`0 0 ${size} ${size}`} className="w-10 h-10" style={{ imageRendering: 'pixelated' }}>
        {cells.map((filled, idx) => (
          <rect
            key={idx}
            x={idx % size}
            y={Math.floor(idx / size)}
            width={1}
            height={1}
            fill={filled ? '#1f2937' : '#e5e7eb'}
          />
        ))}
      </svg>
    </div>
  );
}

type Props = {
  userId: string;
};

export function CouponWallet({ userId }: Props) {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/coupons?userId=${userId}`);
      const json = await res.json();
      if (json.success) setCoupons(json.data ?? []);
    } catch {
      toast.error('Erreur chargement des coupons');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(code);
      toast.success('Code copié !');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const activeCoupons = coupons.filter((c) => c.status === 'generated');
  const usedCoupons = coupons.filter((c) => c.status === 'redeemed');
  const expiredCoupons = coupons.filter((c) => c.status === 'expired' || c.status === 'cancelled');

  const EmptyState = ({ tab }: { tab: string }) => (
    <div className="py-12 text-center">
      <Wallet className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
      <p className="text-sm text-muted-foreground">
        {tab === 'active' && 'Aucun coupon actif pour le moment'}
        {tab === 'used' && 'Aucun coupon utilisé'}
        {tab === 'expired' && 'Aucun coupon expiré'}
      </p>
      <p className="text-xs text-muted-foreground/60 mt-1">
        {tab === 'active' && 'Obtenez des coupons depuis les ventes flash !'}
        {tab === 'used' && 'Vos coupons utilisés apparaîtront ici'}
        {tab === 'expired' && 'Les coupons expirés et annulés apparaissent ici'}
      </p>
    </div>
  );

  const CouponCard = ({ coupon }: { coupon: CouponItem }) => {
    const config = STATUS_CONFIG[coupon.status] ?? STATUS_CONFIG.generated;
    const StatusIcon = config.icon;
    const isCopyable = coupon.status === 'generated';

    return (
      <Card className={`border ${coupon.status === 'generated' ? 'border-blue-100' : 'border-gray-100'}`}>
        <CardContent className="p-4">
          <div className="flex gap-3">
            {/* QR-like code */}
            <QrLikeCode code={coupon.id} />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm truncate">{coupon.promo.title}</h4>
                  {coupon.promo.merchant && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Store className="h-3 w-3" /> {coupon.promo.merchant.name}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${config.className}`}>
                  <StatusIcon className="h-3 w-3 mr-0.5" />
                  {config.label}
                </Badge>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  {coupon.promo.promoPrice != null && (
                    <span className="text-sm font-bold text-emerald-600">
                      {coupon.promo.promoPrice.toFixed(2)}€
                    </span>
                  )}
                  {coupon.promo.isFlashSale && (
                    <Badge className="bg-orange-100 text-orange-700 text-[10px] border-orange-200 px-1.5">Flash</Badge>
                  )}
                </div>

                {isCopyable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => copyCode(coupon.id)}
                  >
                    {copiedId === coupon.id ? (
                      <><Check className="h-3 w-3" /> Copié</>
                    ) : (
                      <><Copy className="h-3 w-3" /> Copier</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Gift className="h-5 w-5 text-blue-500" />
        <h2 className="text-xl font-bold">Mes Coupons</h2>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="w-full">
          <TabsTrigger value="active" className="flex-1">
            Actifs ({activeCoupons.length})
          </TabsTrigger>
          <TabsTrigger value="used" className="flex-1">
            Utilisés ({usedCoupons.length})
          </TabsTrigger>
          <TabsTrigger value="expired" className="flex-1">
            Expirés ({expiredCoupons.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-16 bg-muted rounded" /></CardContent></Card>
              ))}
            </div>
          ) : activeCoupons.length === 0 ? (
            <EmptyState tab="active" />
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {activeCoupons.map((c) => <CouponCard key={c.id} coupon={c} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="used">
          {usedCoupons.length === 0 ? (
            <EmptyState tab="used" />
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {usedCoupons.map((c) => <CouponCard key={c.id} coupon={c} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expired">
          {expiredCoupons.length === 0 ? (
            <EmptyState tab="expired" />
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {expiredCoupons.map((c) => <CouponCard key={c.id} coupon={c} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
