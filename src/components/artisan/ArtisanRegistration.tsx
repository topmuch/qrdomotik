'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Briefcase, MapPin, Wrench, FileText, ChevronLeft, ChevronRight,
  Plus, Trash2, CheckCircle, Clock, ShieldCheck,
} from 'lucide-react';
import type { ProfessionalCategory, PriceUnit } from '@/types';
import {
  PROFESSIONAL_CATEGORY_GROUP, PROFESSIONAL_GROUP_LABELS, PRICE_UNIT_LABELS,
} from '@/types';
import { DEFAULT_MAP_CENTER } from '@/lib/constants';

// ─── Types ──────────────────────────────────────────────────────

interface ServiceForm {
  name: string;
  description: string;
  basePrice: string;
  priceUnit: PriceUnit;
  durationMinutes: string;
  isUrgent: boolean;
}

interface DocUpload {
  type: string;
  url: string;
  status: string;
}

// ─── Step Config ────────────────────────────────────────────────

const STEPS = [
  { label: 'Informations', icon: Briefcase },
  { label: 'Localisation', icon: MapPin },
  { label: 'Services', icon: Wrench },
  { label: 'Documents', icon: FileText },
] as const;

const DOC_TYPES = [
  { key: 'kbis', label: 'Extrait Kbis', placeholder: 'https://exemple.com/kbis.pdf' },
  { key: 'insurance', label: "Attestation d'assurance", placeholder: 'https://exemple.com/assurance.pdf' },
] as const;

const MAX_SERVICES = 5;
const MAX_PORTFOLIO = 5;

// ─── Component ──────────────────────────────────────────────────

