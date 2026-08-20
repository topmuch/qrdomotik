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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  MapPin, Store, Tag, Percent, Clock, Search, Navigation, X,
  ShoppingCart, Zap, ChevronDown, ChevronUp, ExternalLink, Star,
} from 'lucide-react';
import {
  MERCHANT_CATEGORY_LABELS, MERCHANT_CATEGORY_ICONS,
  type MerchantCategory, type PromoSource,
} from '@/types';
import { DEFAULT_MAP_CENTER, DEFAULT_SEARCH_RADIUS_KM } from '@/lib/constants';
import { formatDistance } from '@/lib/geo';

type MerchantData = {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  imageUrl: string | null;
  subscriptionTier: string;
  distanceKm: number;
  distanceText: string;
  _count: { promos: number; reviews: number };
};

type PromoData = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  originalPrice: number | null;
  promoPrice: number | null;
  validFrom: string;
  validUntil: string | null;
  source: string;
  category: string;
  merchantId: string | null;
  merchantName: string;
  merchantCategory: string | null;
  distanceKm: number;
  distanceText: string | null;
  matchScore: number;
  discountPct: number;
  redemptionsCount: number;
  isFlashSale: boolean;
  flashSaleExpiresAt: string | null;
};

type Tab = 'map' | 'promos' | 'merchants';

const CATEGORIES = Object.entries(MERCHANT_CATEGORY_LABELS) as [MerchantCategory, string][];

