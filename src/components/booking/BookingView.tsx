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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  CalendarCheck, MapPin, Star, Phone, Clock, MessageSquare,
  Send, AlertTriangle, XCircle, CheckCircle, ChevronRight,
  Wrench, Navigation, Shield, FileText, Camera, User, Zap,
} from 'lucide-react';
import {
  SERVICE_REQUEST_STATUS_LABELS, SERVICE_REQUEST_STATUS_COLORS,
  URGENCY_LEVEL_LABELS, URGENCY_LEVEL_COLORS,
  PROFESSIONAL_CATEGORY_GROUP, type ProfessionalCategory,
  type ServiceRequestStatus, type UrgencyLevel,
} from '@/types';
import { DEFAULT_MAP_CENTER, DEFAULT_SEARCH_RADIUS_KM } from '@/lib/constants';
import { formatDistance } from '@/lib/geo';

type ServiceRequest = {
  id: string;
  description: string;
  urgencyLevel: string;
  status: string;
  preferredDate: string | null;
  preferredTime: string | null;
  address: string;
  quotedPrice: number | null;
  professionalNotes: string | null;
  photosJson: string;
  createdAt: string;
  professionalId: string;
  userId: string;
  serviceId: string | null;
  professional: {
    id: string; businessName: string; category: string;
    phone: string; isVerified: boolean; rating: number;
  } | null;
  service: {
    id: string; name: string; price: number; priceUnit: string;
  } | null;
  user: { id: string; fullName: string; email: string; phone: string } | null;
};

type ProfessionalForBooking = {
  id: string;
  businessName: string;
  category: string;
  description: string;
  phone: string;
  isVerified: boolean;
  availableForUrgency: boolean;
  rating: number;
  distanceKm: number;
  distanceText: string;
  _count: { services: number; reviews: number };
};

type BookingStep = 'search' | 'select' | 'details' | 'confirm' | 'success';

