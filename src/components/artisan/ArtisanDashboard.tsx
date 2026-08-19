'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Wrench, Star, MapPin, Phone, Shield, Upload, CheckCircle, XCircle,
  Plus, Clock, Navigation, Award, Briefcase, FileText, Eye,
} from 'lucide-react';
import {
  PROFESSIONAL_CATEGORY_GROUP, PROFESSIONAL_GROUP_LABELS,
  SUBSCRIPTION_TIER_LABELS, SUBSCRIPTION_TIER_COLORS,
  PRICE_UNIT_LABELS, type ProfessionalCategory, type SubscriptionTier,
} from '@/types';
import { DEFAULT_MAP_CENTER, DEFAULT_SEARCH_RADIUS_KM } from '@/lib/constants';

type ProfessionalData = {
  id: string;
  businessName: string;
  category: string;
  description: string;
  specialties: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  serviceRadiusKm: number;
  isVerified: boolean;
  verificationDocsJson: string;
  portfolioImagesJson: string;
  availableForUrgency: boolean;
  subscriptionTier: string;
  rating: number;
  createdAt: string;
  _count: { services: number; serviceRequests: number; reviews: number };
  user: { fullName: string; phone: string; avatarUrl: string | null; avatarColor: string | null };
};

const categories = Object.entries(PROFESSIONAL_CATEGORY_GROUP) as [ProfessionalCategory, { group: string; label: string; icon: string }][];
const groups = Object.entries(PROFESSIONAL_GROUP_LABELS);

