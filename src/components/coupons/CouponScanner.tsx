'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ScanLine, CheckCircle, XCircle, Loader2, ShieldCheck,
} from 'lucide-react';

type ScanResult = {
  couponId: string;
  promoTitle: string;
  userName: string;
  commissionAmount: number;
} | null;

export function CouponScanner() {
  const [couponCode, setCouponCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult>(null);

  const validateCoupon = async () => {
    const trimmed = couponCode.trim();
    if (!trimmed) {
      toast.error('Veuillez saisir un code coupon');
      return;
    }

    setScanning(true);
    setResult(null);

    try {
      const res = await fetch('/api/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponId: trimmed, status: 'redeemed' }),
      });
      const json = await res.json();

      if (json.success) {
        const d = json.data;
        setResult({
          couponId: trimmed,
          promoTitle: d.promoTitle ?? 'Promotion',
          userName: d.userName ?? 'Client',
          commissionAmount: d.commissionAmount ?? 0,
        });
        toast.success('Coupon validé avec succès !');
        setCouponCode('');
      } else {
        setResult(null);
        toast.error(json.error || 'Coupon invalide ou déjà utilisé');
      }
    } catch {
      setResult(null);
      toast.error('Erreur réseau');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-green-600" />
        <h2 className="text-xl font-bold text-green-700">Scanner de Coupons</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Saisissez le code du coupon pour le valider
      </p>

      {/* Scanner Card */}
      <Card className="border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-green-700">
            <ScanLine className="h-4 w-4" />
            Valider un coupon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="coupon-code">Code du coupon (ID redemption)</Label>
            <Input
              id="coupon-code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Ex: clxxxxxxxxxxxxxxxxx"
              className="font-mono"
              onKeyDown={(e) => { if (e.key === 'Enter') validateCoupon(); }}
              disabled={scanning}
            />
          </div>
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={scanning || !couponCode.trim()}
            onClick={validateCoupon}
          >
            {scanning ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Validation en cours...</>
            ) : (
              <><CheckCircle className="h-4 w-4 mr-2" /> Valider le coupon</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-green-800">Coupon validé !</h4>
                <p className="text-sm text-green-700 truncate">{result.promoTitle}</p>
                <p className="text-xs text-green-600 mt-0.5">
                  Client : {result.userName}
                  {result.commissionAmount > 0 && ` · Commission : ${result.commissionAmount.toFixed(2)}€`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