export function BookingView() {
  const [step, setStep] = useState<BookingStep>('search');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMyRequests, setShowMyRequests] = useState(false);
  const [activeTab, setActiveTab] = useState<'book' | 'history'>('book');

  // Search state
  const [searchCategory, setSearchCategory] = useState<string>('all');
  const [searchUrgent, setSearchUrgent] = useState(false);
  const [pros, setPros] = useState<ProfessionalForBooking[]>([]);

  // Booking state
  const [selectedPro, setSelectedPro] = useState<ProfessionalForBooking | null>(null);
  const [formDesc, setFormDesc] = useState('');
  const [formUrgency, setFormUrgency] = useState<UrgencyLevel>('normal');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formAddress, setFormAddress] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch(`/api/service-requests?userId=demo-user`);
      const json = await res.json();
      if (json.success) setRequests(json.data);
    } catch { /* silent */ }
  }, []);

  const fetchPros = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        latitude: String(DEFAULT_MAP_CENTER.latitude),
        longitude: String(DEFAULT_MAP_CENTER.longitude),
        radiusKm: String(DEFAULT_SEARCH_RADIUS_KM),
      });
      if (searchCategory !== 'all') params.set('category', searchCategory);
      if (searchUrgent) params.set('urgent', 'true');

      const res = await fetch(`/api/professionals?${params}`);
      const json = await res.json();
      if (json.success) setPros(json.data);
    } catch {
      toast.error('Erreur chargement artisans');
    } finally {
      setLoading(false);
    }
  }, [searchCategory, searchUrgent]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);
  useEffect(() => { fetchPros(); }, [fetchPros]);

  const submitBooking = async () => {
    if (!selectedPro || !formDesc) {
      toast.error('Veuillez remplir la description');
      return;
    }
    try {
      const res = await fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          professionalId: selectedPro.id,
          description: formDesc,
          urgencyLevel: formUrgency,
          preferredDate: formDate || null,
          preferredTime: formTime || null,
          address: formAddress,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setStep('success');
        fetchRequests();
      } else {
        toast.error(json.error || 'Erreur');
      }
    } catch {
      toast.error('Erreur réseau');
    }
  };

  const updateStatus = async (requestId: string, status: ServiceRequestStatus) => {
    try {
      const res = await fetch('/api/service-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        fetchRequests();
      }
    } catch { toast.error('Erreur'); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-violet-600" />
          Réservation de Services
        </h2>
        <p className="text-sm text-muted-foreground">
          Trouvez et réservez un artisan en quelques clics
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        {([['book', 'Réserver', CalendarCheck], ['history', 'Mes demandes', FileText]] as const).map(
          ([value, label, Icon]) => (
            <button key={value}
              onClick={() => setActiveTab(value as 'book' | 'history')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}>
              <Icon className="h-4 w-4" />
              {label}
            </button>
          )
        )}
      </div>

      {/* Booking Flow */}
      {activeTab === 'book' && (
        <AnimatePresence mode="wait">
          {/* Step: Search */}
          {step === 'search' && (
            <motion.div key="search" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">De quel service avez-vous besoin ?</CardTitle>
                  <CardDescription>Sélectionnez la catégorie et la disponibilité souhaitée</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={searchCategory} onValueChange={setSearchCategory}>
                    <SelectTrigger><SelectValue placeholder="Catégorie d'artisan" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      {Object.entries(PROFESSIONAL_CATEGORY_GROUP).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant={searchUrgent ? 'destructive' : 'outline'}
                    className="w-full"
                    onClick={() => setSearchUrgent(!searchUrgent)}>
                    <Zap className="h-4 w-4 mr-2" />
                    {searchUrgent ? 'Urgence activée ⏰' : 'Rechercher en urgence uniquement'}
                  </Button>
                  <Separator />
                  {loading ? (
                    <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                    ))}</div>
                  ) : pros.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6">Aucun artisan disponible</p>
                  ) : (
                    <div className="space-y-2">
                      {pros.map((pro) => (
                        <Card key={pro.id} className="cursor-pointer hover:shadow-sm transition-shadow"
                          onClick={() => { setSelectedPro(pro); setStep('details'); }}>
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold ${
                                pro.isVerified ? 'bg-emerald-500' : 'bg-gray-400'
                              }`}>
                                {pro.businessName.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="font-medium text-sm truncate">{pro.businessName}</span>
                                  {pro.isVerified && <Shield className="h-3.5 w-3.5 text-emerald-500" />}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {PROFESSIONAL_CATEGORY_GROUP[pro.category as ProfessionalCategory]?.label}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-0.5">
                                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                                  <span className="text-xs">{pro.rating.toFixed(1)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{pro.distanceText}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step: Details */}
          {step === 'details' && selectedPro && (
            <motion.div key="details" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <button onClick={() => setStep('search')} className="text-muted-foreground hover:text-foreground">
                      ←
                    </button>
                    Décrivez votre besoin
                  </CardTitle>
                  <CardDescription>à {selectedPro.businessName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Pro summary */}
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold">
                      {selectedPro.businessName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{selectedPro.businessName}</div>
                      <div className="text-xs text-muted-foreground">{selectedPro.distanceText} · ★ {selectedPro.rating.toFixed(1)}</div>
                    </div>
                  </div>

                  <div>
                    <Label>Description du besoin *</Label>
                    <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                      placeholder="Décrivez précisément votre problème ou besoin..."
                      rows={4} />
                  </div>

                  <div>
                    <Label>Niveau d'urgence</Label>
                    <Select value={formUrgency} onValueChange={(v) => setFormUrgency(v as UrgencyLevel)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(URGENCY_LEVEL_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Date souhaitée</Label>
                      <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
                    </div>
                    <div>
                      <Label>Heure</Label>
                      <Input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <Label>Adresse d'intervention</Label>
                    <Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)}
                      placeholder="Adresse complète" />
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg text-sm text-orange-700">
                    <Camera className="h-4 w-4 flex-shrink-0" />
                    <span>Vous pourrez ajouter des photos après confirmation.</span>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setStep('search')}>Retour</Button>
                    <Button className="flex-1" onClick={() => setStep('confirm')}>Suivant</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step: Confirm */}
          {step === 'confirm' && selectedPro && (
            <motion.div key="confirm" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <button onClick={() => setStep('details')} className="text-muted-foreground hover:text-foreground">←</button>
                    Confirmez votre demande
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Artisan</span><span className="font-medium">{selectedPro.businessName}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Catégorie</span><span>{PROFESSIONAL_CATEGORY_GROUP[selectedPro.category as ProfessionalCategory]?.label}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Urgence</span><Badge className={URGENCY_LEVEL_COLORS[formUrgency]}>{URGENCY_LEVEL_LABELS[formUrgency]}</Badge></div>
                    {formDate && <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{new Date(formDate).toLocaleDateString('fr-FR')}</span></div>}
                    {formTime && <div className="flex justify-between"><span className="text-muted-foreground">Heure</span><span>{formTime}</span></div>}
                    {formAddress && <div className="flex justify-between"><span className="text-muted-foreground">Adresse</span><span className="text-right max-w-[60%]">{formAddress}</span></div>}
                    <Separator />
                    <div><span className="text-muted-foreground">Description</span><p className="mt-1">{formDesc}</p></div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setStep('details')}>Modifier</Button>
                    <Button className="flex-1" onClick={submitBooking}>
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer la demande
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="border-emerald-200 bg-emerald-50/50">
                <CardContent className="py-10 text-center">
                  <CheckCircle className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
                  <h3 className="font-bold text-xl mb-2">Demande envoyée !</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    L'artisan va recevoir votre demande et vous répondre rapidement.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => { setStep('search'); setSelectedPro(null); setFormDesc(''); }}>Nouvelle réservation</Button>
                    <Button onClick={() => setActiveTab('history')}>Voir mes demandes</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Requests History */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Aucune demande de service</p>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {requests.map((req, i) => (
                <motion.div key={req.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Badge className={SERVICE_REQUEST_STATUS_COLORS[req.status as ServiceRequestStatus]}>
                              {SERVICE_REQUEST_STATUS_LABELS[req.status as ServiceRequestStatus]}
                            </Badge>
                            <Badge className={URGENCY_LEVEL_COLORS[req.urgencyLevel as UrgencyLevel]}>
                              {URGENCY_LEVEL_LABELS[req.urgencyLevel as UrgencyLevel]}
                            </Badge>
                          </div>
                          <p className="text-sm truncate">{req.description}</p>
                          {req.professional && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Wrench className="h-3 w-3" /> {req.professional.businessName}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(req.createdAt).toLocaleDateString('fr-FR')} à {new Date(req.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {req.status === 'pending' && (
                          <Button variant="outline" size="sm" className="text-red-600"
                            onClick={() => updateStatus(req.id, 'cancelled')}>
                            Annuler
                          </Button>
                        )}
                        {req.status === 'completed' && (
                          <Button size="sm" onClick={() => toast.info('Avis bientôt disponible (Étape 10)')}>
                            Laisser un avis
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
}