export function ArtisanRegistration({ onSuccess }: { onSuccess?: () => void }) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Step 1: Basic info
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState<ProfessionalCategory | ''>('');
  const [description, setDescription] = useState('');

  // Step 2: Location
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(String(DEFAULT_MAP_CENTER.latitude));
  const [longitude, setLongitude] = useState(String(DEFAULT_MAP_CENTER.longitude));
  const [serviceRadiusKm, setServiceRadiusKm] = useState(10);
  const [isUrgentAvailable, setIsUrgentAvailable] = useState(false);

  // Step 3: Services
  const [services, setServices] = useState<ServiceForm[]>([
    { name: '', description: '', basePrice: '', priceUnit: 'hour', durationMinutes: '60', isUrgent: false },
  ]);

  // Step 4: Documents
  const [docs, setDocs] = useState<DocUpload[]>([]);
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>(['']);
  const [kbisUrl, setKbisUrl] = useState('');
  const [insuranceUrl, setInsuranceUrl] = useState('');

  // ─── Grouped categories ─────────────────────────────────────

  const groupedCategories = useMemo(() => {
    const groups: Record<string, { key: ProfessionalCategory; label: string }[]> = {};
    for (const [key, info] of Object.entries(PROFESSIONAL_CATEGORY_GROUP) as [ProfessionalCategory, { group: string; label: string; icon: string }][]) {
      if (!groups[info.group]) groups[info.group] = [];
      groups[info.group].push({ key, label: info.label });
    }
    return groups;
  }, []);

  // ─── Service management ─────────────────────────────────────

  const addService = () => {
    if (services.length >= MAX_SERVICES) {
      toast.error(`Maximum ${MAX_SERVICES} services autorisés`);
      return;
    }
    setServices([...services, { name: '', description: '', basePrice: '', priceUnit: 'hour', durationMinutes: '60', isUrgent: false }]);
  };

  const removeService = (index: number) => {
    if (services.length <= 1) return;
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: keyof ServiceForm, value: string | boolean) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  // ─── Document management ────────────────────────────────────

  const addDocUrl = (type: string, url: string) => {
    if (!url.trim()) return;
    setDocs(prev => [...prev, { type, url: url.trim(), status: 'pending' }]);
  };

  const removeDoc = (index: number) => {
    setDocs(prev => prev.filter((_, i) => i !== index));
  };

  const addPortfolioUrl = () => {
    if (portfolioUrls.length >= MAX_PORTFOLIO) {
      toast.error(`Maximum ${MAX_PORTFOLIO} photos de portfolio`);
      return;
    }
    setPortfolioUrls(prev => [...prev, '']);
  };

  const updatePortfolioUrl = (index: number, value: string) => {
    const updated = [...portfolioUrls];
    updated[index] = value;
    setPortfolioUrls(updated);
  };

  const removePortfolioUrl = (index: number) => {
    if (portfolioUrls.length <= 1) return;
    setPortfolioUrls(prev => prev.filter((_, i) => i !== index));
  };

  // ─── Validation ─────────────────────────────────────────────

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return !!(businessName.trim() && category);
      case 1: return !!(latitude && longitude && !isNaN(Number(latitude)) && !isNaN(Number(longitude)));
      case 2: return services.some(s => s.name.trim() && s.basePrice);
      case 3: return true;
      default: return false;
    }
  };

  // ─── Submit ─────────────────────────────────────────────────

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // 1. Create professional
      const proRes = await fetch('/api/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          businessName: businessName.trim(),
          category,
          description: description.trim(),
          address: address.trim(),
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          serviceRadiusKm,
          availableForUrgency: isUrgentAvailable,
          verificationDocsJson: JSON.stringify(docs),
          portfolioImagesJson: JSON.stringify(portfolioUrls.filter(u => u.trim())),
        }),
      });

      const proJson = await proRes.json();
      if (!proJson.success) {
        toast.error(proJson.error || 'Erreur lors de la création du profil');
        setSubmitting(false);
        return;
      }

      const professionalId = proJson.data.id;

      // 2. Create services
      for (const svc of services) {
        if (!svc.name.trim() || !svc.basePrice) continue;
        await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            professionalId,
            name: svc.name.trim(),
            description: svc.description.trim(),
            price: parseFloat(svc.basePrice) || 0,
            priceUnit: svc.priceUnit,
            minDurationMinutes: parseInt(svc.durationMinutes) || 60,
            isUrgent: svc.isUrgent,
          }),
        });
      }

      setSuccess(true);
      toast.success('Inscription envoyée avec succès !');
      onSuccess?.();
    } catch {
      toast.error('Erreur réseau. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Success State ──────────────────────────────────────────

  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="mx-auto w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-6">
            <CheckCircle className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Inscription envoyée !</h2>
          <p className="text-slate-500 mb-6">
            Votre profil artisan a été créé avec succès.
          </p>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <Clock className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm font-medium">
                  En attente de vérification
                </p>
              </div>
              <p className="text-xs text-amber-600 mt-1">
                Nos équipes examinent vos documents. Vous recevrez une notification dès validation.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="max-w-md mx-auto">
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-blue-600" />
          Devenir Artisan Partenaire
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Créez votre profil en 4 étapes simples
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1 mb-6">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors text-sm font-semibold ${
                  isDone
                    ? 'bg-blue-600 text-white'
                    : isActive
                      ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-600'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isDone ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={`text-[11px] font-medium hidden sm:block ${
                isActive ? 'text-blue-700' : isDone ? 'text-blue-600' : 'text-slate-400'
              }`}>
                {s.label}
              </span>
              <span className={`text-[10px] font-bold sm:hidden ${
                isActive ? 'text-blue-700' : 'text-slate-400'
              }`}>{i + 1}/4</span>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Étape {step + 1} : {STEPS[step].label}</CardTitle>
              <CardDescription className="text-xs">
                {step === 0 && 'Informations de base de votre entreprise'}
                {step === 1 && 'Votre zone d\'intervention'}
                {step === 2 && 'Les services que vous proposez'}
                {step === 3 && 'Documents de vérification (optionnel)'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* STEP 1: Basic Info */}
              {step === 0 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Nom de l&apos;entreprise *</Label>
                    <Input
                      id="businessName"
                      placeholder="ABC Plomberie"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie *</Label>
                    <Select value={category} onValueChange={(v) => setCategory(v as ProfessionalCategory)}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Choisir une catégorie..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(groupedCategories).map(([group, cats]) => (
                          <SelectGroup key={group}>
                            <SelectLabel className="text-xs font-semibold text-slate-500">
                              {PROFESSIONAL_GROUP_LABELS[group] || group}
                            </SelectLabel>
                            {cats.map((cat) => (
                              <SelectItem key={cat.key} value={cat.key}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Décrivez votre activité, votre expérience..."
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* STEP 2: Location */}
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse</Label>
                    <Input
                      id="address"
                      placeholder="Dakar, Médina, Rue 10"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude *</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="0.0001"
                        placeholder="14.6937"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude *</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="0.0001"
                        placeholder="-17.4441"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Rayon d&apos;intervention</Label>
                      <Badge variant="secondary" className="text-blue-700 bg-blue-50">
                        {serviceRadiusKm} km
                      </Badge>
                    </div>
                    <Slider
                      value={[serviceRadiusKm]}
                      onValueChange={([v]) => setServiceRadiusKm(v)}
                      min={1}
                      max={50}
                      step={1}
                      className="[&_[role=slider]]:bg-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>1 km</span>
                      <span>50 km</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div>
                      <Label className="text-sm font-medium">Disponible pour urgences</Label>
                      <p className="text-xs text-slate-500">Interventions rapides 24/7</p>
                    </div>
                    <Switch checked={isUrgentAvailable} onCheckedChange={setIsUrgentAvailable} />
                  </div>
                </>
              )}

              {/* STEP 3: Services */}
              {step === 2 && (
                <>
                  <div className="space-y-3">
                    {services.map((svc, i) => (
                      <div key={i} className="p-3 rounded-lg border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-700">Service {i + 1}</span>
                          {services.length > 1 && (
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500"
                              onClick={() => removeService(i)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <Input
                          placeholder="Nom du service (ex: Débouchage canalisation)"
                          value={svc.name}
                          onChange={(e) => updateService(i, 'name', e.target.value)}
                        />
                        <Textarea
                          placeholder="Description du service..."
                          rows={2}
                          value={svc.description}
                          onChange={(e) => updateService(i, 'description', e.target.value)}
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[11px]">Prix</Label>
                            <Input
                              type="number" step="0.01"
                              placeholder="0.00"
                              value={svc.basePrice}
                              onChange={(e) => updateService(i, 'basePrice', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px]">Unité</Label>
                            <Select
                              value={svc.priceUnit}
                              onValueChange={(v) => updateService(i, 'priceUnit', v)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(Object.entries(PRICE_UNIT_LABELS) as [PriceUnit, string][]).map(([k, label]) => (
                                  <SelectItem key={k} value={k}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px]">Durée (min)</Label>
                            <Input
                              type="number"
                              placeholder="60"
                              value={svc.durationMinutes}
                              onChange={(e) => updateService(i, 'durationMinutes', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">Service urgent disponible</span>
                          <Switch
                            checked={svc.isUrgent}
                            onCheckedChange={(v) => updateService(i, 'isUrgent', v)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {services.length < MAX_SERVICES && (
                    <Button
                      variant="outline" size="sm" className="w-full border-dashed"
                      onClick={addService}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter un service ({services.length}/{MAX_SERVICES})
                    </Button>
                  )}
                </>
              )}

              {/* STEP 4: Documents */}
              {step === 3 && (
                <>
                  <p className="text-xs text-slate-500">
                    Ajoutez les URL de vos documents de vérification pour accélérer le processus.
                  </p>

                  <div className="space-y-1.5">
                    <Label className="text-sm">{DOC_TYPES[0].label}</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder={DOC_TYPES[0].placeholder}
                        value={kbisUrl}
                        onChange={(e) => setKbisUrl(e.target.value)}
                      />
                      <Button
                        variant="outline" size="sm"
                        className="flex-shrink-0"
                        disabled={!kbisUrl.trim()}
                        onClick={() => { addDocUrl(DOC_TYPES[0].key, kbisUrl); setKbisUrl(''); }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm">{DOC_TYPES[1].label}</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder={DOC_TYPES[1].placeholder}
                        value={insuranceUrl}
                        onChange={(e) => setInsuranceUrl(e.target.value)}
                      />
                      <Button
                        variant="outline" size="sm"
                        className="flex-shrink-0"
                        disabled={!insuranceUrl.trim()}
                        onClick={() => { addDocUrl(DOC_TYPES[1].key, insuranceUrl); setInsuranceUrl(''); }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Added docs list */}
                  {docs.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-500">Documents ajoutés</Label>
                      {docs.map((doc, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-sm">
                          <ShieldCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <span className="flex-1 truncate text-slate-700">
                            {DOC_TYPES.find(d => d.key === doc.type)?.label || doc.type}
                          </span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeDoc(i)}>
                            <Trash2 className="h-3 w-3 text-slate-400" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Portfolio images */}
                  <div className="space-y-2 mt-4">
                    <Label className="text-sm">Photos de portfolio</Label>
                    {portfolioUrls.map((pUrl, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          placeholder="URL de l&apos;image"
                          value={pUrl}
                          onChange={(e) => updatePortfolioUrl(i, e.target.value)}
                        />
                        {portfolioUrls.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0" onClick={() => removePortfolioUrl(i)}>
                            <Trash2 className="h-4 w-4 text-slate-400" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {portfolioUrls.length < MAX_PORTFOLIO && (
                      <Button variant="ghost" size="sm" onClick={addPortfolioUrl}>
                        <Plus className="h-3 w-3 mr-1" /> Ajouter une photo
                      </Button>
                    )}
                  </div>
                </>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button
                  variant="ghost" size="sm"
                  onClick={() => setStep(Math.max(0, step - 1))}
                  disabled={step === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Retour
                </Button>

                {step < STEPS.length - 1 ? (
                  <Button
                    size="sm"
                    disabled={!canProceed()}
                    onClick={() => setStep(step + 1)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={submitting}
                    onClick={handleSubmit}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-1">
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Envoi...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Valider l&apos;inscription
                      </span>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