export function ArtisanDashboard() {
  const [professionals, setProfessionals] = useState<ProfessionalData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [selectedPro, setSelectedPro] = useState<ProfessionalData | null>(null);

  // Register form
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formSpecialties, setFormSpecialties] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formUrgency, setFormUrgency] = useState(false);

  const fetchProfessionals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        latitude: String(DEFAULT_MAP_CENTER.latitude),
        longitude: String(DEFAULT_MAP_CENTER.longitude),
        radiusKm: String(DEFAULT_SEARCH_RADIUS_KM),
      });
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (search) params.set('search', search);

      const res = await fetch(`/api/professionals?${params}`);
      const json = await res.json();
      if (json.success) setProfessionals(json.data);
    } catch {
      toast.error('Erreur chargement artisans');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, search]);

  useEffect(() => { fetchProfessionals(); }, [fetchProfessionals]);

  const registerPro = async () => {
    if (!formName || !formCategory) {
      toast.error('Nom et catégorie requis');
      return;
    }
    try {
      const res = await fetch('/api/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          businessName: formName,
          category: formCategory,
          description: formDesc,
          specialties: formSpecialties,
          phone: formPhone,
          address: formAddress,
          latitude: DEFAULT_MAP_CENTER.latitude + (Math.random() - 0.5) * 0.02,
          longitude: DEFAULT_MAP_CENTER.longitude + (Math.random() - 0.5) * 0.02,
          availableForUrgency: formUrgency,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Artisan enregistré !');
        setShowRegister(false);
        setFormName(''); setFormCategory(''); setFormDesc('');
        setFormSpecialties(''); setFormPhone(''); setFormAddress(''); setFormUrgency(false);
        fetchProfessionals();
      } else {
        toast.error(json.error || 'Erreur');
      }
    } catch {
      toast.error('Erreur réseau');
    }
  };

  const uploadVerificationDoc = async (proId: string) => {
    try {
      const res = await fetch('/api/professionals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professionalId: proId,
          verificationDocsJson: JSON.stringify([
            { type: 'id_card', name: 'Carte d\'identité', uploadedAt: new Date().toISOString(), status: 'pending' },
          ]),
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Document soumis pour vérification');
        fetchProfessionals();
      }
    } catch {
      toast.error('Erreur');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Wrench className="h-5 w-5 text-violet-600" />
            Services à la Personne
          </h2>
          <p className="text-sm text-muted-foreground">
            Trouvez un artisan de confiance près de chez vous
          </p>
        </div>
        <Button size="sm" onClick={() => setShowRegister(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Devenir artisan
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Rechercher un artisan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Spécialité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les spécialités</SelectItem>
            {categories.map(([key, info]) => (
              <SelectItem key={key} value={key}>{info.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category groups */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm" onClick={() => setSelectedCategory('all')}
        >
          Tous
        </Button>
        {groups.map(([group, label]) => (
          <Button key={group} variant="outline" size="sm"
            onClick={() => setSelectedCategory(group === 'depannage' ? 'all' : 'all')}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Professionals list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-20 bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
      ) : professionals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wrench className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Aucun artisan disponible dans votre zone</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {professionals.map((pro, i) => (
              <motion.div
                key={pro.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedPro(pro)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                        pro.isVerified ? 'bg-emerald-500' : 'bg-gray-400'
                      }`}>
                        {pro.businessName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold text-sm truncate">{pro.businessName}</h3>
                          {pro.isVerified && (
                            <Shield className="h-4 w-4 text-emerald-500" />
                          )}
                          {pro.availableForUrgency && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              Urgence 24/7
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {PROFESSIONAL_CATEGORY_GROUP[pro.category as ProfessionalCategory]?.label || pro.category}
                          {pro.specialties ? ` · ${pro.specialties}` : ''}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-medium">{pro.rating.toFixed(1)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{pro.distanceText}</p>
                        <p className="text-xs text-muted-foreground">{pro._count.reviews} avis</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Register Dialog */}
      <AnimatePresence>
        {showRegister && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowRegister(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Devenir Artisan Partenaire</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowRegister(false)}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label>Nom de l'entreprise *</Label>
                    <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="ABC Plomberie" />
                  </div>
                  <div>
                    <Label>Spécialité *</Label>
                    <Select value={formCategory} onValueChange={setFormCategory}>
                      <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                      <SelectContent>
                        {categories.map(([key, info]) => (
                          <SelectItem key={key} value={key}>{info.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Décrivez votre activité..." rows={3} />
                  </div>
                  <div>
                    <Label>Spécialités (séparées par des virgules)</Label>
                    <Input value={formSpecialties} onChange={(e) => setFormSpecialties(e.target.value)} placeholder="Débouchage, réparation, installation" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Téléphone</Label>
                      <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+221 77 123 45 67" />
                    </div>
                    <div>
                      <Label>Adresse</Label>
                      <Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Dakar, Médina" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">Disponible pour urgences</Label>
                      <p className="text-xs text-muted-foreground">Interventions rapides 24/7</p>
                    </div>
                    <Switch checked={formUrgency} onCheckedChange={setFormUrgency} />
                  </div>
                  <Button className="w-full" onClick={registerPro}>
                    <Briefcase className="h-4 w-4 mr-2" />
                    Créer mon profil artisan
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pro Detail Modal */}
      <AnimatePresence>
        {selectedPro && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setSelectedPro(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-14 w-14 rounded-xl flex items-center justify-center text-white font-bold text-xl ${
                      selectedPro.isVerified ? 'bg-emerald-500' : 'bg-gray-400'
                    }`}>
                      {selectedPro.businessName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-lg">{selectedPro.businessName}</h3>
                        {selectedPro.isVerified && <Shield className="h-4 w-4 text-emerald-500" />}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {PROFESSIONAL_CATEGORY_GROUP[selectedPro.category as ProfessionalCategory]?.label}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedPro(null)}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>

                {selectedPro.description && (
                  <p className="text-sm text-muted-foreground mt-3">{selectedPro.description}</p>
                )}
                {selectedPro.specialties && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedPro.specialties.split(',').map((s, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{s.trim()}</Badge>
                    ))}
                  </div>
                )}

                <Separator className="my-3" />

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 bg-muted rounded-lg">
                    <Star className="h-4 w-4 mx-auto text-amber-400 fill-amber-400" />
                    <div className="text-lg font-bold">{selectedPro.rating.toFixed(1)}</div>
                    <div className="text-[10px] text-muted-foreground">{selectedPro._count.reviews} avis</div>
                  </div>
                  <div className="p-2 bg-muted rounded-lg">
                    <Briefcase className="h-4 w-4 mx-auto text-violet-500" />
                    <div className="text-lg font-bold">{selectedPro._count.serviceRequests}</div>
                    <div className="text-[10px] text-muted-foreground">Interventions</div>
                  </div>
                  <div className="p-2 bg-muted rounded-lg">
                    <Navigation className="h-4 w-4 mx-auto text-emerald-500" />
                    <div className="text-lg font-bold">{selectedPro.distanceText}</div>
                    <div className="text-[10px] text-muted-foreground">Distance</div>
                  </div>
                </div>

                <div className="space-y-2 mt-3 text-sm">
                  {selectedPro.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" /> {selectedPro.phone}
                    </div>
                  )}
                  {selectedPro.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" /> {selectedPro.address}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" /> Rayon : {selectedPro.serviceRadiusKm} km
                  </div>
                  {selectedPro.availableForUrgency && (
                    <Badge variant="destructive" className="mt-2">Disponible pour urgences 24/7</Badge>
                  )}
                </div>

                {!selectedPro.isVerified && (
                  <Button
                    variant="outline" className="w-full mt-4"
                    onClick={(e) => { e.stopPropagation(); uploadVerificationDoc(selectedPro.id); }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Soumettre documents de vérification
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
