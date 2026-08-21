'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Info } from 'lucide-react';
import {
  COMMISSIONS,
} from '@/lib/constants';

type CommissionKey = keyof typeof COMMISSIONS;

interface CommissionField {
  key: CommissionKey;
  label: string;
  description: string;
  unit: string;
  defaultValue: number;
  min: number;
  max: number;
}

const COMMISSION_FIELDS: CommissionField[] = [
  {
    key: 'flash_sale',
    label: 'Vente Flash',
    description:
      'Commission fixe prélevée à chaque déclenchement d\'une vente flash par un commerçant. Le montant est débité immédiatement du solde du commerçant.',
    unit: '€ (fixe)',
    defaultValue: COMMISSIONS.flash_sale.default,
    min: COMMISSIONS.flash_sale.min,
    max: COMMISSIONS.flash_sale.max,
  },
  {
    key: 'redemption',
    label: 'Coupon utilisé',
    description:
      'Pourcentage prélevé sur la valeur du coupon lorsqu\'un utilisateur le fait valider chez un commerçant. Appliqué sur le prix promo du coupon.',
    unit: '% (du montant)',
    defaultValue: COMMISSIONS.redemption.default * 100, // 0.20 → 20
    min: COMMISSIONS.redemption.min * 100,
    max: COMMISSIONS.redemption.max * 100,
  },
  {
    key: 'service_match_depannage',
    label: 'Mise en relation (Dépannage)',
    description:
      'Commission fixe prélevée lors de la mise en relation d\'un client avec un artisan de dépannage (plombier, électricien, serrurier, chauffagiste). Facturée à la confirmation de la réservation.',
    unit: '€ (fixe)',
    defaultValue: COMMISSIONS.service_match_depannage.default,
    min: COMMISSIONS.service_match_depannage.min,
    max: COMMISSIONS.service_match_depannage.max,
  },
  {
    key: 'service_match_entretien',
    label: 'Mise en relation (Entretien)',
    description:
      'Commission fixe prélevée lors de la mise en relation avec un artisan d\'entretien (ménage, jardinage, bricolage). Facturée à la confirmation de la réservation.',
    unit: '€ (fixe)',
    defaultValue: COMMISSIONS.service_match_entretien.default,
    min: COMMISSIONS.service_match_entretien.min,
    max: COMMISSIONS.service_match_entretien.max,
  },
  {
    key: 'service_match_bien_etre',
    label: 'Mise en relation (Bien-être)',
    description:
      'Commission fixe prélevée lors de la mise en relation avec un prestataire bien-être (coiffure, esthétique, massage). Facturée à la confirmation de la réservation.',
    unit: '€ (fixe)',
    defaultValue: COMMISSIONS.service_match_bien_etre.default,
    min: COMMISSIONS.service_match_bien_etre.min,
    max: COMMISSIONS.service_match_bien_etre.max,
  },
  {
    key: 'service_match_assistance',
    label: 'Mise en relation (Assistance)',
    description:
      'Commission fixe prélevée lors de la mise en relation avec un prestataire d\'assistance (soutien scolaire, babysitting, pet-sitting). Facturée à la confirmation de la réservation.',
    unit: '€ (fixe)',
    defaultValue: COMMISSIONS.service_match_assistance.default,
    min: COMMISSIONS.service_match_assistance.min,
    max: COMMISSIONS.service_match_assistance.max,
  },
];

export function CommissionConfig() {
  const [values, setValues] = useState<Record<CommissionKey, string>>(
    () => {
      const initial: Record<string, string> = {};
      COMMISSION_FIELDS.forEach((f) => {
        initial[f.key] = String(f.defaultValue);
      });
      return initial as Record<CommissionKey, string>;
    },
  );
  const [saving, setSaving] = useState(false);

  const handleChange = (key: CommissionKey, val: string) => {
    const field = COMMISSION_FIELDS.find((f) => f.key === key);
    if (!field) return;
    // Allow empty, otherwise clamp
    if (val === '') {
      setValues((prev) => ({ ...prev, [key]: val }));
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num)) return;
    const clamped = Math.min(Math.max(num, field.min), field.max);
    setValues((prev) => ({ ...prev, [key]: String(clamped) }));
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate save — in production, POST to a config endpoint
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success('Taux de commission enregistrés avec succès');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          Configuration des Commissions
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ajustez les taux de commission pour chaque type de transaction
        </p>
      </div>

      {/* Commission Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {COMMISSION_FIELDS.map((field, i) => (
          <motion.div
            key={field.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  {field.label}
                  <span className="text-xs font-normal text-muted-foreground">({field.unit})</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Min: {field.min.toFixed(2)} · Max: {field.max.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Info box */}
                <div className="flex gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <Info className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {field.description}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Label htmlFor={field.key} className="text-sm whitespace-nowrap min-w-[70px]">
                    Taux actuel
                  </Label>
                  <Input
                    id={field.key}
                    type="number"
                    step="0.01"
                    min={field.min}
                    max={field.max}
                    value={values[field.key]}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="max-w-[140px]"
                  />
                  <span className="text-sm text-muted-foreground">
                    {field.key === 'redemption' ? '%' : '€'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Separator />

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer les taux'}
        </Button>
      </div>
    </div>
  );
}
