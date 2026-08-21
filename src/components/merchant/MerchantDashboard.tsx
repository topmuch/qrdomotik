'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Eye,
  TicketCheck,
  Megaphone,
  BarChart3,
  UserCog,
  Plus,
  Loader2,
  Zap,
  Store,
  ArrowLeft,
  Save,
  ImageIcon,
  Tag,
  Clock,
  MapPin,
  Phone,
  Globe,
} from 'lucide-react';
import type { MerchantCategory } from '@/types';
import { MERCHANT_CATEGORY_LABELS } from '@/types';
import { MerchantRegistration } from './MerchantRegistration';

const DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'] as const;
const DAY_LABELS: Record<string, string> = {
  lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi', jeudi: 'Jeudi',
  vendredi: 'Vendredi', samedi: 'Samedi', dimanche: 'Dimanche',
};
type DaySchedule = { open: string; close: string; closed: boolean };
type OpeningHours = Record<string, DaySchedule>;

interface MerchantData {
  id: string;
  name: string;
  category: string;
  description: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  website: string | null;
  logoUrl: string | null;
  openingHoursJson: string | null;
  subscriptionTier: string;
  ratingAvg: number;
  totalReviews: number;
  isActive: boolean;
}

interface PromoData {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  originalPrice: number | null;
  promoPrice: number;
  validFrom: string | null;
  validUntil: string;
  isFlashSale: boolean;
  viewsCount: number;
  redemptionsCount: number;
  createdAt: string;
}

interface MerchantStats {
  totalPromos: number;
  activePromos: number;
  totalViews: number;
  totalRedemptions: number;
  ratingAvg: number;
  totalReviews: number;
}

interface MerchantDashboardProps {
  merchantId: string;
  userId?: string;
}