export function NeighborhoodView() {
  const [tab, setTab] = useState<Tab>('promos');
  const [merchants, setMerchants] = useState<MerchantData[]>([]);
  const [promos, setPromos] = useState<PromoData[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [showMatched, setShowMatched] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPromo, setSelectedPromo] = useState<PromoData | null>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantData | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const getLat = () => userLocation?.lat ?? DEFAULT_MAP_CENTER.latitude;
  const getLng = () => userLocation?.lng ?? DEFAULT_MAP_CENTER.longitude;

  const fetchMerchants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        latitude: String(getLat()),
        longitude: String(getLng()),
        radiusKm: String(DEFAULT_SEARCH_RADIUS_KM),
        limit: '50',
      });
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (search) params.set('search', search);

      const res = await fetch(`/api/merchants?${params}`);
      const json = await res.json();
      if (json.success) setMerchants(json.data);
    } catch {
      toast.error('Erreur chargement commerçants');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, search]);

  const fetchPromos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        latitude: String(getLat()),
        longitude: String(getLng()),
        radiusKm: String(DEFAULT_SEARCH_RADIUS_KM),
        limit: '50',
      });
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      if (search) params.set('search', search);
      if (showMatched) params.set('shoppingList', 'pain lait beurre fromage oeufs');

      const res = await fetch(`/api/promos?${params}`);
      const json = await res.json();
      if (json.success) setPromos(json.data);
    } catch {
      toast.error('Erreur chargement promos');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, sourceFilter, search, showMatched]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => { /* use default */ }
      );
    }
  }, []);

  useEffect(() => {
    if (tab === 'merchants') fetchMerchants();
    else if (tab === 'promos') fetchPromos();
  }, [tab, fetchMerchants, fetchPromos]);

  const requestGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          toast.success('Position mise à jour');
          if (tab === 'merchants') fetchMerchants();
          else if (tab === 'promos') fetchPromos();
        },
        () => toast.error('Impossible d\'obtenir votre position'),
        { enableHighAccuracy: true }
      );
    }
  };

  const redeemCoupon = async (promoId: string, merchantId: string) => {
    try {
      const res = await fetch('/api/promo-redemptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoId, userId: 'demo-user', merchantId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Coupon validé !');
        fetchPromos();
      } else {
        toast.error(json.error || 'Erreur lors de la validation');
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
            <MapPin className="h-5 w-5 text-emerald-600" />
            Mon Quartier Connecté
          </h2>
          <p className="text-sm text-muted-foreground">
            Commerçants et promos autour de vous
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={requestGeolocation}>
          <Navigation className="h-4 w-4 mr-1" />
          {userLocation ? 'Recalculer' : 'Ma position'}
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un commerçant ou promo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {CATEGORIES.map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        {([['promos', 'Promotions', Tag], ['merchants', 'Commerçants', Store], ['map', 'Carte', MapPin]] as const).map(
          ([value, label, Icon]) => (
            <button
              key={value}
              onClick={() => setTab(value as Tab)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                tab === value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          )
        )}
      </div>

      {/* Source filter for promos */}
      {tab === 'promos' && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1">
            {([['all', 'Toutes'], ['local', 'Locale'], ['scraped', 'Scrapées']] as const).map(
              ([value, label]) => (
                <Button
                  key={value}
                  variant={sourceFilter === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSourceFilter(value)}
                >
                  {label}
                </Button>
              )
            )}
          </div>
          <Button
            variant={showMatched ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowMatched(!showMatched)}
            className="ml-auto"
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1" />
            Match liste courses
          </Button>
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {tab === 'map' && (
          <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Carte du Quartier</CardTitle>
                <CardDescription>
                  {merchants.length} commerçants dans un rayon de {DEFAULT_SEARCH_RADIUS_KM} km
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div ref={mapRef} className="w-full h-80 rounded-lg bg-emerald-50 border flex items-center justify-center relative overflow-hidden">
                  {/* Simulated map with SVG grid */}
                  <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 400 300">
                      <defs>
                        <pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="400" height="300" fill="url(#mapgrid)" className="text-emerald-600" />
                    </svg>
                  </div>
                  {/* Center marker */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="h-8 w-8 bg-emerald-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                      <Navigation className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs text-emerald-700 mt-1 font-medium">Vous</span>
                  </div>
                  {/* Merchant pins */}
                  {merchants.slice(0, 8).map((m, i) => {
                    const angle = (i / Math.min(merchants.length, 8)) * Math.PI * 2;
                    const r = 60 + (m.distanceKm / DEFAULT_SEARCH_RADIUS_KM) * 80;
                    const x = Math.cos(angle) * r;
                    const y = Math.sin(angle) * r;
                    return (
                      <div
                        key={m.id}
                        className="absolute z-10 cursor-pointer group"
                        style={{
                          left: `calc(50% + ${x}px - 12px)`,
                          top: `calc(50% + ${y}px - 12px)`,
                        }}
                        onClick={() => setSelectedMerchant(m)}
                      >
                        <div className={`h-6 w-6 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-[10px] font-bold ${
                          m.subscriptionTier === 'featured' ? 'bg-purple-500' :
                          m.subscriptionTier === 'premium' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}>
                          {m._count.promos > 0 ? m._count.promos : ''}
                        </div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block">
                          <div className="bg-white rounded shadow-lg px-2 py-1 text-xs whitespace-nowrap z-20">
                            {m.name}
                            <div className="text-muted-foreground">{m.distanceText}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Installation de Leaflet.js prévue pour la version production avec PostGIS
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {tab === 'promos' && (
          <motion.div key="promos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-20 bg-muted rounded" /></CardContent></Card>
                ))}
              </div>
            ) : promos.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Tag className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Aucune promo disponible dans votre zone</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Essayez d'élargir le rayon de recherche
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AnimatePresence>
                  {promos.map((promo, i) => (
                    <motion.div
                      key={promo.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card
                        className={`cursor-pointer hover:shadow-md transition-shadow ${
                          promo.isFlashSale ? 'border-orange-300 bg-orange-50/50' : ''
                        } ${promo.matchScore > 0 ? 'ring-2 ring-emerald-400' : ''}`}
                        onClick={() => setSelectedPromo(promo)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                {promo.isFlashSale && (
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                    <Zap className="h-3 w-3 mr-0.5" /> Flash
                                  </Badge>
                                )}
                                {promo.source === 'scraped' && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    {promo.category || 'Scrapé'}
                                  </Badge>
                                )}
                                {promo.matchScore > 0 && (
                                  <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700">
                                    <ShoppingCart className="h-3 w-3 mr-0.5" />
                                    {promo.matchScore} match
                                  </Badge>
                                )}
                              </div>
                              <h3 className="font-semibold text-sm truncate">{promo.title}</h3>
                              {promo.merchantName && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Store className="h-3 w-3" />
                                  {promo.merchantName}
                                </p>
                              )}
                            </div>
                            {promo.discountPct > 0 && (
                              <div className="flex-shrink-0 text-right">
                                <div className="text-lg font-bold text-red-600">-{promo.discountPct}%</div>
                                {promo.promoPrice != null && promo.originalPrice != null && (
                                  <div className="text-xs text-muted-foreground line-through">
                                    {promo.originalPrice.toFixed(2)}€
                                  </div>
                                )}
                                {promo.promoPrice != null && (
                                  <div className="text-sm font-semibold text-emerald-600">
                                    {promo.promoPrice.toFixed(2)}€
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {promo.distanceText || 'En ligne'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {promo.validUntil
                                ? `Jusqu'au ${new Date(promo.validUntil).toLocaleDateString('fr-FR')}`
                                : 'En cours'
                              }
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {tab === 'merchants' && (
          <motion.div key="merchants" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-16 bg-muted rounded" /></CardContent></Card>
                ))}
              </div>
            ) : merchants.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Store className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Aucun commerçant dans votre zone</p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-3">
                  <AnimatePresence>
                    {merchants.map((merchant, i) => (
                      <motion.div
                        key={merchant.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedMerchant(merchant)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold ${
                                merchant.subscriptionTier === 'featured' ? 'bg-purple-500' :
                                merchant.subscriptionTier === 'premium' ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}>
                                {merchant.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h3 className="font-semibold text-sm truncate">{merchant.name}</h3>
                                  {merchant.subscriptionTier !== 'free' && (
                                    <Badge variant="outline" className="text-[10px]">
                                      {merchant.subscriptionTier === 'featured' ? '⭐ Vedette' : '💎 Premium'}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {MERCHANT_CATEGORY_LABELS[merchant.category as MerchantCategory] || merchant.category}
                                  {merchant.address ? ` · ${merchant.address}` : ''}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-medium text-emerald-600">{merchant.distanceText}</p>
                                <p className="text-xs text-muted-foreground">
                                  {merchant._count.promos} promo{merchant._count.promos > 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Merchant Detail Modal */}
      <AnimatePresence>
        {selectedMerchant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setSelectedMerchant(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                      selectedMerchant.subscriptionTier === 'featured' ? 'bg-purple-500' :
                      selectedMerchant.subscriptionTier === 'premium' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}>
                      {selectedMerchant.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{selectedMerchant.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {MERCHANT_CATEGORY_LABELS[selectedMerchant.category as MerchantCategory]}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedMerchant(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {selectedMerchant.description && (
                  <p className="text-sm text-muted-foreground mt-3">{selectedMerchant.description}</p>
                )}
                <Separator className="my-3" />
                <div className="space-y-2 text-sm">
                  {selectedMerchant.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" /> {selectedMerchant.address}
                    </div>
                  )}
                  {selectedMerchant.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      📞 {selectedMerchant.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-emerald-600 font-medium">
                    <Navigation className="h-4 w-4" /> {selectedMerchant.distanceText}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Badge variant="secondary">{selectedMerchant._count.promos} promotions</Badge>
                  <Badge variant="secondary">{selectedMerchant._count.reviews} avis</Badge>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Promo Detail Modal */}
      <AnimatePresence>
        {selectedPromo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setSelectedPromo(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {selectedPromo.isFlashSale && (
                      <Badge variant="destructive" className="mb-2"><Zap className="h-3 w-3 mr-1" /> Vente Flash</Badge>
                    )}
                    <h3 className="font-bold text-lg">{selectedPromo.title}</h3>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedPromo(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {selectedPromo.description && (
                  <p className="text-sm text-muted-foreground mt-2">{selectedPromo.description}</p>
                )}
                <Separator className="my-3" />
                <div className="flex items-end gap-3">
                  {selectedPromo.originalPrice != null && (
                    <span className="text-lg text-muted-foreground line-through">
                      {selectedPromo.originalPrice.toFixed(2)}€
                    </span>
                  )}
                  {selectedPromo.promoPrice != null && (
                    <span className="text-2xl font-bold text-emerald-600">
                      {selectedPromo.promoPrice.toFixed(2)}€
                    </span>
                  )}
                  {selectedPromo.discountPct > 0 && (
                    <Badge className="bg-red-100 text-red-700">-{selectedPromo.discountPct}%</Badge>
                  )}
                </div>
                {selectedPromo.merchantName && (
                  <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                    <Store className="h-3.5 w-3.5" /> {selectedPromo.merchantName}
                    {selectedPromo.distanceText && ` · ${selectedPromo.distanceText}`}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {selectedPromo.validUntil
                    ? `Valable jusqu'au ${new Date(selectedPromo.validUntil).toLocaleDateString('fr-FR')}`
                    : 'En cours'
                  }
                </div>
                {selectedPromo.matchScore > 0 && (
                  <div className="mt-2 p-2 bg-emerald-50 rounded-lg text-sm text-emerald-700">
                    <ShoppingCart className="h-3.5 w-3.5 inline mr-1" />
                    Correspond à {selectedPromo.matchScore} article{selectedPromo.matchScore > 1 ? 's' : ''} de votre liste de courses !
                  </div>
                )}
                {selectedPromo.merchantId && (
                  <Button
                    className="w-full mt-4"
                    onClick={() => redeemCoupon(selectedPromo.id, selectedPromo.merchantId!)}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    Valider ce coupon
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
