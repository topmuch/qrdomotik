'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Store, MapPin, Phone, Globe, Clock, Camera, CheckCircle2 } from 'lucide-react';
import type { MerchantCategory } from '@/types';
import { MERCHANT_CATEGORY_LABELS } from '@/types';

const DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'] as const;

const DAY_LABELS: Record<string, string> = {
  lundi: 'Lundi',
  mardi: 'Mardi',
  mercredi: 'Mercredi',
  jeudi: 'Jeudi',
  vendredi: 'Vendredi',
  samedi: 'Samedi',
  dimanche: 'Dimanche',
};

type DaySchedule = { open: string; close: string; closed: boolean };

type OpeningHours = Record<string, DaySchedule>;

const defaultOpeningHours: OpeningHours = Object.fromEntries(
  DAYS.map((day) => [
    day,
    { open: '09:00', close: '19:00', closed: day === 'dimanche' },
  ])
);

interface MerchantRegistrationProps {
  userId?: string;
  onSuccess?: (merchantId: string) => void;
}

export function MerchantRegistration({ userId = 'demo-user', onSuccess }: MerchantRegistrationProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    category: '' as MerchantCategory | '',
    description: '',
    address: '',
    phone: '',
    website: '',
    logoUrl: '',
    latitude: '',
    longitude: '',
    openingHours: defaultOpeningHours,
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateDay(day: string, key: keyof DaySchedule, value: string | boolean) {
    setForm((prev) => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: { ...prev.openingHours[day], [key]: value },
      },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const lat = parseFloat(form.latitude);
      const lng = parseFloat(form.longitude);
      if (isNaN(lat) || isNaN(lng)) {
        setError('Latitude et longitude requises');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/merchants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          description: form.description,
          address: form.address,
          latitude: lat,
          longitude: lng,
          phone: form.phone,
          website: form.website,
          userId,
          openingHoursJson: JSON.stringify(form.openingHours),
          logoUrl: form.logoUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        onSuccess?.(data.data.id);
      } else {
        setError(data.error || 'Erreur lors de l\'inscription');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-emerald-900 mb-2">Inscription réussie !</h3>
            <p className="text-emerald-700 text-sm">
              Votre commerce est enregistré. Vous pouvez maintenant accéder à votre Espace Pro.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-3">
          <Store className="w-7 h-7 text-emerald-700" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Inscrivez votre commerce</h2>
        <p className="text-gray-500 text-sm">
          Rejoignez le quartier connecté et touchez plus de clients locaux
        </p>
      </div>

      <Card className="shadow-lg border-gray-200">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Nom du commerce *</Label>
              <Input
                id="name"
                placeholder="Boulangerie du Quartier"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">Catégorie *</Label>
              <Select value={form.category} onValueChange={(v) => updateField('category', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {Object.entries(MERCHANT_CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                placeholder="Décrivez votre commerce en quelques mots..."
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">
                <MapPin className="w-3.5 h-3.5 inline mr-1" />Adresse
              </Label>
              <Input
                id="address"
                placeholder="12 Rue de la Paix, 75002 Paris"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
              />
            </div>

            {/* Latitude / Longitude */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="latitude" className="text-sm font-medium">Latitude *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="48.8566"
                  value={form.latitude}
                  onChange={(e) => updateField('latitude', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude" className="text-sm font-medium">Longitude *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="2.3522"
                  value={form.longitude}
                  onChange={(e) => updateField('longitude', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Phone / Website */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  <Phone className="w-3.5 h-3.5 inline mr-1" />Téléphone
                </Label>
                <Input
                  id="phone"
                  placeholder="01 23 45 67 89"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" className="text-sm font-medium">
                  <Globe className="w-3.5 h-3.5 inline mr-1" />Site web
                </Label>
                <Input
                  id="website"
                  placeholder="https://moncommerce.fr"
                  value={form.website}
                  onChange={(e) => updateField('website', e.target.value)}
                />
              </div>
            </div>

            {/* Logo URL placeholder */}
            <div className="space-y-2">
              <Label htmlFor="logoUrl" className="text-sm font-medium">
                <Camera className="w-3.5 h-3.5 inline mr-1" />URL du logo
              </Label>
              <Input
                id="logoUrl"
                placeholder="https://example.com/logo.png"
                value={form.logoUrl}
                onChange={(e) => updateField('logoUrl', e.target.value)}
              />
              {form.logoUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={form.logoUrl}
                    alt="Logo preview"
                    className="w-12 h-12 rounded-lg object-cover border"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                    Aperçu
                  </Badge>
                </div>
              )}
            </div>

            {/* Opening Hours */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                <Clock className="w-3.5 h-3.5 inline mr-1" />Horaires d'ouverture
              </Label>
              <div className="space-y-2 rounded-lg border p-3 bg-gray-50/50 max-h-60 overflow-y-auto">
                {DAYS.map((day) => {
                  const schedule = form.openingHours[day];
                  return (
                    <div key={day} className="flex items-center gap-2">
                      <span className="text-xs font-medium w-20 text-gray-700 shrink-0">
                        {DAY_LABELS[day]}
                      </span>
                      <label className="flex items-center gap-1.5 text-xs text-gray-500">
                        <input
                          type="checkbox"
                          checked={schedule.closed}
                          onChange={(e) => updateDay(day, 'closed', e.target.checked)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        Fermé
                      </label>
                      {!schedule.closed && (
                        <div className="flex items-center gap-1 ml-auto">
                          <Input
                            type="time"
                            value={schedule.open}
                            onChange={(e) => updateDay(day, 'open', e.target.value)}
                            className="w-24 h-7 text-xs"
                          />
                          <span className="text-xs text-gray-400">→</span>
                          <Input
                            type="time"
                            value={schedule.close}
                            onChange={(e) => updateDay(day, 'close', e.target.value)}
                            className="w-24 h-7 text-xs"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || !form.name || !form.category}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Inscription en cours...
                </>
              ) : (
                'Inscrire mon commerce'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}