export function MerchantDashboard({ merchantId, userId = 'demo-user' }: MerchantDashboardProps) {
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [promos, setPromos] = useState<PromoData[]>([]);
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [promoLoading, setPromoLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('promotions');

  // Create promo dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newPromo, setNewPromo] = useState({
    title: '',
    description: '',
    imageUrl: '',
    originalPrice: '',
    promoPrice: '',
    validUntil: '',
    category: '',
    keywords: '',
    isFlashSale: false,
  });

  // Profile edit state
  const [editForm, setEditForm] = useState({
    name: '', category: '' as MerchantCategory | '', description: '',
    address: '', phone: '', website: '', logoUrl: '',
    latitude: '', longitude: '', openingHoursJson: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [openingHours, setOpeningHours] = useState<OpeningHours>({} as OpeningHours);

  const fetchMerchant = useCallback(async () => {
    try {
      const res = await fetch(`/api/merchants/${merchantId}`);
      const data = await res.json();
      if (data.success) {
        setMerchant(data.data);
        setEditForm({
          name: data.data.name,
          category: data.data.category,
          description: data.data.description ?? '',
          address: data.data.address ?? '',
          phone: data.data.phone ?? '',
          website: data.data.website ?? '',
          logoUrl: data.data.logoUrl ?? '',
          latitude: String(data.data.latitude),
          longitude: String(data.data.longitude),
          openingHoursJson: data.data.openingHoursJson ?? '',
        });
        try {
          const oh = data.data.openingHoursJson ? JSON.parse(data.data.openingHoursJson) : {};
          setOpeningHours(oh);
        } catch { /* ignore */ }
      }
    } catch (err) {
      console.error('Failed to fetch merchant', err);
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  const fetchPromos = useCallback(async () => {
    setPromoLoading(true);
    try {
      const res = await fetch(`/api/merchants/${merchantId}/promos?active=true`);
      const data = await res.json();
      if (data.success) setPromos(data.data);
    } catch (err) {
      console.error('Failed to fetch promos', err);
    } finally {
      setPromoLoading(false);
    }
  }, [merchantId]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/merchants/${merchantId}/stats`);
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  }, [merchantId]);

  useEffect(() => {
    fetchMerchant();
    fetchPromos();
    fetchStats();
  }, [fetchMerchant, fetchPromos, fetchStats]);

  async function handleCreatePromo() {
    setCreateLoading(true);
    try {
      const keywords = newPromo.keywords
        ? newPromo.keywords.split(',').map((k) => k.trim()).filter(Boolean)
        : [];

      const body: Record<string, unknown> = {
        title: newPromo.title,
        description: newPromo.description || undefined,
        imageUrl: newPromo.imageUrl || undefined,
        originalPrice: newPromo.originalPrice ? parseFloat(newPromo.originalPrice) : undefined,
        promoPrice: parseFloat(newPromo.promoPrice),
        validUntil: newPromo.validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        keywords,
        category: newPromo.category || undefined,
        isFlashSale: newPromo.isFlashSale,
      };

      const res = await fetch(`/api/merchants/${merchantId}/promos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setDialogOpen(false);
        setNewPromo({ title: '', description: '', imageUrl: '', originalPrice: '', promoPrice: '', validUntil: '', category: '', keywords: '', isFlashSale: false });
        fetchPromos();
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to create promo', err);
    } finally {
      setCreateLoading(false);
    }
  }

  function updateDay(day: string, key: keyof DaySchedule, value: string | boolean) {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [key]: value },
    }));
  }

  async function handleSaveProfile() {
    setEditLoading(true);
    setEditSuccess(false);
    try {
      const body: Record<string, unknown> = {
        name: editForm.name,
        category: editForm.category,
        description: editForm.description,
        address: editForm.address,
        phone: editForm.phone,
        website: editForm.website || undefined,
        logoUrl: editForm.logoUrl || undefined,
        latitude: parseFloat(editForm.latitude),
        longitude: parseFloat(editForm.longitude),
        openingHoursJson: JSON.stringify(openingHours),
      };

      const res = await fetch(`/api/merchants/${merchantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setEditSuccess(true);
        fetchMerchant();
        setTimeout(() => setEditSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setEditLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-gray-500 text-sm">Chargement de votre espace...</p>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="max-w-md mx-auto">
        <MerchantRegistration userId={userId} onSuccess={(id) => window.location.reload()} />
      </div>
    );
  }

  const isPromoActive = (p: PromoData) => {
    return new Date(p.validUntil) >= new Date();
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
          <Store className="w-6 h-6 text-emerald-700" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{merchant.name}</h1>
          <p className="text-sm text-gray-500">
            {MERCHANT_CATEGORY_LABELS[merchant.category as MerchantCategory] || merchant.category}
          </p>
        </div>
        <Badge className="ml-auto bg-emerald-100 text-emerald-700 shrink-0">
          Espace Pro
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="promotions" className="text-xs sm:text-sm">
            <Megaphone className="w-3.5 h-3.5 mr-1 hidden sm:inline" />
            Promos
          </TabsTrigger>
          <TabsTrigger value="stats" className="text-xs sm:text-sm">
            <BarChart3 className="w-3.5 h-3.5 mr-1 hidden sm:inline" />
            Stats
          </TabsTrigger>
          <TabsTrigger value="profile" className="text-xs sm:text-sm">
            <UserCog className="w-3.5 h-3.5 mr-1 hidden sm:inline" />
            Profil
          </TabsTrigger>
        </TabsList>

        {/* ─── PROMOTIONS TAB ─── */}
        <TabsContent value="promotions" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Mes promotions</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="w-4 h-4 mr-1" />
                  Nouvelle promo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-emerald-600" />
                    Nouvelle promotion
                  </DialogTitle>
                  <DialogDescription>
                    Créez une offre en 3 étapes : photo, titre et prix.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  {/* Step 1: Image URL */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      <ImageIcon className="w-3.5 h-3.5 inline mr-1" />
                      1. URL de l'image
                    </Label>
                    <Input
                      placeholder="https://example.com/promo.jpg"
                      value={newPromo.imageUrl}
                      onChange={(e) => setNewPromo((p) => ({ ...p, imageUrl: e.target.value }))}
                    />
                    {newPromo.imageUrl && (
                      <img
                        src={newPromo.imageUrl}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg border"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                  </div>

                  {/* Step 2: Title + Description */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      <Megaphone className="w-3.5 h-3.5 inline mr-1" />
                      2. Titre & description
                    </Label>
                    <Input
                      placeholder="-20% sur les baguettes"
                      value={newPromo.title}
                      onChange={(e) => setNewPromo((p) => ({ ...p, title: e.target.value }))}
                      required
                    />
                    <Textarea
                      placeholder="Détails de l'offre..."
                      value={newPromo.description}
                      onChange={(e) => setNewPromo((p) => ({ ...p, description: e.target.value }))}
                      rows={2}
                    />
                  </div>

                  {/* Step 3: Prices */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      <Tag className="w-3.5 h-3.5 inline mr-1" />
                      3. Prix
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Prix original (€)</p>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="1.20"
                          value={newPromo.originalPrice}
                          onChange={(e) => setNewPromo((p) => ({ ...p, originalPrice: e.target.value }))}
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Prix promo * (€)</p>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.90"
                          value={newPromo.promoPrice}
                          onChange={(e) => setNewPromo((p) => ({ ...p, promoPrice: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Optional fields */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Date d'expiration</p>
                      <Input
                        type="date"
                        value={newPromo.validUntil}
                        onChange={(e) => setNewPromo((p) => ({ ...p, validUntil: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Mots-clés (virgules)</p>
                      <Input
                        placeholder="pain, baguette"
                        value={newPromo.keywords}
                        onChange={(e) => setNewPromo((p) => ({ ...p, keywords: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Flash sale toggle */}
                  <label className="flex items-center gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPromo.isFlashSale}
                      onChange={(e) => setNewPromo((p) => ({ ...p, isFlashSale: e.target.checked }))}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-amber-900 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" /> Vente Flash
                      </span>
                      <span className="text-xs text-amber-700 block">0,50 € — Alerte push 500m</span>
                    </div>
                  </label>

                  <Button
                    onClick={handleCreatePromo}
                    disabled={createLoading || !newPromo.title || !newPromo.promoPrice}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {createLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Création...</>
                    ) : (
                      'Créer la promotion'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {promoLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
            </div>
          ) : promos.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Megaphone className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Aucune promotion active</p>
                <p className="text-gray-400 text-xs mt-1">Créez votre première promo !</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {promos.map((promo) => (
                <Card key={promo.id} className="overflow-hidden">
                  <div className="flex">
                    {promo.imageUrl && (
                      <img
                        src={promo.imageUrl}
                        alt={promo.title}
                        className="w-20 h-20 object-cover shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <CardContent className="p-3 flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-sm text-gray-900 truncate">{promo.title}</h3>
                        <div className="flex gap-1 shrink-0">
                          {promo.isFlashSale && (
                            <Badge className="bg-amber-100 text-amber-800 text-[10px] px-1.5">
                              <Zap className="w-2.5 h-2.5 mr-0.5" />Flash
                            </Badge>
                          )}
                          <Badge
                            className={`text-[10px] px-1.5 ${isPromoActive(promo) ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}
                          >
                            {isPromoActive(promo) ? 'Active' : 'Expirée'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                        {promo.originalPrice && (
                          <span className="line-through">{promo.originalPrice.toFixed(2)} €</span>
                        )}
                        <span className="font-semibold text-emerald-700">{promo.promoPrice.toFixed(2)} €</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
                        <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{promo.viewsCount}</span>
                        <span className="flex items-center gap-0.5"><TicketCheck className="w-3 h-3" />{promo.redemptionsCount}</span>
                        <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{new Date(promo.validUntil).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── STATS TAB ─── */}
        <TabsContent value="stats" className="space-y-4 mt-4">
          <h2 className="font-semibold text-gray-900">Statistiques</h2>
          {stats ? (
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-emerald-100">
                <CardContent className="p-4 text-center">
                  <Eye className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
                  <p className="text-xs text-gray-500">Vues totales</p>
                </CardContent>
              </Card>
              <Card className="border-emerald-100">
                <CardContent className="p-4 text-center">
                  <TicketCheck className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRedemptions}</p>
                  <p className="text-xs text-gray-500">Utilisations</p>
                </CardContent>
              </Card>
              <Card className="border-emerald-100">
                <CardContent className="p-4 text-center">
                  <Megaphone className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-900">{stats.activePromos}</p>
                  <p className="text-xs text-gray-500">Promos actives</p>
                  <p className="text-[10px] text-gray-400">sur {stats.totalPromos} au total</p>
                </CardContent>
              </Card>
              <Card className="border-emerald-100">
                <CardContent className="p-4 text-center">
                  <BarChart3 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-900">{stats.ratingAvg > 0 ? stats.ratingAvg.toFixed(1) : '—'}</p>
                  <p className="text-xs text-gray-500">Note moyenne</p>
                  <p className="text-[10px] text-gray-400">{stats.totalReviews} avis</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Chargement des statistiques...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── PROFILE TAB ─── */}
        <TabsContent value="profile" className="space-y-4 mt-4">
          <h2 className="font-semibold text-gray-900">Mon profil</h2>

          {editSuccess && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
              <Save className="w-4 h-4" /> Profil mis à jour avec succès !
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nom du commerce</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Catégorie</Label>
              <Select value={editForm.category} onValueChange={(v) => setEditForm((f) => ({ ...f, category: v as MerchantCategory }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {Object.entries(MERCHANT_CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium"><MapPin className="w-3.5 h-3.5 inline mr-1" />Adresse</Label>
              <Input
                value={editForm.address}
                onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium"><Phone className="w-3.5 h-3.5 inline mr-1" />Téléphone</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium"><Globe className="w-3.5 h-3.5 inline mr-1" />Site web</Label>
                <Input
                  value={editForm.website}
                  onChange={(e) => setEditForm((f) => ({ ...f, website: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Latitude</Label>
                <Input
                  type="number" step="any"
                  value={editForm.latitude}
                  onChange={(e) => setEditForm((f) => ({ ...f, latitude: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Longitude</Label>
                <Input
                  type="number" step="any"
                  value={editForm.longitude}
                  onChange={(e) => setEditForm((f) => ({ ...f, longitude: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">URL du logo</Label>
              <Input
                value={editForm.logoUrl}
                onChange={(e) => setEditForm((f) => ({ ...f, logoUrl: e.target.value }))}
              />
            </div>

            {/* Opening hours */}
            <div className="space-y-2">
              <Label className="text-sm font-medium"><Clock className="w-3.5 h-3.5 inline mr-1" />Horaires</Label>
              <div className="space-y-2 rounded-lg border p-3 bg-gray-50/50 max-h-60 overflow-y-auto">
                {DAYS.map((day) => {
                  const schedule = openingHours[day] || { open: '09:00', close: '19:00', closed: false };
                  return (
                    <div key={day} className="flex items-center gap-2">
                      <span className="text-xs font-medium w-20 text-gray-700 shrink-0">{DAY_LABELS[day]}</span>
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
                          <Input type="time" value={schedule.open} onChange={(e) => updateDay(day, 'open', e.target.value)} className="w-24 h-7 text-xs" />
                          <span className="text-xs text-gray-400">→</span>
                          <Input type="time" value={schedule.close} onChange={(e) => updateDay(day, 'close', e.target.value)} className="w-24 h-7 text-xs" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={editLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {editLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" />Enregistrer les modifications</>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}